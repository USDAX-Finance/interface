/**
 * DB Reconciliation — background job that syncs Postgres with on-chain state.
 *
 * Runs every 60 seconds. Handles three cases:
 *  1. Active DB position whose on-chain debt is now 0 → mark as 'closed'
 *  2. Active DB position whose on-chain debt drifted >1% → update stored values
 *  3. On-chain vault with debt > 0 that has no matching DB record → create it
 */
import { db, positionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getAllVaults, getCollateralDeposit } from "./blockchain.js";
import { TOKEN_ADDRESS } from "./contracts.js";
import { TOKEN_PRICES } from "./prices.js";
import { logger } from "./logger.js";

// Mirror of positions.ts — must stay in sync
const LIQ_THRESHOLDS: Record<string, number> = {
  WETH:     0.80,
  WBTC:     0.75,
  stETH:    0.68,
  "RWA-TB": 0.95,
  "RWA-RE": 0.73,
  "RWA-CB": 0.83,
};

// Raw on-chain decimal places per token
const TOKEN_DECIMALS: Record<string, number> = {
  WETH:  18,
  WBTC:  8,
  stETH: 18,
};

function calcHealthFactor(collateralValueUsd: number, debt: number, token: string): number {
  if (debt === 0) return 999;
  const thresh = LIQ_THRESHOLDS[token] ?? 0.75;
  return (collateralValueUsd * thresh) / debt;
}

function calcCollateralRatio(collateralValueUsd: number, debt: number): number {
  if (debt === 0) return 999;
  return (collateralValueUsd / debt) * 100;
}

/**
 * Detect which collateral token an owner has deposited by querying each
 * known token's deposit balance. Returns the token with the highest USD value.
 */
async function detectCollateralToken(
  owner: `0x${string}`,
): Promise<{ token: string; amount: number } | null> {
  const results = await Promise.all(
    Object.entries(TOKEN_ADDRESS).map(async ([symbol, address]) => {
      const rawUnits = await getCollateralDeposit(owner, address as `0x${string}`);
      const decimals = TOKEN_DECIMALS[symbol] ?? 18;
      // rawUnits is already Number(bigint) — divide by 10^decimals to get human units
      const amount = rawUnits / Math.pow(10, decimals);
      return { token: symbol, amount };
    }),
  );

  const nonZero = results.filter((e) => e.amount > 0);
  if (nonZero.length === 0) return null;

  // Pick the token with the highest USD value
  nonZero.sort((a, b) => {
    const aUsd = (TOKEN_PRICES[a.token] ?? 0) * a.amount;
    const bUsd = (TOKEN_PRICES[b.token] ?? 0) * b.amount;
    return bUsd - aUsd;
  });

  return nonZero[0];
}

export async function reconcilePositions(): Promise<void> {
  try {
    // ── 1. Load all active DB positions ──────────────────────────────────────
    const dbPositions = await db
      .select()
      .from(positionsTable)
      .where(eq(positionsTable.status, "active"));

    if (dbPositions.length === 0 && (await getAllVaults()).length === 0) return;

    // ── 2. Load all on-chain vaults with debt > 0 ────────────────────────────
    const onChainVaults = await getAllVaults();
    const onChainByOwner = new Map(
      onChainVaults.map((v) => [v.owner.toLowerCase(), v]),
    );

    let closed = 0, updated = 0, created = 0;

    // ── 3. Reconcile existing DB positions ───────────────────────────────────
    const dbOwners = new Set<string>();
    for (const pos of dbPositions) {
      const owner = pos.owner.toLowerCase();
      dbOwners.add(owner);

      const onChain = onChainByOwner.get(owner);

      // Case 1: vault closed on-chain but DB still shows active
      if (!onChain || onChain.debt === 0) {
        await db
          .update(positionsTable)
          .set({ status: "closed" })
          .where(eq(positionsTable.id, pos.id));
        closed++;
        logger.info(
          { owner, posId: pos.id },
          "reconcile: marked closed (on-chain debt=0)",
        );
        continue;
      }

      // Case 2: debt drifted more than 1% — update stored snapshot
      const dbDebt = Number(pos.usdaxMinted);
      const drift = dbDebt > 0
        ? Math.abs(onChain.debt - dbDebt) / dbDebt
        : onChain.debt > 0 ? 1 : 0;

      if (drift > 0.01) {
        const collateralValueUsd = onChain.collateralUsd;
        const hf = calcHealthFactor(collateralValueUsd, onChain.debt, pos.collateralToken);
        const cr = calcCollateralRatio(collateralValueUsd, onChain.debt);

        await db
          .update(positionsTable)
          .set({
            usdaxMinted:       String(onChain.debt),
            collateralValueUsd: String(collateralValueUsd),
            healthFactor:      String(hf),
            collateralRatio:   String(cr),
          })
          .where(eq(positionsTable.id, pos.id));

        updated++;
        logger.info(
          { owner, posId: pos.id, dbDebt, onChainDebt: onChain.debt },
          "reconcile: updated position (debt drift)",
        );
      }
    }

    // ── 4. Create DB records for on-chain vaults with no DB entry ────────────
    for (const vault of onChainVaults) {
      const owner = vault.owner.toLowerCase();
      if (dbOwners.has(owner)) continue; // already handled above

      const collateral = await detectCollateralToken(owner as `0x${string}`);
      if (!collateral) {
        logger.warn({ owner }, "reconcile: on-chain vault found but collateral token undetectable");
        continue;
      }

      const price            = TOKEN_PRICES[collateral.token] ?? 0;
      const collateralValueUsd = collateral.amount * price;
      const hf               = calcHealthFactor(collateralValueUsd, vault.debt, collateral.token);
      const cr               = calcCollateralRatio(collateralValueUsd, vault.debt);

      await db.insert(positionsTable).values({
        owner,
        collateralToken:    collateral.token,
        collateralAmount:   String(collateral.amount),
        collateralValueUsd: String(collateralValueUsd),
        usdaxMinted:        String(vault.debt),
        healthFactor:       String(hf),
        collateralRatio:    String(cr),
        status:             "active",
      });

      created++;
      logger.info(
        { owner, collateral: collateral.token, debt: vault.debt },
        "reconcile: created missing position from chain",
      );
    }

    if (closed + updated + created > 0) {
      logger.info({ closed, updated, created }, "reconcile: cycle complete");
    }
  } catch (err) {
    // Never crash the server — log and wait for next cycle
    logger.error({ err }, "reconcile: error during cycle");
  }
}

const INTERVAL_MS = 60_000; // 1 minute

export function startReconciler(): void {
  logger.info("reconciler: starting (60s interval)");

  // First run: 5s after startup so DB connections are fully ready
  setTimeout(() => {
    reconcilePositions();
    setInterval(reconcilePositions, INTERVAL_MS);
  }, 5_000);
}
