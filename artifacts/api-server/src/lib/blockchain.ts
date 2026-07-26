/**
 * Blockchain reader — reads live data from deployed USDAX contracts.
 * Uses viem (public client, no wallet needed for reads).
 */
import { createPublicClient, http, formatUnits } from "viem";
import { CONTRACTS, RPC_URL, ADDRESS_TO_SYMBOL } from "./contracts.js";
import ABIS from "./abis.json" assert { type: "json" };

// ── viem public client (read-only) ───────────────────────────────────────────
const robinhoodTestnet = {
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
} as const;

export const publicClient = createPublicClient({
  chain: robinhoodTestnet,
  transport: http(RPC_URL, { timeout: 10_000 }),
});

// ── ABI helpers ───────────────────────────────────────────────────────────────
const vaultAbi              = ABIS.VaultEngine       as readonly unknown[];
const usdaxAbi              = ABIS.USDAxToken        as readonly unknown[];
const collateralManagerAbi  = ABIS.CollateralManager as readonly unknown[];
const oracleAbi             = ABIS.ChainlinkPriceOracle as readonly unknown[];

// ── Protocol-level reads ──────────────────────────────────────────────────────

/** Total USDAX in circulation */
export async function getUsdaxSupply(): Promise<number> {
  const raw = await publicClient.readContract({
    address: CONTRACTS.usdax,
    abi: usdaxAbi,
    functionName: "totalSupply",
  }) as bigint;
  return Number(formatUnits(raw, 18));
}

/** All vault owners registered in VaultEngine */
export async function getVaultOwners(): Promise<string[]> {
  const owners = await publicClient.readContract({
    address: CONTRACTS.vaultEngine,
    abi: vaultAbi,
    functionName: "getVaultOwners",
  }) as string[];
  return owners;
}

/** Debt for a single user */
export async function getUserDebt(user: `0x${string}`): Promise<number> {
  const raw = await publicClient.readContract({
    address: CONTRACTS.vaultEngine,
    abi: vaultAbi,
    functionName: "debt",
    args: [user],
  }) as bigint;
  return Number(formatUnits(raw, 18));
}

/** Health factor for a user (returns Infinity when no debt) */
export async function getHealthFactor(user: `0x${string}`): Promise<number> {
  const raw = await publicClient.readContract({
    address: CONTRACTS.vaultEngine,
    abi: vaultAbi,
    functionName: "healthFactor",
    args: [user],
  }) as bigint;
  // HF is WAD (1e18 = 1.0). Max uint256 means no debt.
  if (raw === BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")) return 999;
  return Number(formatUnits(raw, 18));
}

/** Raw (unadjusted) collateral USD value for a user */
export async function getRawCollateralValue(user: `0x${string}`): Promise<number> {
  const raw = await publicClient.readContract({
    address: CONTRACTS.vaultEngine,
    abi: vaultAbi,
    functionName: "rawCollateralValue",
    args: [user],
  }) as bigint;
  return Number(formatUnits(raw, 18));
}

/** Max mintable USDAX for a user */
export async function getMaxMintable(user: `0x${string}`): Promise<number> {
  const raw = await publicClient.readContract({
    address: CONTRACTS.vaultEngine,
    abi: vaultAbi,
    functionName: "maxMintable",
    args: [user],
  }) as bigint;
  return Number(formatUnits(raw, 18));
}

/** Collateral deposit amount for user+token */
export async function getCollateralDeposit(
  user: `0x${string}`,
  token: `0x${string}`
): Promise<number> {
  const raw = await publicClient.readContract({
    address: CONTRACTS.vaultEngine,
    abi: vaultAbi,
    functionName: "collateralDeposits",
    args: [user, token],
  }) as bigint;
  return Number(raw); // raw token units, caller handles decimals
}

/** On-chain price for a token (returns USD value as number, 18-dec normalized) */
export async function getOnChainPrice(token: `0x${string}`): Promise<number> {
  try {
    const [price] = await publicClient.readContract({
      address: CONTRACTS.oracle,
      abi: oracleAbi,
      functionName: "getPrice",
      args: [token],
    }) as [bigint, bigint];
    return Number(formatUnits(price, 18));
  } catch {
    return 0;
  }
}

/** Fetch on-chain prices for WETH, WBTC, stETH */
export async function getOnChainPrices(): Promise<Record<string, number>> {
  const [weth, wbtc, steth] = await Promise.all([
    getOnChainPrice(CONTRACTS.WETH),
    getOnChainPrice(CONTRACTS.WBTC),
    getOnChainPrice(CONTRACTS.stETH),
  ]);
  return { WETH: weth, WBTC: wbtc, stETH: steth };
}

/** Current debt including accrued stability fee (view, no state change) */
export async function getCurrentDebt(user: `0x${string}`): Promise<number> {
  const raw = await publicClient.readContract({
    address: CONTRACTS.vaultEngine,
    abi: vaultAbi,
    functionName: "currentDebt",
    args: [user],
  }) as bigint;
  return Number(formatUnits(raw, 18));
}

/** Pending (undripped) stability fee for a user */
export async function getPendingFee(user: `0x${string}`): Promise<number> {
  const raw = await publicClient.readContract({
    address: CONTRACTS.vaultEngine,
    abi: vaultAbi,
    functionName: "pendingFee",
    args: [user],
  }) as bigint;
  return Number(formatUnits(raw, 18));
}

/** Protocol stability fee in basis points (e.g. 500 = 5% APY) */
export async function getStabilityFee(): Promise<number> {
  const raw = await publicClient.readContract({
    address: CONTRACTS.vaultEngine,
    abi: vaultAbi,
    functionName: "stabilityFeePerYear",
  }) as bigint;
  return Number(raw);
}

/** Full snapshot of a user's on-chain vault */
export interface VaultSnapshot {
  owner:          string;
  debt:           number;   // stored principal (pre-drip)
  currentDebt:    number;   // debt + accrued interest (real-time)
  collateralUsd:  number;
  healthFactor:   number;
  maxMintable:    number;
}

export async function getVaultSnapshot(user: `0x${string}`): Promise<VaultSnapshot> {
  const [debt, curDebt, collateralUsd, hf, maxMint] = await Promise.all([
    getUserDebt(user),
    getCurrentDebt(user),
    getRawCollateralValue(user),
    getHealthFactor(user),
    getMaxMintable(user),
  ]);
  return { owner: user, debt, currentDebt: curDebt, collateralUsd, healthFactor: hf, maxMintable: maxMint };
}

/** All active on-chain vaults with debt > 0 */
export async function getAllVaults(): Promise<VaultSnapshot[]> {
  const owners = await getVaultOwners();
  if (owners.length === 0) return [];

  const snapshots = await Promise.all(
    owners.map(o => getVaultSnapshot(o as `0x${string}`))
  );
  return snapshots.filter(v => v.debt > 0);
}
