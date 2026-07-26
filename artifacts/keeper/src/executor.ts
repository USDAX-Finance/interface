/**
 * executor.ts — executes liquidations on-chain.
 *
 * For each candidate:
 *  1. Choose collateral token: largest USD value first (most bonus)
 *  2. Compute debtToRepay = min(50% of vault debt, keeper USDAX balance)
 *  3. Estimate profit: collWithBonus × tokenPrice − debtToRepay
 *  4. Skip if estimated profit < MIN_PROFIT_USD
 *  5. Approve USDAX spend (if allowance < debtToRepay)
 *  6. Call VaultEngine.liquidate() — wait for receipt
 *  7. Log structured result
 */

import {
  createWalletClient,
  http, formatUnits, parseUnits, parseGwei, parseEventLogs,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { Hash } from "viem";
import { CONTRACTS, COLLATERAL_TOKENS, KEEPER_PRIVATE_KEY, RPC_URL, CHAIN_ID,
         MIN_PROFIT_USD, MAX_GAS_PRICE_GWEI, DRY_RUN } from "./config.js";
import { VAULT_ENGINE_ABI, USDAX_ABI } from "./abis.js";
import type { LiquidationCandidate, CollateralInfo } from "./scanner.js";
import { publicClient } from "./scanner.js";

// ── Wallet setup ──────────────────────────────────────────────────────────────

const account = privateKeyToAccount(KEEPER_PRIVATE_KEY);

const robinhoodChain = {
  id: CHAIN_ID,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
} as const;

const walletClient = createWalletClient({
  account,
  chain:     robinhoodChain,
  transport: http(RPC_URL, { timeout: 30_000 }),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LiquidationResult {
  owner:           string;
  collToken:       string;
  collSymbol:      string;
  debtRepaid:      number;
  collSeized:      number;
  collSeizedUsd:   number;
  estimatedProfit: number;
  txHash:          Hash | null;
  skipped:         boolean;
  skipReason?:     string;
  error?:          string;
}

// ── Retry helper ─────────────────────────────────────────────────────────────

/**
 * Wrap an async RPC call with exponential-backoff retry.
 * Only retries on transient network/timeout errors — contract reverts are
 * rethrown immediately without wasting attempts.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 1_000,
  label = "rpc",
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
      const isRetryable =
        msg.includes("timeout") || msg.includes("etimedout") ||
        msg.includes("econnreset") || msg.includes("network") ||
        msg.includes("fetch failed") || msg.includes("connection refused");
      if (!isRetryable || attempt === maxAttempts) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt - 1); // 1 s, 2 s
      console.error(JSON.stringify({
        time: new Date().toISOString(),
        msg: `${label}: retry ${attempt}/${maxAttempts} in ${delay}ms`,
        error: msg,
      }));
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Get keeper's current USDAX balance (with retry) */
async function keeperUsdaxBalance(): Promise<bigint> {
  return withRetry(
    () => publicClient.readContract({
      address:      CONTRACTS.usdax,
      abi:          USDAX_ABI,
      functionName: "balanceOf",
      args:         [account.address],
    }) as Promise<bigint>,
    3, 1_000, "balanceOf",
  );
}

/** Get keeper's current gas price; returns null if above MAX_GAS_PRICE_GWEI (with retry) */
async function safeGasPrice(): Promise<bigint | null> {
  const gp = await withRetry(() => publicClient.getGasPrice(), 3, 1_000, "getGasPrice");
  const maxGp = parseGwei(String(MAX_GAS_PRICE_GWEI));
  if (gp > maxGp) return null;
  return gp;
}

/**
 * Estimate liquidation profit in USD.
 *  - Liquidator repays debtToRepay USDAX ($1 each)
 *  - Receives collAmount * (1 + liquidationBonus%) of the collateral token
 *  - liquidationBonus on all current tokens = 5% (500 bps)
 *  - profit ≈ collAmount × tokenPrice × 5% − gas cost (ignored in estimate)
 */
function estimateProfit(debtRepaidUsd: number, tokenPriceUsd: number): number {
  // 5% bonus on the collateral equivalent of debtRepaid
  const collValueUsd = debtRepaidUsd; // 1 USDAX = $1 debt repaid
  const bonus = collValueUsd * 0.05;  // 5% liq bonus
  return bonus;
}

/** Ensure USDAX allowance ≥ amount; send approve tx if needed */
async function ensureAllowance(amount: bigint, gasPrice: bigint): Promise<void> {
  const allowance = await publicClient.readContract({
    address:      CONTRACTS.usdax,
    abi:          USDAX_ABI,
    functionName: "allowance",
    args:         [account.address, CONTRACTS.vaultEngine],
  }) as bigint;

  if (allowance >= amount) return;

  // Approve max uint256 to avoid repeated approve txs
  const MAX = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
  const hash = await walletClient.writeContract({
    account,
    address:      CONTRACTS.usdax,
    abi:          USDAX_ABI,
    functionName: "approve",
    args:         [CONTRACTS.vaultEngine, MAX],
    gasPrice,
  });
  await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 });
}

// ── Main executor ─────────────────────────────────────────────────────────────

export async function executeLiquidations(
  candidates: LiquidationCandidate[],
  log: (msg: string, data?: object) => void,
): Promise<LiquidationResult[]> {
  const results: LiquidationResult[] = [];

  // Prefetch keeper balance + gas price once per cycle
  const [usdaxBalance, gasPrice] = await Promise.all([
    keeperUsdaxBalance(),
    safeGasPrice(),
  ]);

  const LOW_BALANCE_THRESHOLD = parseUnits("50", 18); // 50 USDAX warning threshold

  log("executor: keeper state", {
    keeperAddress: account.address,
    usdaxBalance:  Number(formatUnits(usdaxBalance, 18)).toFixed(2),
    gasPrice:      gasPrice ? Number(formatUnits(gasPrice, 9)).toFixed(2) + " gwei" : "ABOVE MAX",
  });

  // ── Balance warnings ────────────────────────────────────────────────────
  if (usdaxBalance === 0n) {
    log("executor: CRITICAL — keeper USDAX balance is zero, all liquidations will be skipped. Fund wallet immediately.", {
      keeperAddress: account.address,
    });
  } else if (usdaxBalance < LOW_BALANCE_THRESHOLD) {
    log("executor: WARNING — keeper USDAX balance low, missed liquidations possible if not topped up soon", {
      keeperAddress: account.address,
      balance:       Number(formatUnits(usdaxBalance, 18)).toFixed(2),
      threshold:     "50.00",
    });
  }

  if (gasPrice === null) {
    log("executor: gas price exceeds MAX_GAS_PRICE_GWEI — skipping all liquidations", { MAX_GAS_PRICE_GWEI });
    return candidates.map(c => ({
      owner: c.owner, collToken: "", collSymbol: "", debtRepaid: 0,
      collSeized: 0, collSeizedUsd: 0, estimatedProfit: 0,
      txHash: null, skipped: true, skipReason: "gas price too high",
    }));
  }

  for (const candidate of candidates) {
    // Pick best collateral: largest USD value (most reward)
    const sorted = [...candidate.collaterals].sort((a, b) => b.valueUsd - a.valueUsd);
    const bestColl: CollateralInfo | undefined = sorted[0];

    if (!bestColl) {
      results.push({
        owner: candidate.owner, collToken: "", collSymbol: "", debtRepaid: 0,
        collSeized: 0, collSeizedUsd: 0, estimatedProfit: 0,
        txHash: null, skipped: true, skipReason: "no collateral deposits found",
      });
      continue;
    }

    // debtToRepay = min(50% of vault debt, keeper USDAX balance)
    const halfDebt    = candidate.debtRaw / 2n;
    const debtToRepay = halfDebt < usdaxBalance ? halfDebt : usdaxBalance;

    if (debtToRepay === 0n) {
      results.push({
        owner: candidate.owner, collToken: bestColl.token, collSymbol: bestColl.symbol,
        debtRepaid: 0, collSeized: 0, collSeizedUsd: 0, estimatedProfit: 0,
        txHash: null, skipped: true, skipReason: "keeper has no USDAX balance",
      });
      continue;
    }

    const debtRepaidUsd     = Number(formatUnits(debtToRepay, 18));
    const estimatedProfit   = estimateProfit(debtRepaidUsd, bestColl.priceUsd);

    if (estimatedProfit < MIN_PROFIT_USD) {
      results.push({
        owner: candidate.owner, collToken: bestColl.token, collSymbol: bestColl.symbol,
        debtRepaid: debtRepaidUsd, collSeized: 0, collSeizedUsd: 0, estimatedProfit,
        txHash: null, skipped: true,
        skipReason: `estimated profit $${estimatedProfit.toFixed(2)} < MIN_PROFIT_USD $${MIN_PROFIT_USD}`,
      });
      continue;
    }

    if (DRY_RUN) {
      log("executor: [DRY RUN] would liquidate", {
        owner:           candidate.owner,
        healthFactor:    candidate.healthFactor.toFixed(4),
        debtRepaidUsd:   debtRepaidUsd.toFixed(2),
        collToken:       bestColl.symbol,
        estimatedProfit: `$${estimatedProfit.toFixed(2)}`,
      });
      results.push({
        owner: candidate.owner, collToken: bestColl.token, collSymbol: bestColl.symbol,
        debtRepaid: debtRepaidUsd, collSeized: 0, collSeizedUsd: 0, estimatedProfit,
        txHash: null, skipped: true, skipReason: "dry-run mode",
      });
      continue;
    }

    // Execute: approve → liquidate
    try {
      await ensureAllowance(debtToRepay, gasPrice);

      const txHash = await walletClient.writeContract({
        account,
        address:      CONTRACTS.vaultEngine,
        abi:          VAULT_ENGINE_ABI,
        functionName: "liquidate",
        args:         [candidate.owner as `0x${string}`, debtToRepay, bestColl.token],
        gasPrice,
      });

      const receipt = await withRetry(
        () => publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 90_000 }),
        3, 2_000, "waitForReceipt",
      );

      // Parse actual Liquidated event from receipt — no more estimates
      let collSeized    = 0;
      let collSeizedUsd = 0;
      if (receipt.status === "success") {
        try {
          const events = parseEventLogs({
            abi:       VAULT_ENGINE_ABI,
            logs:      receipt.logs,
            eventName: "Liquidated",
          });
          if (events.length > 0) {
            const args = events[0].args as {
              liquidator: string;
              vaultOwner: string;
              collateralToken: string;
              debtRepaid: bigint;
              collateralSeized: bigint;
            };
            collSeized    = Number(formatUnits(args.collateralSeized, bestColl.decimals));
            collSeizedUsd = collSeized * bestColl.priceUsd;
            log("executor: actual on-chain amounts from Liquidated event", {
              debtRepaid:       Number(formatUnits(args.debtRepaid, 18)).toFixed(4),
              collateralSeized: collSeized.toFixed(6),
              collateralSymbol: bestColl.symbol,
              collSeizedUsd:    `$${collSeizedUsd.toFixed(2)}`,
            });
          }
        } catch {
          // Fallback to estimate if event parsing fails
          const collAmountRaw = (debtToRepay * BigInt(10 ** bestColl.decimals)) / BigInt(Math.floor(bestColl.priceUsd * 1e18));
          const collWithBonus = collAmountRaw + (collAmountRaw * 5n / 100n);
          collSeized    = Number(formatUnits(collWithBonus, bestColl.decimals));
          collSeizedUsd = collSeized * bestColl.priceUsd;
          log("executor: WARNING — could not parse Liquidated event, using estimate", {});
        }
      }

      results.push({
        owner:           candidate.owner,
        collToken:       bestColl.token,
        collSymbol:      bestColl.symbol,
        debtRepaid:      debtRepaidUsd,
        collSeized,
        collSeizedUsd,
        estimatedProfit: collSeizedUsd - debtRepaidUsd,
        txHash,
        skipped:         receipt.status !== "success",
        skipReason:      receipt.status !== "success" ? "tx reverted" : undefined,
      });

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log("executor: liquidation failed", { owner: candidate.owner, error: msg });
      results.push({
        owner: candidate.owner, collToken: bestColl.token, collSymbol: bestColl.symbol,
        debtRepaid: debtRepaidUsd, collSeized: 0, collSeizedUsd: 0, estimatedProfit,
        txHash: null, skipped: true, error: msg,
      });
    }
  }

  return results;
}
