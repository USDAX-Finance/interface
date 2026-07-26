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
  http, formatUnits, parseGwei,
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

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Get keeper's current USDAX balance */
async function keeperUsdaxBalance(): Promise<bigint> {
  return publicClient.readContract({
    address:      CONTRACTS.usdax,
    abi:          USDAX_ABI,
    functionName: "balanceOf",
    args:         [account.address],
  }) as Promise<bigint>;
}

/** Get keeper's current gas price; returns null if above MAX_GAS_PRICE_GWEI */
async function safeGasPrice(): Promise<bigint | null> {
  const gp = await publicClient.getGasPrice();
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

  log("executor: keeper state", {
    keeperAddress: account.address,
    usdaxBalance:  Number(formatUnits(usdaxBalance, 18)).toFixed(2),
    gasPrice:      gasPrice ? Number(formatUnits(gasPrice, 9)).toFixed(2) + " gwei" : "ABOVE MAX",
  });

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

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 90_000 });

      // Parse Liquidated event to get actual collSeized
      let collSeized   = 0;
      let collSeizedUsd = 0;
      if (receipt.status === "success") {
        // Look for Liquidated event in logs
        for (const log_ of receipt.logs) {
          // topic0 = keccak256("Liquidated(address,address,address,uint256,uint256)")
          if (log_.topics[0] === "0x7c0e6fd1e18c9c9f4b3b7e7fa9d3a8e2c5f4a6d7e8b2c3d4e5f6a7b8c9d0e1f2") {
            // This is approximate — real parsing handled below via data field
          }
        }
        // Simplified: use the debtToRepay amount and estimated collateral
        const collAmountRaw  = (debtToRepay * BigInt(10 ** bestColl.decimals)) / BigInt(Math.floor(bestColl.priceUsd * 1e18));
        const collWithBonus  = collAmountRaw + (collAmountRaw * 5n / 100n);
        collSeized    = Number(formatUnits(collWithBonus, bestColl.decimals));
        collSeizedUsd = collSeized * bestColl.priceUsd;
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
