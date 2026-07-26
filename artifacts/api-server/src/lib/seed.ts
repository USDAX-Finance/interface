/**
 * Shared risk parameters for the USDAX protocol.
 * TOKEN_PRICES — testnet mock prices. On mainnet these come from the on-chain
 *   MockPriceOracle (contracts/src/MockPriceOracle.sol) or Chainlink feeds.
 * LIQ_THRESH   — liquidation thresholds per token, must match CollateralManager
 *   config deployed via contracts/script/Deploy.s.sol.
 *
 * Only WETH, WBTC, and stETH are currently whitelisted in the deployed
 * VaultEngine on Robinhood Chain Testnet (chain 46630).
 * RWA and stock token entries below are reserved for future collateral types.
 */

export const TOKEN_PRICES: Record<string, number> = {
  // ── Deployed on-chain (Robinhood Chain Testnet) ──────────────────────────
  WETH:     2000.0,   // matches MockPriceOracle seed in Deploy.s.sol
  WBTC:     65000.0,  // matches MockPriceOracle seed
  stETH:    1980.0,   // matches MockPriceOracle seed
  // ── Future collateral types (not yet deployed) ───────────────────────────
  "RWA-TB": 1.00,
  "RWA-RE": 1.00,
  "RWA-CB": 1.00,
  TSLA:     315.0,
  AMZN:     225.0,
  PLTR:     45.0,
  NFLX:     1050.0,
  AMD:      155.0,
  NVDA:     135.0,
  AAPL:     230.0,
};

/**
 * Liquidation thresholds per token (basis: 1.0 = 100%).
 * On-chain these are stored in CollateralManager as basis points (e.g. 8500 = 85%).
 * WETH: 85%, WBTC: 80%, stETH: 80% — match Deploy.s.sol exactly.
 */
export const LIQ_THRESH: Record<string, number> = {
  // ── Deployed collateral (must match CollateralManager on-chain) ──────────
  WETH:     0.85,
  WBTC:     0.80,
  stETH:    0.80,
  // ── Future collateral types ───────────────────────────────────────────────
  "RWA-TB": 0.95,
  "RWA-RE": 0.73,
  "RWA-CB": 0.83,
  TSLA:     0.67,
  AMZN:     0.72,
  PLTR:     0.63,
  NFLX:     0.70,
  AMD:      0.68,
  NVDA:     0.72,
  AAPL:     0.75,
};
