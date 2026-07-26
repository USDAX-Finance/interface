/**
 * Oracle Price Refresher
 *
 * On Robinhood Chain Testnet (46630) there are no live Chainlink feeds.
 * The ChainlinkPriceOracle falls back to admin-set prices — but those expire
 * after 24 hours. This module keeps them current by:
 *
 *   1. Fetching real-time USD prices from CoinGecko (free, no key)
 *   2. Calling setFallbackPrices() on the oracle contract every ORACLE_REFRESH_MS
 *
 * Requires ORACLE_UPDATER_KEY (defaults to DEPLOYER_PRIVATE_KEY) — must be
 * the oracle contract owner.
 */

import {
  createWalletClient,
  createPublicClient,
  http,
  parseUnits,
  formatUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { RPC_URL, CHAIN_ID, CONTRACTS, ORACLE_UPDATER_KEY, ORACLE_REFRESH_MS } from "./config.js";
import { ORACLE_ABI } from "./abis.js";

// CoinGecko free tier — no API key required
const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,staked-ether&vs_currencies=usd";

// Last-known prices (initialised to 0; updated on first successful fetch)
let _lastPrices: Record<string, number> = { WETH: 0, WBTC: 0, stETH: 0 };

/** Fetch USD prices from CoinGecko. Returns null on failure. */
async function fetchPrices(): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(COINGECKO_URL, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json() as {
      ethereum?: { usd: number };
      bitcoin?: { usd: number };
      "staked-ether"?: { usd: number };
    };
    const eth   = json.ethereum?.usd ?? 0;
    const btc   = json.bitcoin?.usd ?? 0;
    const steth = json["staked-ether"]?.usd ?? 0;
    if (eth <= 0 || btc <= 0 || steth <= 0) throw new Error("Zero price returned");
    return { WETH: eth, WBTC: btc, stETH: steth };
  } catch (err) {
    return null;
  }
}

/** Convert a USD float to 18-decimal bigint for the oracle contract. */
function toWad(usd: number): bigint {
  // parseUnits works on a string with up to 18 decimal places
  return parseUnits(usd.toFixed(8), 18);
}

/** Push prices to the on-chain oracle via setFallbackPrices(). */
async function pushPrices(
  prices: Record<string, number>,
  log: (msg: string, data?: object) => void,
): Promise<void> {
  const account = privateKeyToAccount(ORACLE_UPDATER_KEY);

  const chain = {
    id: CHAIN_ID,
    name: "Robinhood Chain Testnet",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [RPC_URL] } },
  } as const;

  const walletClient = createWalletClient({ account, chain, transport: http(RPC_URL) });
  const publicClient = createPublicClient({ chain, transport: http(RPC_URL) });

  // token addresses + matching prices (18 decimals)
  const tokens: `0x${string}`[] = [CONTRACTS.WETH, CONTRACTS.WBTC, CONTRACTS.stETH];
  const wadPrices: bigint[]      = [toWad(prices.WETH), toWad(prices.WBTC), toWad(prices.stETH)];

  const { request } = await publicClient.simulateContract({
    address: CONTRACTS.oracle,
    abi:     ORACLE_ABI,
    functionName: "setFallbackPrices",
    args:    [tokens, wadPrices],
    account,
  });

  const hash = await walletClient.writeContract(request);
  await publicClient.waitForTransactionReceipt({ hash, timeout: 30_000 });

  log("oracle: prices updated on-chain", {
    txHash: hash,
    WETH:   `$${prices.WETH.toFixed(2)}`,
    WBTC:   `$${prices.WBTC.toFixed(2)}`,
    stETH:  `$${prices.stETH.toFixed(2)}`,
    updater: account.address,
  });
}

/** Run one refresh cycle: fetch → push. */
async function refreshOracle(log: (msg: string, data?: object) => void): Promise<void> {
  log("oracle: fetching prices from CoinGecko");
  const prices = await fetchPrices();

  if (!prices) {
    log("oracle: CoinGecko fetch failed — skipping update", {
      lastKnown: {
        WETH:  `$${_lastPrices.WETH.toFixed(2)}`,
        WBTC:  `$${_lastPrices.WBTC.toFixed(2)}`,
        stETH: `$${_lastPrices.stETH.toFixed(2)}`,
      },
    });
    return;
  }

  _lastPrices = prices;

  try {
    await pushPrices(prices, log);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log("oracle: on-chain update failed", { error: msg });
  }
}

/**
 * Start the oracle refresher.
 * Runs once immediately, then every ORACLE_REFRESH_MS milliseconds.
 */
export function startOracleRefresher(log: (msg: string, data?: object) => void): void {
  const intervalSec = Math.round(ORACLE_REFRESH_MS / 1000);

  log("oracle: refresher starting", {
    refreshIntervalSec: intervalSec,
    oracle: CONTRACTS.oracle,
    updater: "(see ORACLE_UPDATER_KEY)",
  });

  // Run immediately on startup
  refreshOracle(log).catch(err => {
    log("oracle: unexpected error in refresher", { error: String(err) });
  });

  // Then on schedule
  setInterval(() => {
    refreshOracle(log).catch(err => {
      log("oracle: unexpected error in refresher", { error: String(err) });
    });
  }, ORACLE_REFRESH_MS);
}
