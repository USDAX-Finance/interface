import { Router, type IRouter } from "express";
import { db, stakingPositionsTable, activityEventsTable } from "@workspace/db";
import {
  StakeAkxBody,
  UnstakeAkxBody,
  UnstakeAkxParams,
  ClaimRewardsParams,
  GetStakingStatsResponse,
  ListStakingPositionsResponse,
  StakeAkxResponse,
  UnstakeAkxResponse,
  ClaimRewardsResponse,
} from "@workspace/api-zod";
import { eq, sql } from "drizzle-orm";
import { formatUnits } from "viem";
import { getStakingStats, getUserStakingInfo, mainnetClient } from "../lib/blockchain-mainnet.js";
import { logger } from "../lib/logger.js";

/* ─── APXStaking event ABIs ─────────────────────────────────────────────── */
const APX_STAKING_ADDR = (process.env.CONTRACT_APX_STAKING ?? "0x00b6792ac02caf607d0b6ea4a6f572a83472412f") as `0x${string}`;

const EV_STAKED = {
  type: "event" as const, name: "Staked",
  inputs: [
    { name: "user",   type: "address" as const, indexed: true  },
    { name: "amount", type: "uint256" as const, indexed: false },
  ],
};
const EV_UNSTAKED = {
  type: "event" as const, name: "Unstaked",
  inputs: [
    { name: "user",   type: "address" as const, indexed: true  },
    { name: "amount", type: "uint256" as const, indexed: false },
  ],
};
const EV_COOLDOWN_STARTED = {
  type: "event" as const, name: "CooldownStarted",
  inputs: [
    { name: "user",        type: "address" as const, indexed: true  },
    { name: "amount",      type: "uint256" as const, indexed: false },
    { name: "cooldownEnd", type: "uint256" as const, indexed: false },
  ],
};
const EV_CLAIMED = {
  type: "event" as const, name: "RewardsClaimed",
  inputs: [
    { name: "user",   type: "address" as const, indexed: true  },
    { name: "amount", type: "uint256" as const, indexed: false },
  ],
};
const EV_EMERGENCY = {
  type: "event" as const, name: "EmergencyWithdraw",
  inputs: [
    { name: "user",   type: "address" as const, indexed: true  },
    { name: "amount", type: "uint256" as const, indexed: false },
  ],
};

/* Simple in-memory cache — refresh every 30 s */
let chainEventsCache: { ts: number; data: object } | null = null;
const CACHE_TTL_MS = 30_000;

const COOLDOWN_DAYS = 7;

const router: IRouter = Router();

// ─── GET /staking/stats ───────────────────────────────────────────────────────
// Reads live data directly from APXStaking contract on Robinhood Chain mainnet.
router.get("/staking/stats", async (_req, res): Promise<void> => {
  try {
    const chain = await getStakingStats();

    const stats = {
      totalStaked:             chain.totalStaked,
      totalStakedUsd:          0,              // requires APX price oracle
      baseApy:                 chain.currentApyBps / 100,   // bps → percent
      effectiveApy:            Math.round(chain.currentApyBps) / 100,
      totalRewardsDistributed: 0,              // sum from activity events below
      activeStakers:           chain.stakerCount,
      rewardRatePerDay:        (chain.rewardRate * 86_400) / 1e18,
      rewardsPool:             chain.rewardsPool,
      paused:                  chain.paused,
    };

    // Supplement with DB activity for totalRewardsDistributed
    const [claimsRow] = await db
      .select({ total: sql<string>`COALESCE(SUM(CAST(amount AS NUMERIC)), 0)` })
      .from(activityEventsTable)
      .where(eq(activityEventsTable.type, "CLAIM"));
    stats.totalRewardsDistributed = Number(claimsRow?.total ?? 0);

    res.json(GetStakingStatsResponse.parse(stats));
  } catch (err) {
    logger.error({ err }, "staking/stats: failed to read from chain");
    res.status(503).json({ error: "Unable to fetch staking stats from chain" });
  }
});

// ─── GET /staking/positions ────────────────────────────────────────────────────
// When ?owner= provided → reads live position from chain.
// Without owner → returns DB activity log summary (no owner = no on-chain lookup).
router.get("/staking/positions", async (req, res): Promise<void> => {
  const { owner } = req.query as { owner?: string };

  if (owner) {
    try {
      const info = await getUserStakingInfo(owner.toLowerCase() as `0x${string}`);

      // Map on-chain data to expected response shape
      const position = {
        id:            0,
        owner:         owner.toLowerCase(),
        stakedAmount:  info.staked,
        pendingRewards: info.earned,
        totalClaimed:  0,
        stakedAt:      new Date().toISOString(),
        cooldownEndsAt: info.cooldownEnd > 0
          ? new Date(info.cooldownEnd * 1000).toISOString()
          : null,
        status:  info.staked > 0 ? "active"
                 : info.cooldownAmount > 0 ? "cooldown"
                 : "unstaked",
        apy:     0, // dynamically shown from stats endpoint
        cooldownAmount: info.cooldownAmount,
      };

      // Only return if user has any position
      const hasPosition = info.staked > 0 || info.cooldownAmount > 0 || info.earned > 0;
      res.json(ListStakingPositionsResponse.parse(hasPosition ? [position] : []));
    } catch (err) {
      logger.error({ err, owner }, "staking/positions: chain read failed");
      res.status(503).json({ error: "Unable to fetch position from chain" });
    }
    return;
  }

  // No owner — return DB-backed list (activity history view)
  const positions = await db.select().from(stakingPositionsTable);
  res.json(ListStakingPositionsResponse.parse(positions.map(p => ({
    id:            p.id,
    owner:         p.owner,
    stakedAmount:  Number(p.stakedAmount),
    pendingRewards: Number(p.pendingRewards),
    totalClaimed:  Number(p.totalClaimed),
    stakedAt:      p.stakedAt.toISOString(),
    cooldownEndsAt: p.cooldownEndsAt ? p.cooldownEndsAt.toISOString() : null,
    status:        p.status,
    apy:           Number(p.apy),
  }))));
});

// ─── POST /staking/positions ──────────────────────────────────────────────────
// Called by frontend after a successful on-chain stake tx.
// Records the event in DB activity log. txHash must be real.
router.post("/staking/positions", async (req, res): Promise<void> => {
  const parsed = StakeAkxBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { owner, amount } = parsed.data;
  const txHash = typeof req.body.txHash === "string" ? req.body.txHash : null;

  if (amount <= 0) {
    res.status(400).json({ error: "Amount must be greater than 0" });
    return;
  }

  // Upsert DB record for activity tracking
  const existing = await db
    .select()
    .from(stakingPositionsTable)
    .where(sql`lower(${stakingPositionsTable.owner}) = lower(${owner})`);

  let position;
  if (existing.length > 0) {
    [position] = await db
      .update(stakingPositionsTable)
      .set({
        stakedAmount: String(Number(existing[0].stakedAmount) + amount),
        status:       "active",
        lastRewardTime: new Date(),
      })
      .where(eq(stakingPositionsTable.id, existing[0].id))
      .returning();
  } else {
    [position] = await db
      .insert(stakingPositionsTable)
      .values({
        owner: owner.toLowerCase(),
        stakedAmount:   String(amount),
        pendingRewards: "0",
        totalClaimed:   "0",
        status:         "active",
        apy:            "0", // dynamic from chain
      })
      .returning();
  }

  await db.insert(activityEventsTable).values({
    type:   "STAKE",
    user:   owner.toLowerCase(),
    amount: String(amount),
    token:  "APX",
    txHash,
  });

  res.status(201).json(StakeAkxResponse.parse({
    id:             position.id,
    owner:          position.owner,
    stakedAmount:   Number(position.stakedAmount),
    pendingRewards: Number(position.pendingRewards),
    totalClaimed:   Number(position.totalClaimed),
    stakedAt:       position.stakedAt.toISOString(),
    cooldownEndsAt: null,
    status:         position.status,
    apy:            Number(position.apy),
  }));
});

// ─── POST /staking/positions/:id/unstake ──────────────────────────────────────
// Called after on-chain startCooldown() tx succeeds.
router.post("/staking/positions/:id/unstake", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UnstakeAkxParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UnstakeAkxBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const txHash = typeof req.body.txHash === "string" ? req.body.txHash : null;

  const [existing] = await db
    .select()
    .from(stakingPositionsTable)
    .where(eq(stakingPositionsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Staking position not found" });
    return;
  }
  if (existing.status !== "active") {
    res.status(400).json({ error: "Position is not active" });
    return;
  }

  const cooldownEndsAt = new Date(Date.now() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);

  const [updated] = await db
    .update(stakingPositionsTable)
    .set({ status: "cooldown", cooldownEndsAt, lastRewardTime: new Date() })
    .where(eq(stakingPositionsTable.id, params.data.id))
    .returning();

  await db.insert(activityEventsTable).values({
    type:   "UNSTAKE",
    user:   existing.owner,
    amount: String(parsed.data.amount),
    token:  "APX",
    txHash,
  });

  res.json(UnstakeAkxResponse.parse({
    id:             updated.id,
    owner:          updated.owner,
    stakedAmount:   Number(updated.stakedAmount),
    pendingRewards: Number(updated.pendingRewards),
    totalClaimed:   Number(updated.totalClaimed),
    stakedAt:       updated.stakedAt.toISOString(),
    cooldownEndsAt: updated.cooldownEndsAt ? updated.cooldownEndsAt.toISOString() : null,
    status:         updated.status,
    apy:            Number(updated.apy),
  }));
});

// ─── POST /staking/positions/:id/claim ────────────────────────────────────────
// Called after on-chain claimRewards() tx succeeds.
router.post("/staking/positions/:id/claim", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ClaimRewardsParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const txHash = typeof req.body?.txHash === "string" ? req.body.txHash : null;
  const claimedAmount = typeof req.body?.amount === "number" ? req.body.amount : 0;

  const [existing] = await db
    .select()
    .from(stakingPositionsTable)
    .where(eq(stakingPositionsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Staking position not found" });
    return;
  }

  const [updated] = await db
    .update(stakingPositionsTable)
    .set({
      pendingRewards: "0",
      totalClaimed:   String(Number(existing.totalClaimed) + claimedAmount),
      lastRewardTime: new Date(),
    })
    .where(eq(stakingPositionsTable.id, params.data.id))
    .returning();

  await db.insert(activityEventsTable).values({
    type:   "CLAIM",
    user:   existing.owner,
    amount: String(claimedAmount),
    token:  "APX",
    txHash,
  });

  res.json(ClaimRewardsResponse.parse({
    id:             updated.id,
    owner:          updated.owner,
    stakedAmount:   Number(updated.stakedAmount),
    pendingRewards: Number(updated.pendingRewards),
    totalClaimed:   Number(updated.totalClaimed),
    stakedAt:       updated.stakedAt.toISOString(),
    cooldownEndsAt: updated.cooldownEndsAt ? updated.cooldownEndsAt.toISOString() : null,
    status:         updated.status,
    apy:            Number(updated.apy),
  }));
});

// ─── GET /staking/chain-events ────────────────────────────────────────────────
// Reads Staked / Unstaked / RewardsClaimed events directly from the chain.
// Returns the last ~500k blocks of events (covers ~2 years at 1 block/s).
router.get("/staking/chain-events", async (_req, res): Promise<void> => {
  if (chainEventsCache && Date.now() - chainEventsCache.ts < CACHE_TTL_MS) {
    res.json(chainEventsCache.data);
    return;
  }

  try {
    const latest = await mainnetClient.getBlockNumber();
    const from   = latest > 500_000n ? latest - 500_000n : 0n;

    const [stakedLogs, unstakedLogs, claimedLogs, cooldownLogs, emergencyLogs] = await Promise.all([
      mainnetClient.getLogs({ address: APX_STAKING_ADDR, event: EV_STAKED,            fromBlock: from, toBlock: latest }),
      mainnetClient.getLogs({ address: APX_STAKING_ADDR, event: EV_UNSTAKED,          fromBlock: from, toBlock: latest }),
      mainnetClient.getLogs({ address: APX_STAKING_ADDR, event: EV_CLAIMED,           fromBlock: from, toBlock: latest }),
      mainnetClient.getLogs({ address: APX_STAKING_ADDR, event: EV_COOLDOWN_STARTED,  fromBlock: from, toBlock: latest }),
      mainnetClient.getLogs({ address: APX_STAKING_ADDR, event: EV_EMERGENCY,         fromBlock: from, toBlock: latest }),
    ]);

    /* Fetch block timestamps for unique blocks (small set — few events so far) */
    const uniqueBlocks = [...new Set([
      ...stakedLogs.map((l) => l.blockNumber),
      ...unstakedLogs.map((l) => l.blockNumber),
      ...claimedLogs.map((l) => l.blockNumber),
      ...cooldownLogs.map((l) => l.blockNumber),
      ...emergencyLogs.map((l) => l.blockNumber),
    ])];
    const blockData = await Promise.all(
      uniqueBlocks.map((n) => mainnetClient.getBlock({ blockNumber: n, includeTransactions: false }))
    );
    const tsMap: Record<string, number> = {};
    uniqueBlocks.forEach((n, i) => { tsMap[n.toString()] = Number(blockData[i].timestamp); });

    const fmt = (logs: typeof stakedLogs, type: "STAKE" | "UNSTAKE" | "CLAIM" | "COOLDOWN" | "EMERGENCY") =>
      logs.map((l) => ({
        type,
        user:        ((l.args as any).user as string).toLowerCase(),
        amount:      Number(formatUnits((l.args as any).amount as bigint, 18)),
        txHash:      l.transactionHash,
        blockNumber: Number(l.blockNumber),
        timestamp:   new Date((tsMap[l.blockNumber.toString()] ?? 0) * 1000).toISOString(),
      }));

    const events = [
      ...fmt(stakedLogs,     "STAKE"),
      ...fmt(unstakedLogs,   "UNSTAKE"),
      ...fmt(claimedLogs,    "CLAIM"),
      ...fmt(cooldownLogs,   "COOLDOWN"),
      ...fmt(emergencyLogs,  "EMERGENCY"),
    ].sort((a, b) => b.blockNumber - a.blockNumber);

    const totalVolume  = stakedLogs.reduce((s, l) => s + Number(formatUnits((l.args as any).amount as bigint, 18)), 0);
    const totalClaimed = claimedLogs.reduce((s, l) => s + Number(formatUnits((l.args as any).amount as bigint, 18)), 0);
    const uniqueStakers = new Set(stakedLogs.map((l) => ((l.args as any).user as string).toLowerCase())).size;

    const result = { events, totalVolume, totalClaimed, uniqueStakers };
    chainEventsCache = { ts: Date.now(), data: result };
    res.json(result);
  } catch (err) {
    logger.error({ err }, "chain-events fetch failed");
    res.status(500).json({ events: [], totalVolume: 0, totalClaimed: 0, uniqueStakers: 0 });
  }
});

// ─── POST /staking/record ─────────────────────────────────────────────────────
// Lightweight activity recorder — called by frontend after any on-chain staking tx.
// Does NOT require a DB position ID.  Just writes to activityEventsTable.
router.post("/staking/record", async (req, res): Promise<void> => {
  const { owner, type, amount, txHash } = req.body ?? {};

  const ALLOWED = ["STAKE", "UNSTAKE", "CLAIM", "COOLDOWN", "EMERGENCY"] as const;
  if (!owner || !type || !ALLOWED.includes(type)) {
    res.status(400).json({ error: "owner, type (STAKE|UNSTAKE|CLAIM|COOLDOWN|EMERGENCY) required" });
    return;
  }

  const numAmount = Number(amount) || 0;

  await db.insert(activityEventsTable).values({
    type,
    user:   String(owner).toLowerCase(),
    amount: String(numAmount),
    token:  "APX",
    txHash: typeof txHash === "string" ? txHash : null,
  });

  res.status(201).json({ ok: true });
});

export default router;
