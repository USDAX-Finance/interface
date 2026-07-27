/**
 * Keeper bot configuration — all sourced from environment variables.
 *
 * Required:
 *   KEEPER_PRIVATE_KEY  — private key (no 0x prefix) of the keeper wallet.
 *                          For testnet: reuse DEPLOYER_PRIVATE_KEY value.
 *                          The wallet must hold: ETH for gas, USDAX for liquidations.
 *
 * Optional:
 *   RPC_URL             — default: https://rpc.testnet.chain.robinhood.com/rpc
 *   CHAIN_ID            — default: 46630
 *   SCAN_INTERVAL_MS    — default: 300000 (5 min)
 *   MIN_PROFIT_USD      — default: 5  (skip liquidation if estimated bonus < $5)
 *   MAX_GAS_PRICE_GWEI  — default: 50 (skip if network gas price exceeds this)
 *
 * Contract addresses (sourced from environment variables):
 *   CONTRACT_VAULT_ENGINE, CONTRACT_USDAX, CONTRACT_WETH, CONTRACT_WBTC,
 *   CONTRACT_STETH, CONTRACT_ORACLE
 */

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function addr(key: string): `0x${string}` {
  const v = process.env[key];
  if (!v) throw new Error(`Missing contract address env var: ${key}`);
  if (!v.startsWith("0x")) throw new Error(`${key} must start with 0x`);
  return v as `0x${string}`;
}

// Raw private key — require 0x prefix or add it
const rawKey = process.env.KEEPER_PRIVATE_KEY ?? process.env.DEPLOYER_PRIVATE_KEY ?? "";
if (!rawKey) throw new Error("KEEPER_PRIVATE_KEY (or DEPLOYER_PRIVATE_KEY) must be set");

export const KEEPER_PRIVATE_KEY: `0x${string}` = rawKey.startsWith("0x")
  ? (rawKey as `0x${string}`)
  : (`0x${rawKey}` as `0x${string}`);

export const RPC_URL       = process.env.RPC_URL ?? "https://rpc.testnet.chain.robinhood.com/rpc";
export const CHAIN_ID      = Number(process.env.CHAIN_ID ?? 46630);

export const SCAN_INTERVAL_MS   = Number(process.env.SCAN_INTERVAL_MS   ?? 300_000); // 5 min
export const MIN_PROFIT_USD     = Number(process.env.MIN_PROFIT_USD     ?? 5);        // USD
export const MAX_GAS_PRICE_GWEI = Number(process.env.MAX_GAS_PRICE_GWEI ?? 50);

// Oracle refresher — only needed on testnet (no live Chainlink feeds)
export const ORACLE_REFRESH_MS = Number(process.env.ORACLE_REFRESH_MS ?? 1_800_000); // 30 min

// Key used to call setFallbackPrices() — must be oracle contract owner (deployer)
const rawOracleKey =
  process.env.ORACLE_UPDATER_KEY ??
  process.env.DEPLOYER_PRIVATE_KEY ??
  "";
if (!rawOracleKey) throw new Error("ORACLE_UPDATER_KEY (or DEPLOYER_PRIVATE_KEY) must be set");
export const ORACLE_UPDATER_KEY: `0x${string}` = rawOracleKey.startsWith("0x")
  ? (rawOracleKey as `0x${string}`)
  : (`0x${rawOracleKey}` as `0x${string}`);

export const CONTRACTS = {
  vaultEngine: addr("CONTRACT_VAULT_ENGINE"),
  usdax:       addr("CONTRACT_USDAX"),
  oracle:      addr("CONTRACT_ORACLE"),
  WETH:        addr("CONTRACT_WETH"),
  WBTC:        addr("CONTRACT_WBTC"),
  stETH:       addr("CONTRACT_STETH"),
} as const;

/** Whitelisted collateral tokens (address → symbol) */
export const COLLATERAL_TOKENS: Array<{ address: `0x${string}`; symbol: string; decimals: number }> = [
  { address: CONTRACTS.WETH,  symbol: "WETH",  decimals: 18 },
  { address: CONTRACTS.WBTC,  symbol: "WBTC",  decimals: 8  },
  { address: CONTRACTS.stETH, symbol: "stETH", decimals: 18 },
];

export const DRY_RUN = process.argv.includes("--dry-run") || process.env.DRY_RUN === "true";
