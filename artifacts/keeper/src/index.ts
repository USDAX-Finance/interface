/**
 * USDAX Finance — Liquidation Keeper Bot
 *
 * Monitors all open vaults on Robinhood Chain and liquidates undercollateralized
 * positions (health factor < 1.0) to collect the 5% liquidation bonus.
 *
 * Usage:
 *   pnpm --filter @workspace/keeper start           # production
 *   pnpm --filter @workspace/keeper start:dry       # dry-run (no txs sent)
 *   DRY_RUN=true pnpm --filter @workspace/keeper start
 *
 * Config (env vars):
 *   KEEPER_PRIVATE_KEY   — wallet private key (no 0x) — uses DEPLOYER_PRIVATE_KEY as fallback
 *   SCAN_INTERVAL_MS     — default 300000 (5 min)
 *   MIN_PROFIT_USD       — default 5
 *   MAX_GAS_PRICE_GWEI   — default 50
 *   DRY_RUN              — "true" to simulate without sending txs
 */

import { SCAN_INTERVAL_MS, DRY_RUN, CONTRACTS } from "./config.js";
import { scanVaults } from "./scanner.js";
import { executeLiquidations } from "./executor.js";
import { privateKeyToAccount } from "viem/accounts";
import { KEEPER_PRIVATE_KEY } from "./config.js";

// ── Structured logger (console.log with JSON lines) ──────────────────────────

function log(msg: string, data?: object): void {
  const line: Record<string, unknown> = {
    time: new Date().toISOString(),
    msg,
    ...data,
  };
  console.log(JSON.stringify(line));
}

// ── Cycle stats ───────────────────────────────────────────────────────────────

interface CycleStats {
  scanned:       number;
  liquidatable:  number;
  txsSent:       number;
  skipped:       number;
  usdaxRepaid:   number;
  collSeizedUsd: number;
  profitUsd:     number;
  errors:        number;
}

let totalStats: CycleStats = {
  scanned: 0, liquidatable: 0, txsSent: 0, skipped: 0,
  usdaxRepaid: 0, collSeizedUsd: 0, profitUsd: 0, errors: 0,
};

// ── Main scan cycle ───────────────────────────────────────────────────────────

async function runCycle(): Promise<void> {
  const cycleStart = Date.now();
  const stats: CycleStats = {
    scanned: 0, liquidatable: 0, txsSent: 0, skipped: 0,
    usdaxRepaid: 0, collSeizedUsd: 0, profitUsd: 0, errors: 0,
  };

  log("cycle: scan start", { dryRun: DRY_RUN, scanIntervalSec: SCAN_INTERVAL_MS / 1000 });

  try {
    // 1. Scan vaults
    const candidates = await scanVaults();
    stats.scanned     = candidates.length; // this is liquidatable count; owners scanned is unknown without extra call
    stats.liquidatable = candidates.length;

    log("cycle: scan complete", {
      liquidatable:  candidates.length,
      owners:        candidates.map(c => ({
        addr: c.owner.slice(0, 8) + "…",
        hf:   c.healthFactor.toFixed(4),
        debtUsd: c.debtUsd.toFixed(2),
      })),
    });

    if (candidates.length === 0) {
      log("cycle: no liquidatable vaults found");
    } else {
      // 2. Execute liquidations
      const results = await executeLiquidations(candidates, log);

      for (const r of results) {
        if (r.error) {
          stats.errors++;
        } else if (r.skipped) {
          stats.skipped++;
          log("cycle: skipped", { owner: r.owner.slice(0, 10) + "…", reason: r.skipReason });
        } else {
          stats.txsSent++;
          stats.usdaxRepaid   += r.debtRepaid;
          stats.collSeizedUsd += r.collSeizedUsd;
          stats.profitUsd     += r.estimatedProfit;

          log("cycle: liquidated", {
            owner:          r.owner,
            collToken:      r.collSymbol,
            debtRepaidUsd:  r.debtRepaid.toFixed(2),
            collSeizedUsd:  r.collSeizedUsd.toFixed(2),
            profitUsd:      r.estimatedProfit.toFixed(2),
            txHash:         r.txHash,
          });
        }
      }
    }

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log("cycle: error", { error: msg });
    stats.errors++;
  }

  const elapsedMs = Date.now() - cycleStart;

  // Accumulate totals
  totalStats.liquidatable  += stats.liquidatable;
  totalStats.txsSent       += stats.txsSent;
  totalStats.skipped       += stats.skipped;
  totalStats.usdaxRepaid   += stats.usdaxRepaid;
  totalStats.collSeizedUsd += stats.collSeizedUsd;
  totalStats.profitUsd     += stats.profitUsd;
  totalStats.errors        += stats.errors;

  // Print cycle summary
  log("cycle: summary", {
    elapsedMs,
    liquidatable:   stats.liquidatable,
    txsSent:        stats.txsSent,
    skipped:        stats.skipped,
    usdaxRepaid:    stats.usdaxRepaid.toFixed(2),
    collSeizedUsd:  stats.collSeizedUsd.toFixed(2),
    profitUsd:      stats.profitUsd.toFixed(2),
    errors:         stats.errors,
    lifetime: {
      txsSent:       totalStats.txsSent,
      profitUsd:     totalStats.profitUsd.toFixed(2),
    },
  });
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const account = privateKeyToAccount(KEEPER_PRIVATE_KEY);

  log("keeper: starting", {
    keeperAddress:  account.address,
    vaultEngine:    CONTRACTS.vaultEngine,
    usdax:          CONTRACTS.usdax,
    scanIntervalSec: SCAN_INTERVAL_MS / 1000,
    dryRun:         DRY_RUN,
    mode:           DRY_RUN ? "DRY RUN — no transactions will be sent" : "LIVE",
  });

  if (DRY_RUN) {
    log("keeper: DRY RUN MODE — scans active vaults, prints what would be liquidated, sends no txs");
  }

  // Run immediately, then on interval
  await runCycle();

  setInterval(async () => {
    try {
      await runCycle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log("keeper: unexpected error in runCycle", { error: msg });
    }
  }, SCAN_INTERVAL_MS);
}

main().catch(err => {
  console.error("keeper: fatal error", err);
  process.exit(1);
});
