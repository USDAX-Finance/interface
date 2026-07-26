/**
 * On-chain contract addresses — Robinhood Chain Testnet (46630)
 * Deployed via Foundry. Update these when re-deploying.
 */
export const CONTRACTS = {
  WETH:               (process.env.CONTRACT_WETH               ?? "") as `0x${string}`,
  WBTC:               (process.env.CONTRACT_WBTC               ?? "") as `0x${string}`,
  stETH:              (process.env.CONTRACT_STETH              ?? "") as `0x${string}`,
  oracle:             (process.env.CONTRACT_ORACLE             ?? "") as `0x${string}`,
  collateralManager:  (process.env.CONTRACT_COLLATERAL_MANAGER ?? "") as `0x${string}`,
  usdax:              (process.env.CONTRACT_USDAX              ?? "") as `0x${string}`,
  vaultEngine:        (process.env.CONTRACT_VAULT_ENGINE       ?? "") as `0x${string}`,
  savings:            (process.env.CONTRACT_SAVINGS            ?? "") as `0x${string}`,
} as const;

/** Map token symbol → on-chain address */
export const TOKEN_ADDRESS: Record<string, `0x${string}`> = {
  WETH:  CONTRACTS.WETH,
  WBTC:  CONTRACTS.WBTC,
  stETH: CONTRACTS.stETH,
};

/** Map on-chain address (lowercase) → token symbol */
export const ADDRESS_TO_SYMBOL: Record<string, string> = Object.fromEntries(
  Object.entries(TOKEN_ADDRESS).map(([sym, addr]) => [addr.toLowerCase(), sym])
);

export const CHAIN_ID = Number(process.env.CHAIN_ID ?? 46630);
export const RPC_URL  = process.env.RPC_URL ?? "https://rpc.testnet.chain.robinhood.com/rpc";

// ── Mainnet contracts (Robinhood Chain 4663) ──────────────────────────────────
export const MAINNET_CONTRACTS = {
  apx:        (process.env.CONTRACT_APX         ?? "0x42523E3e454B97ff8651926685aFAD61C950Ab2F") as `0x${string}`,
  apxStaking: (process.env.CONTRACT_APX_STAKING ?? "0x00b6792ac02caf607d0b6ea4a6f572a83472412f") as `0x${string}`,
} as const;
