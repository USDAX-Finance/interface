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
import { eq, and } from "drizzle-orm";
import { generateTxHash } from "../lib/txHash.js";

const BASE_APY = 15;
const COOLDOWN_DAYS = 7;

function calcPendingRewards(stakedAmount: number, lastRewardTime: Date, apyRate: number): number {
  const now = new Date();
  const elapsed = (now.getTime() - lastRewardTime.getTime()) / 1000; // seconds
  const rewardRate = (stakedAmount * apyRate) / (365 * 24 * 3600 * 100);
  return rewardRate * elapsed;
}

function mapStakingPosition(s: any) {
  const pendingRewards = s.status === "active"
    ? Number(s.pendingRewards) + calcPendingRewards(Number(s.stakedAmount), s.lastRewardTime, Number(s.apy))
    : Number(s.pendingRewards);
  return {
    id: s.id,
    owner: s.owner,
    stakedAmount: Number(s.stakedAmount),
    pendingRewards,
    totalClaimed: Number(s.totalClaimed),
    stakedAt: s.stakedAt.toISOString(),
    cooldownEndsAt: s.cooldownEndsAt ? s.cooldownEndsAt.toISOString() : null,
    status: s.status,
    apy: Number(s.apy),
  };
}

const router: IRouter = Router();

router.get("/staking/stats", async (_req, res): Promise<void> => {
  const positions = await db
    .select()
    .from(stakingPositionsTable)
    .where(eq(stakingPositionsTable.status, "active"));

  const totalStaked = positions.reduce((s, p) => s + Number(p.stakedAmount), 0);
  const totalClaimed = positions.reduce((s, p) => s + Number(p.totalClaimed), 0);
  const pendingSum = positions.reduce(
    (s, p) => s + calcPendingRewards(Number(p.stakedAmount), p.lastRewardTime, Number(p.apy)),
    0
  );

  // Effective APY increases slightly when less APX is staked
  const maxSupply = 100_000_000;
  const stakingRatio = totalStaked / maxSupply;
  const effectiveApy = BASE_APY + (1 - Math.min(stakingRatio, 1)) * 5;

  const stats = {
    totalStaked,
    totalStakedUsd: 0, // requires APX price oracle
    baseApy: BASE_APY,
    effectiveApy: Math.round(effectiveApy * 100) / 100,
    totalRewardsDistributed: totalClaimed + pendingSum,
    activeStakers: positions.length,
    rewardRatePerDay: (totalStaked * BASE_APY) / 365 / 100,
  };

  res.json(GetStakingStatsResponse.parse(stats));
});

router.get("/staking/positions", async (_req, res): Promise<void> => {
  const positions = await db.select().from(stakingPositionsTable);
  res.json(ListStakingPositionsResponse.parse(positions.map(mapStakingPosition)));
});

router.post("/staking/positions", async (req, res): Promise<void> => {
  const parsed = StakeAkxBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { owner, amount } = parsed.data;
  if (amount <= 0) {
    res.status(400).json({ error: "Amount must be greater than 0" });
    return;
  }

  const [position] = await db
    .insert(stakingPositionsTable)
    .values({
      owner,
      stakedAmount: String(amount),
      pendingRewards: "0",
      totalClaimed: "0",
      status: "active",
      apy: String(BASE_APY),
    })
    .returning();

  await db.insert(activityEventsTable).values({
    type: "STAKE",
    user: owner,
    amount: String(amount),
    token: "APX",
    txHash: generateTxHash(),
  });

  res.status(201).json(StakeAkxResponse.parse(mapStakingPosition(position)));
});

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

  // Accrue pending rewards first
  const accrued = calcPendingRewards(Number(existing.stakedAmount), existing.lastRewardTime, Number(existing.apy));
  const cooldownEndsAt = new Date(Date.now() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);

  const [updated] = await db
    .update(stakingPositionsTable)
    .set({
      status: "cooldown",
      cooldownEndsAt,
      pendingRewards: String(Number(existing.pendingRewards) + accrued),
      lastRewardTime: new Date(),
    })
    .where(eq(stakingPositionsTable.id, params.data.id))
    .returning();

  await db.insert(activityEventsTable).values({
    type: "UNSTAKE",
    user: existing.owner,
    amount: String(parsed.data.amount),
    token: "APX",
    txHash: generateTxHash(),
  });

  res.json(UnstakeAkxResponse.parse(mapStakingPosition(updated)));
});

router.post("/staking/positions/:id/claim", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ClaimRewardsParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(stakingPositionsTable)
    .where(eq(stakingPositionsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Staking position not found" });
    return;
  }

  const accrued = existing.status === "active"
    ? calcPendingRewards(Number(existing.stakedAmount), existing.lastRewardTime, Number(existing.apy))
    : 0;
  const totalRewards = Number(existing.pendingRewards) + accrued;

  if (totalRewards <= 0) {
    res.status(400).json({ error: "No rewards to claim" });
    return;
  }

  const [updated] = await db
    .update(stakingPositionsTable)
    .set({
      pendingRewards: "0",
      totalClaimed: String(Number(existing.totalClaimed) + totalRewards),
      lastRewardTime: new Date(),
    })
    .where(eq(stakingPositionsTable.id, params.data.id))
    .returning();

  await db.insert(activityEventsTable).values({
    type: "CLAIM",
    user: existing.owner,
    amount: String(totalRewards),
    token: "APX",
    txHash: generateTxHash(),
  });

  res.json(ClaimRewardsResponse.parse(mapStakingPosition(updated)));
});

export default router;
