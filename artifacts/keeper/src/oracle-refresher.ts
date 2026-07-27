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
 * Failure handling:
 *   - On CoinGecko failure: retains last-known prices, increments failure counter.
 *   - After 3 consecutive failures: emits WARNING log.
 *   - If last successful push was > 20 hours ago: emits CRITICAL log — the 24-hour
 *     fallback staleness window is approaching and liquidations may start reverting.
 *
 * Requires ORACLE_UPDATER_KEY (defaults to DEPLOYER_PRIVATE_KEY) — must be
 * the oracle contract owner or designated updater.
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

// ── State ─────────────────────────────────────────────────────────────────────

// Last-known prices (initialised to 0; updated on first successful fetch)
let _lastPrices: Record<string, number> = { WETH: 0, WBTC: 0, stETH: 0 };

// Track consecutive CoinGecko failures so we can warn before the 24-hour
// fallback staleness window causes on-chain reverts.
let _consecutiveFailures = 0;
let _lastSuccessfulPushMs = 0; // epoch ms of last successful setFallbackPrices tx

// Emit a CRITICAL alert once we're within this many milliseconds of the 24-hour window.
const STALENESS_WARN_BEFORE_MS = 4 * 60 * 60 * 1_000; // warn at 20 h elapsed
const ORACLE_STALENESS_WINDOW_MS = 24 * 60 * 60 * 1_000; // 24 h on-chain limit

// ── Helpers ───────────────────────────────────────────────────────────────────

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

  _lastSuccessfulPushMs = Date.now();

  log("oracle: prices updated on-chain", {
    txHash: hash,
    WETH:   `$${prices.WETH.toFixed(2)}`,
    WBTC:   `$${prices.WBTC.toFixed(2)}`,
    stETH:  `$${prices.stETH.toFixed(2)}`,
    updater: account.address,
  });
}

// ── Staleness alert ───────────────────────────────────────────────────────────

/**
 * Check if the last successful price push is dangerously close to the 24-hour
 * on-chain staleness window and emit appropriate log levels.
 */
function checkStalenessRisk(log: (msg: string, data?: object) => void): void {
  if (_lastSuccessfulPushMs === 0) return; // no push yet — handled by consecutive failure check

  const ageMs = Date.now() - _lastSuccessfulPushMs;
  const remainingMs = ORACLE_STALENESS_WINDOW_MS - ageMs;

  if (remainingMs <= 0) {
    log("oracle: CRITICAL — fallback prices have exceeded 24-hour staleness window. " +
        "On-chain price reads are reverting. Keeper liquidations are blocked. " +
        "Manually call setFallbackPrices() immediately.", {
      lastSuccessfulPushAgoHours: (ageMs / 3_600_000).toFixed(1),
      action: "IMMEDIATE MANUAL INTERVENTION REQUIRED",
    });
  } else if (ageMs >= ORACLE_STALENESS_WINDOW_MS - STALENESS_WARN_BEFORE_MS) {
    log("oracle: WARNING — fallback price push is approaching 24-hour expiry. " +
        "If CoinGecko fetch continues to fail, on-chain prices will become stale " +
        "and liquidations will revert.", {
      lastSuccessfulPushAgoHours: (ageMs / 3_600_000).toFixed(1),
      expiresInHours:             (remainingMs / 3_600_000).toFixed(1),
    });
  }
}

// ── Main refresh cycle ────────────────────────────────────────────────────────

/** Run one refresh cycle: fetch → push. */
async function refreshOracle(log: (msg: string, data?: object) => void): Promise<void> {
  log("oracle: fetching prices from CoinGecko");
  const prices = await fetchPrices();

  if (!prices) {
    _consecutiveFailures++;

    const failureData: Record<string, unknown> = {
      consecutiveFailures: _consecutiveFailures,
      lastKnown: {
        WETH:  _lastPrices.WETH > 0 ? `$${_lastPrices.WETH.toFixed(2)}` : "never set",
        WBTC:  _lastPrices.WBTC > 0 ? `$${_lastPrices.WBTC.toFixed(2)}` : "never set",
        stETH: _lastPrices.stETH > 0 ? `$${_lastPrices.stETH.toFixed(2)}` : "never set",
      },
    };

    if (_consecutiveFailures >= 3) {
      log("oracle: WARNING — CoinGecko fetch has failed 3+ times consecutively. " +
          "If this continues, fallback prices will expire and liquidations will fail.", failureData);
    } else {
      log("oracle: CoinGecko fetch failed — skipping update", failureData);
    }

    // Still check staleness risk even if fetch failed
    checkStalenessRisk(log);
    return;
  }

  // Fetch succeeded — reset failure counter
  _consecutiveFailures = 0;
  _lastPrices = prices;

  try {
    await pushPrices(prices, log);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log("oracle: on-chain update failed", { error: msg });
    // Check staleness risk even if the push failed — last successful push may be aging
    checkStalenessRisk(log);
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

/**
 * Start the oracle refresher.
 * Awaits the first refresh before returning so the caller can safely
 * proceed knowing the on-chain prices are fresh (no oracle-stale errors
 * on the first keeper scan cycle).
 * Subsequent refreshes run on the configured interval in the background.
 */
export async function startOracleRefresher(log: (msg: string, data?: object) => void): Promise<void> {
  const intervalSec = Math.round(ORACLE_REFRESH_MS / 1000);

  log("oracle: refresher starting", {
    refreshIntervalSec: intervalSec,
    stalenessWindowH:   24,
    criticalAlertAtH:   20,
    oracle: CONTRACTS.oracle,
    updater: "(see ORACLE_UPDATER_KEY)",
  });

  // Await first refresh — ensures prices are on-chain before the first scan
  await refreshOracle(log).catch(err => {
    log("oracle: unexpected error on initial refresh", { error: String(err) });
  });

  // Schedule subsequent refreshes in the background
  setInterval(() => {
    refreshOracle(log).catch(err => {
      log("oracle: unexpected error in refresher", { error: String(err) });
    });
  }, ORACLE_REFRESH_MS);
}
