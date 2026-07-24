import { Router, type IRouter } from "express";
import {
  YieldPoolSchema, YieldPositionSchema, YieldStatsSchema,
  DepositYieldBodySchema,
} from "@workspace/api-zod";
import { z } from "zod";

const router: IRouter = Router();

/* ─── Static pool definitions ─── */
const POOLS = [
  {
    id:          "usdax-savings",
    name:        "USDAX Savings Rate",
    protocol:    "USDAX Native",
    type:        "savings" as const,
    tokens:      ["USDAX"],
    tvlUsd:      2_100_000,
    apy:         4.20,
    baseApy:     4.20,
    rewardApy:   0,
    riskLevel:   "low" as const,
    isActive:    true,
    description: "Protocol-native savings rate. Deposit USDAX and earn steady yield distributed from protocol stability fees. No impermanent loss, no lock period.",
    volume24hUsd: 320_000,
    feeTier:     undefined,
  },
  {
    id:          "usdax-usdc-lp",
    name:        "USDAX / USDC",
    protocol:    "Curve Finance",
    type:        "stable-lp" as const,
    tokens:      ["USDAX", "USDC"],
    tvlUsd:      4_520_000,
    apy:         11.80,
    baseApy:     8.50,
    rewardApy:   3.30,
    riskLevel:   "low" as const,
    isActive:    true,
    description: "Stable-to-stable LP. Provide USDAX and USDC liquidity on Curve. Earn trading fees plus APX token incentives. Near-zero impermanent loss.",
    volume24hUsd: 1_240_000,
    feeTier:     "0.04%",
  },
  {
    id:          "usdax-weth-lp",
    name:        "USDAX / WETH",
    protocol:    "Uniswap V3",
    type:        "volatile-lp" as const,
    tokens:      ["USDAX", "WETH"],
    tvlUsd:      1_840_000,
    apy:         22.40,
    baseApy:     9.10,
    rewardApy:   13.30,
    riskLevel:   "medium" as const,
    isActive:    true,
    description: "Concentrated liquidity in the USDAX/WETH pair. High APY driven by ETH volatility fees and APX rewards. Exposed to impermanent loss on ETH price moves.",
    volume24hUsd: 890_000,
    feeTier:     "0.30%",
  },
  {
    id:          "usdax-vault",
    name:        "USDAX Auto-Vault",
    protocol:    "USDAX Native",
    type:        "vault" as const,
    tokens:      ["USDAX"],
    tvlUsd:      890_000,
    apy:         15.70,
    baseApy:     15.70,
    rewardApy:   0,
    riskLevel:   "medium" as const,
    isActive:    true,
    description: "Auto-compounding vault that allocates USDAX across the highest-yielding opportunities on Robinhood Chain. Strategy rebalances daily.",
    volume24hUsd: 0,
    feeTier:     undefined,
  },
];

/* ─── Routes ─── */
router.get("/yield/pools", (_req, res): void => {
  res.json(POOLS.map((p) => YieldPoolSchema.parse(p)));
});

router.get("/yield/stats", (_req, res): void => {
  const bestApy = Math.max(...POOLS.map((p) => p.apy));
  res.json(YieldStatsSchema.parse({
    totalTvlUsd:           0,
    bestApy,
    activePools:           POOLS.filter((p) => p.isActive).length,
    userTotalDepositedUsd: 0,
    userTotalEarnedUsd:    0,
    userPositions:         0,
  }));
});

router.get("/yield/positions", (_req, res): void => {
  res.json([]);
});

router.post("/yield/positions", (req, res): void => {
  const parsed = DepositYieldBodySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const pool = POOLS.find((p) => p.id === parsed.data.poolId);
  if (!pool) { res.status(404).json({ error: "Pool not found" }); return; }

  const now = new Date().toISOString();
  res.status(201).json(YieldPositionSchema.parse({
    id: Date.now(),
    poolId: pool.id, poolName: pool.name, poolType: pool.type, tokens: pool.tokens,
    owner: parsed.data.owner,
    depositedUsdax: parsed.data.amount,
    currentValueUsd: parsed.data.amount,
    pendingRewardsApx: 0, pendingFeesUsdax: 0,
    pnlUsd: 0, pnlPercent: 0,
    depositedAt: now,
    apy: pool.apy,
  }));
});

router.post("/yield/positions/:id/withdraw", (_req, res): void => {
  res.status(404).json({ error: "Position not found" });
});

router.post("/yield/positions/:id/claim", (_req, res): void => {
  res.status(404).json({ error: "Position not found" });
});

export default router;
