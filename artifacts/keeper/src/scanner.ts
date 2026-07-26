/**
 * scanner.ts — reads on-chain vault state and returns liquidation candidates.
 *
 * Flow:
 *  1. getVaultOwners() → all addresses that have ever deposited
 *  2. For each owner: read debt + healthFactor in parallel
 *  3. Filter: debt > 0 AND healthFactor < WAD (1e18)
 *  4. For each undercollateralized owner: read collateralDeposits for each token
 *  5. Return LiquidationCandidate[] sorted by healthFactor ascending (worst first)
 */

import { createPublicClient, http, formatUnits } from "viem";
import { CONTRACTS, COLLATERAL_TOKENS, RPC_URL, CHAIN_ID } from "./config.js";
import { VAULT_ENGINE_ABI, ORACLE_ABI } from "./abis.js";

const WAD = BigInt("1000000000000000000"); // 1e18
const MAX_UINT = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

export interface CollateralInfo {
  token:    `0x${string}`;
  symbol:   string;
  decimals: number;
  amount:   bigint;     // raw token units
  priceUsd: number;     // per token, from oracle
  valueUsd: number;     // amount × price (normalized)
}

export interface LiquidationCandidate {
  owner:        string;
  debtRaw:      bigint;        // USDAX wei (18 dec)
  debtUsd:      number;
  healthFactor: number;        // < 1.0 means liquidatable
  collaterals:  CollateralInfo[];
}

const robinhoodChain = {
  id: CHAIN_ID,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
} as const;

export const publicClient = createPublicClient({
  chain:     robinhoodChain,
  transport: http(RPC_URL, { timeout: 20_000 }),
});

/** Fetch on-chain price (USD, 18-dec) from ChainlinkPriceOracle */
async function getPrice(token: `0x${string}`): Promise<bigint> {
  try {
    const [price] = await publicClient.readContract({
      address:      CONTRACTS.oracle,
      abi:          ORACLE_ABI,
      functionName: "getPrice",
      args:         [token],
    });
    return price;
  } catch {
    return 0n;
  }
}

/** Return all vault owners with active debt and HF < 1.0 */
export async function scanVaults(): Promise<LiquidationCandidate[]> {
  // 1. Get all owners
  const owners = await publicClient.readContract({
    address:      CONTRACTS.vaultEngine,
    abi:          VAULT_ENGINE_ABI,
    functionName: "getVaultOwners",
  }) as readonly `0x${string}`[];

  if (owners.length === 0) return [];

  // 2. Read debt + HF for all owners in parallel
  const debtCalls = owners.map(o => publicClient.readContract({
    address:      CONTRACTS.vaultEngine,
    abi:          VAULT_ENGINE_ABI,
    functionName: "debt",
    args:         [o],
  }));

  const hfCalls = owners.map(o => publicClient.readContract({
    address:      CONTRACTS.vaultEngine,
    abi:          VAULT_ENGINE_ABI,
    functionName: "healthFactor",
    args:         [o],
  }));

  const [debts, hfs] = await Promise.all([
    Promise.all(debtCalls),
    Promise.all(hfCalls),
  ]);

  // 3. Filter undercollateralized vaults
  const candidates: Array<{ owner: `0x${string}`; debt: bigint; hf: bigint }> = [];
  for (let i = 0; i < owners.length; i++) {
    const d  = debts[i] as bigint;
    const hf = hfs[i]  as bigint;
    if (d > 0n && hf < WAD && hf !== MAX_UINT) {
      candidates.push({ owner: owners[i], debt: d, hf });
    }
  }

  if (candidates.length === 0) return [];

  // 4. Fetch oracle prices + collateral deposits for each candidate
  const prices = await Promise.all(
    COLLATERAL_TOKENS.map(ct => getPrice(ct.address))
  );

  const results: LiquidationCandidate[] = await Promise.all(
    candidates.map(async ({ owner, debt, hf }) => {
      const depositReads = COLLATERAL_TOKENS.map(ct =>
        publicClient.readContract({
          address:      CONTRACTS.vaultEngine,
          abi:          VAULT_ENGINE_ABI,
          functionName: "collateralDeposits",
          args:         [owner, ct.address],
        })
      );
      const deposits = await Promise.all(depositReads) as bigint[];

      const collaterals: CollateralInfo[] = COLLATERAL_TOKENS
        .map((ct, idx) => {
          const amount   = deposits[idx];
          const price18  = prices[idx];
          // normalize to USD: amount (tokenDecimals) * price (18 dec) / 10^tokenDecimals
          const valueRaw = (amount * price18) / BigInt(10 ** ct.decimals);
          const priceUsd = Number(formatUnits(price18, 18));
          const valueUsd = Number(formatUnits(valueRaw, 18));
          return { token: ct.address, symbol: ct.symbol, decimals: ct.decimals, amount, priceUsd, valueUsd };
        })
        .filter(c => c.amount > 0n);

      return {
        owner,
        debtRaw:      debt,
        debtUsd:      Number(formatUnits(debt, 18)),
        healthFactor: Number(formatUnits(hf, 18)),
        collaterals,
      };
    })
  );

  // Sort worst HF first
  return results.sort((a, b) => a.healthFactor - b.healthFactor);
}
