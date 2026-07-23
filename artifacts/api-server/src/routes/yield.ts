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
    protocol:    "USDEX Native",
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
    protocol:    "USDEX Native",
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

/* ─── Mock positions (deterministic) ─── */
function calcEarned(depositedUsdax: number, apy: number, depositedAt: string) {
  const elapsed = (Date.now() - new Date(depositedAt).getTime()) / (1000 * 3600 * 24 * 365);
  return depositedUsdax * (apy / 100) * elapsed;
}

function buildPositions(owner: string) {
  const raw = [
    { id: 1, poolId: "usdax-usdc-lp",  depositedUsdax: 10_000, depositedAt: "2026-06-15T00:00:00Z" },
    { id: 2, poolId: "usdax-savings",  depositedUsdax: 25_000, depositedAt: "2026-05-20T00:00:00Z" },
    { id: 3, poolId: "usdax-weth-lp",  depositedUsdax:  5_000, depositedAt: "2026-07-01T00:00:00Z" },
  ];

  return raw.map((r) => {
    const pool          = POOLS.find((p) => p.id === r.poolId)!;
    const totalEarned   = calcEarned(r.depositedUsdax, pool.apy, r.depositedAt);
    const feesUsdax     = pool.type === "stable-lp" || pool.type === "volatile-lp"
      ? calcEarned(r.depositedUsdax, pool.baseApy, r.depositedAt) : 0;
    const rewardsApx    = pool.rewardApy > 0
      ? calcEarned(r.depositedUsdax, pool.rewardApy, r.depositedAt) / 0.0082 : 0;
    const currentValue  = r.depositedUsdax + totalEarned;
    const pnlUsd        = totalEarned;
    const pnlPercent    = (pnlUsd / r.depositedUsdax) * 100;

    return YieldPositionSchema.parse({
      id:                r.id,
      poolId:            pool.id,
      poolName:          pool.name,
      poolType:          pool.type,
      tokens:            pool.tokens,
      owner,
      depositedUsdax:    r.depositedUsdax,
      currentValueUsd:   currentValue,
      pendingRewardsApx: rewardsApx,
      pendingFeesUsdax:  feesUsdax,
      pnlUsd,
      pnlPercent,
      depositedAt:       r.depositedAt,
      apy:               pool.apy,
    });
  });
}

/* ─── Routes ─── */
router.get("/yield/pools", (_req, res): void => {
  res.json(POOLS.map((p) => YieldPoolSchema.parse(p)));
});

router.get("/yield/stats", (_req, res): void => {
  const positions  = buildPositions("0x71C724E627B0e336338bE5f8a00B32E880B3656F");
  const totalTvl   = POOLS.reduce((s, p) => s + p.tvlUsd, 0);
  const bestApy    = Math.max(...POOLS.map((p) => p.apy));
  const userDep    = positions.reduce((s, p) => s + p.depositedUsdax, 0);
  const userEarned = positions.reduce((s, p) => s + p.pnlUsd, 0);

  res.json(YieldStatsSchema.parse({
    totalTvlUsd:           totalTvl,
    bestApy,
    activePools:           POOLS.filter((p) => p.isActive).length,
    userTotalDepositedUsd: userDep,
    userTotalEarnedUsd:    userEarned,
    userPositions:         positions.length,
  }));
});

router.get("/yield/positions", (req, res): void => {
  const owner = (req.query.owner as string) ?? "0x71C724E627B0e336338bE5f8a00B32E880B3656F";
  res.json(buildPositions(owner));
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

router.post("/yield/positions/:id/withdraw", (req, res): void => {
  const id = parseInt(req.params.id as string, 10);
  const positions = buildPositions("0x71C724E627B0e336338bE5f8a00B32E880B3656F");
  const pos = positions.find((p) => p.id === id);
  if (!pos) { res.status(404).json({ error: "Position not found" }); return; }
  res.json(YieldPositionSchema.parse({ ...pos, depositedUsdax: 0, currentValueUsd: 0 }));
});

router.post("/yield/positions/:id/claim", (req, res): void => {
  const id = parseInt(req.params.id as string, 10);
  const positions = buildPositions("0x71C724E627B0e336338bE5f8a00B32E880B3656F");
  const pos = positions.find((p) => p.id === id);
  if (!pos) { res.status(404).json({ error: "Position not found" }); return; }
  res.json(YieldPositionSchema.parse({ ...pos, pendingRewardsApx: 0, pendingFeesUsdax: 0 }));
});

export default router;
