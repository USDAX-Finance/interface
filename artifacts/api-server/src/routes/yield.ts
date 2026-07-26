import { Router, type IRouter } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, yieldPositionsTable } from "@workspace/db";
import {
  YieldPoolSchema, YieldStatsSchema, YieldPositionSchema,
  DepositYieldBodySchema,
} from "@workspace/api-zod";

const router: IRouter = Router();

// ── Constants ─────────────────────────────────────────────────────────────────
const APY      = 4.20;           // percent
const APY_RATE = APY / 100;
const YEAR_MS  = 365 * 24 * 60 * 60 * 1000;

// ── Pool definitions ──────────────────────────────────────────────────────────
/**
 * USDAX Savings Pool — live on Robinhood Chain Testnet.
 * Other pools are projected and pending external protocol deployment.
 */
const POOLS = [
  {
    id:          "usdax-savings",
    name:        "USDAX Savings Rate",
    protocol:    "USDAX Native",
    type:        "savings" as const,
    tokens:      ["USDAX"],
    tvlUsd:      0,   // updated dynamically from DB
    apy:         APY,
    baseApy:     APY,
    rewardApy:   0,
    riskLevel:   "low" as const,
    isActive:    true,
    description: "Protocol-native savings rate. Deposit USDAX and earn 4.20% APY with no impermanent loss and no lock-up. Yield is funded by the 0.5% mint fee charged on every USDAX vault.",
    volume24hUsd: 0,
    feeTier:     undefined,
  },
  {
    id:          "usdax-usdc-lp",
    name:        "USDAX / USDC",
    protocol:    "Curve Finance",
    type:        "stable-lp" as const,
    tokens:      ["USDAX", "USDC"],
    tvlUsd:      0,
    apy:         11.80,
    baseApy:     8.50,
    rewardApy:   3.30,
    riskLevel:   "low" as const,
    isActive:    false,
    description: "Stable-to-stable LP on Curve. Earn trading fees plus APX incentives. Near-zero impermanent loss. Pending Curve deployment on Robinhood Chain.",
    volume24hUsd: 0,
    feeTier:     "0.04%",
  },
  {
    id:          "usdax-weth-lp",
    name:        "USDAX / WETH",
    protocol:    "Uniswap V3",
    type:        "volatile-lp" as const,
    tokens:      ["USDAX", "WETH"],
    tvlUsd:      0,
    apy:         22.40,
    baseApy:     9.10,
    rewardApy:   13.30,
    riskLevel:   "medium" as const,
    isActive:    false,
    description: "Concentrated liquidity USDAX/WETH. High APY from ETH volatility fees and APX rewards. Pending Uniswap V3 deployment on Robinhood Chain.",
    volume24hUsd: 0,
    feeTier:     "0.30%",
  },
  {
    id:          "usdax-vault",
    name:        "USDAX Auto-Vault",
    protocol:    "USDAX Native",
    type:        "vault" as const,
    tokens:      ["USDAX"],
    tvlUsd:      0,
    apy:         15.70,
    baseApy:     15.70,
    rewardApy:   0,
    riskLevel:   "medium" as const,
    isActive:    false,
    description: "Auto-compounding vault allocating USDAX across top yield opportunities on Robinhood Chain. Strategy rebalances daily. Pending deployment.",
    volume24hUsd: 0,
    feeTier:     undefined,
  },
];

const POOL_TOKENS: Record<string, string[]> = {
  "usdax-savings":  ["USDAX"],
  "usdax-usdc-lp":  ["USDAX", "USDC"],
  "usdax-weth-lp":  ["USDAX", "WETH"],
  "usdax-vault":    ["USDAX"],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Pending USDAX yield earned since lastClaimAt.
 * Linear accrual: principal * APY * (elapsed / year).
 */
function calcPendingYield(depositedUsdax: number, lastClaimAt: Date): number {
  const elapsed = (Date.now() - lastClaimAt.getTime()) / YEAR_MS;
  return depositedUsdax * APY_RATE * elapsed;
}

function mapPosition(row: typeof yieldPositionsTable.$inferSelect) {
  const deposited    = Number(row.depositedUsdax);
  const totalClaimed = Number(row.totalClaimedUsdax);
  const pending      = row.status === "active" ? calcPendingYield(deposited, row.lastClaimAt) : 0;
  const currentValue = deposited + pending;
  const pnlUsd       = totalClaimed + pending;
  const pnlPct       = deposited > 0 ? (pnlUsd / deposited) * 100 : 0;
  const pool         = POOLS.find((p) => p.id === row.poolId);
  const poolType     = (pool?.type ?? "savings") as "savings" | "stable-lp" | "volatile-lp" | "vault";

  return YieldPositionSchema.parse({
    id:                row.id,
    poolId:            row.poolId,
    poolName:          row.poolName,
    poolType,
    tokens:            POOL_TOKENS[row.poolId] ?? ["USDAX"],
    owner:             row.owner,
    depositedUsdax:    deposited,
    currentValueUsd:   currentValue,
    pendingRewardsApx: 0,      // APX token not yet deployed
    pendingFeesUsdax:  pending,
    pnlUsd,
    pnlPercent:        pnlPct,
    depositedAt:       row.depositedAt.toISOString(),
    apy:               APY,
  });
}

// ── Routes ────────────────────────────────────────────────────────────────────

router.get("/yield/pools", async (_req, res): Promise<void> => {
  // Hydrate savings pool TVL from DB
  const [tvlRow] = await db
    .select({ total: sql<string>`sum(cast(${yieldPositionsTable.depositedUsdax} as numeric))` })
    .from(yieldPositionsTable)
    .where(eq(yieldPositionsTable.status, "active"));

  const tvl = tvlRow?.total ? Number(tvlRow.total) : 0;

  const pools = POOLS.map((p) =>
    YieldPoolSchema.parse({ ...p, tvlUsd: p.id === "usdax-savings" ? tvl : 0 })
  );
  res.json(pools);
});

router.get("/yield/stats", async (req, res): Promise<void> => {
  const { owner } = req.query as { owner?: string };

  const activePools = POOLS.filter((p) => p.isActive);
  const bestApy     = activePools.length ? Math.max(...activePools.map((p) => p.apy)) : 0;

  // Protocol-wide TVL
  const [tvlRow] = await db
    .select({ total: sql<string>`sum(cast(${yieldPositionsTable.depositedUsdax} as numeric))` })
    .from(yieldPositionsTable)
    .where(eq(yieldPositionsTable.status, "active"));
  const totalTvl = tvlRow?.total ? Number(tvlRow.total) : 0;

  // Per-user stats
  let userDeposited = 0;
  let userEarned    = 0;
  let userPositions = 0;

  if (owner) {
    const rows = await db
      .select()
      .from(yieldPositionsTable)
      .where(sql`lower(${yieldPositionsTable.owner}) = lower(${owner}) AND ${yieldPositionsTable.status} = 'active'`);

    userPositions = rows.length;
    for (const row of rows) {
      const dep     = Number(row.depositedUsdax);
      const claimed = Number(row.totalClaimedUsdax);
      const pending = calcPendingYield(dep, row.lastClaimAt);
      userDeposited += dep;
      userEarned    += claimed + pending;
    }
  }

  res.json(YieldStatsSchema.parse({
    totalTvlUsd:           totalTvl,
    bestApy,
    activePools:           activePools.length,
    userTotalDepositedUsd: userDeposited,
    userTotalEarnedUsd:    userEarned,
    userPositions,
  }));
});

router.get("/yield/positions", async (req, res): Promise<void> => {
  const { owner } = req.query as { owner?: string };

  const rows = owner
    ? await db
        .select()
        .from(yieldPositionsTable)
        .where(sql`lower(${yieldPositionsTable.owner}) = lower(${owner})`)
        .orderBy(desc(yieldPositionsTable.depositedAt))
    : await db
        .select()
        .from(yieldPositionsTable)
        .orderBy(desc(yieldPositionsTable.depositedAt));

  res.json(rows.map(mapPosition));
});

router.post("/yield/positions", async (req, res): Promise<void> => {
  const parsed = DepositYieldBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { poolId, amount, owner } = parsed.data;
  const pool = POOLS.find((p) => p.id === poolId);
  if (!pool) {
    res.status(400).json({ error: "Unknown pool" });
    return;
  }
  if (!pool.isActive) {
    res.status(503).json({ error: `Pool ${poolId} is not yet deployed on Robinhood Chain.` });
    return;
  }

  const [row] = await db
    .insert(yieldPositionsTable)
    .values({
      owner:          owner.toLowerCase(),
      poolId,
      poolName:       pool.name,
      poolType:       pool.type,
      depositedUsdax: String(amount),
    })
    .returning();

  res.status(201).json(mapPosition(row));
});

router.post("/yield/positions/:id/withdraw", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db
    .select()
    .from(yieldPositionsTable)
    .where(eq(yieldPositionsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Position not found" }); return; }

  // Settle pending yield into totalClaimed before closing
  const pending   = calcPendingYield(Number(existing.depositedUsdax), existing.lastClaimAt);
  const newClaimed = Number(existing.totalClaimedUsdax) + pending;

  const [closed] = await db
    .update(yieldPositionsTable)
    .set({ status: "withdrawn", totalClaimedUsdax: String(newClaimed) })
    .where(eq(yieldPositionsTable.id, id))
    .returning();

  res.json(mapPosition(closed));
});

router.post("/yield/positions/:id/claim", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [existing] = await db
    .select()
    .from(yieldPositionsTable)
    .where(eq(yieldPositionsTable.id, id));
  if (!existing) { res.status(404).json({ error: "Position not found" }); return; }

  const pending    = calcPendingYield(Number(existing.depositedUsdax), existing.lastClaimAt);
  const newClaimed = Number(existing.totalClaimedUsdax) + pending;
  const now        = new Date();

  const [updated] = await db
    .update(yieldPositionsTable)
    .set({ totalClaimedUsdax: String(newClaimed), lastClaimAt: now })
    .where(eq(yieldPositionsTable.id, id))
    .returning();

  res.json(mapPosition(updated));
});

export default router;
