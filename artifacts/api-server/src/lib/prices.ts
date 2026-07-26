/**
 * Token price cache — sourced from the on-chain ChainlinkPriceOracle (WETH/WBTC/stETH)
 * and from DexScreener (APX). Other tokens use static fallbacks.
 *
 * getTokenPrices() is the single authoritative read — all routes should import that.
 */

// Mutable cache — refreshed every 60s from on-chain oracle
let _cryptoPrices: Record<string, number> = {
  WETH:  3247.50,
  WBTC:  67823.00,
  stETH: 3190.00,
};

/** Refresh WETH/WBTC/stETH from the deployed ChainlinkPriceOracle (or fallback prices). */
async function refreshCryptoPrices(): Promise<void> {
  try {
    // Import lazily to avoid circular deps at module load time
    const { getOnChainPrices } = await import("./blockchain.js");
    const prices = await getOnChainPrices();
    if (prices.WETH  > 0) _cryptoPrices.WETH  = prices.WETH;
    if (prices.WBTC  > 0) _cryptoPrices.WBTC  = prices.WBTC;
    if (prices.stETH > 0) _cryptoPrices.stETH = prices.stETH;
  } catch {
    // Keep cached values on failure
  }
}

// Fire immediately, then every 60 s
refreshCryptoPrices();
setInterval(refreshCryptoPrices, 60_000);

/** Live token prices. WETH/WBTC/stETH = on-chain oracle; others = static. */
export const TOKEN_PRICES: Record<string, number> = new Proxy(
  {
    // RWA (pegged to NAV)
    "RWA-TB": 1.00,
    "RWA-RE": 1.00,
    "RWA-CB": 1.00,
    // Robinhood Chain Stock Tokens
    TSLA:  315.00,
    AMZN:  225.00,
    PLTR:   45.00,
    NFLX: 1050.00,
    AMD:   155.00,
    NVDA:  135.00,
    AAPL:  230.00,
  },
  {
    get(target, prop: string) {
      if (prop in _cryptoPrices) return _cryptoPrices[prop];
      return target[prop as keyof typeof target];
    },
    has(target, prop: string) {
      return prop in _cryptoPrices || prop in target;
    },
  }
);

/**
 * APX token price — fetched live from DexScreener (pair on Robinhood Chain mainnet).
 * Refreshes every 60 seconds. Falls back to 0 if unreachable.
 */
const DS_APX_URL = "https://api.dexscreener.com/latest/dex/pairs/robinhood/0x8c82ce618f1fcd05aa0499a231410f0f659bef2d";

let _apxPrice = 0;

async function refreshApxPrice() {
  try {
    const res  = await fetch(DS_APX_URL, { signal: AbortSignal.timeout(8_000) });
    const json = await res.json() as { pairs?: { priceUsd?: string }[] };
    const raw  = parseFloat(json?.pairs?.[0]?.priceUsd ?? "0");
    if (raw > 0) _apxPrice = raw;
  } catch {
    // keep existing cached value
  }
}

// Fire immediately on startup, then refresh every 60 s
refreshApxPrice();
setInterval(refreshApxPrice, 60_000);

/** Live APX/USD price — updates every 60 s from DexScreener. */
export function getApxPrice(): number { return _apxPrice; }

/** @deprecated use getApxPrice() — kept for backward compat */
export const APX_PRICE = 0;
