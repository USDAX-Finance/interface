/**
 * Testnet price oracle.
 * In production these are sourced from Chainlink / Robinhood Chain price feeds.
 */
export const TOKEN_PRICES: Record<string, number> = {
  // Crypto
  WETH:     3247.50,
  WBTC:     67823.00,
  stETH:    3190.00,
  // RWA (pegged to NAV)
  "RWA-TB": 1.00,
  "RWA-RE": 1.00,
  "RWA-CB": 1.00,
  // Robinhood Chain Stock Tokens
  TSLA:     315.00,
  AMZN:     225.00,
  PLTR:     45.00,
  NFLX:     1050.00,
  AMD:      155.00,
  NVDA:     135.00,
  AAPL:     230.00,
};

/**
 * APX governance token price.
 * Set this from your live price feed before launch.
 * Returns 0 until configured — the API will surface 0 for APX-derived fields.
 */
export const APX_PRICE = 0;
