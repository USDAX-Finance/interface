import { Router, type IRouter } from "express";
import { db, positionsTable, stakingPositionsTable, activityEventsTable } from "@workspace/db";
import {
  GetProtocolStatsResponse,
  ListProtocolActivityResponse,
  GetCollateralBreakdownResponse,
  GetHealthDistributionResponse,
  NetworkStatsSchema,
} from "@workspace/api-zod";
import { eq, sql, desc, lt, and, not } from "drizzle-orm";

const router: IRouter = Router();

// Prices (simulated — in production these come from Chainlink / Robinhood Chain oracle)
const TOKEN_PRICES: Record<string, number> = {
  // Crypto
  WETH:     3247.5,
  WBTC:     67823.0,
  stETH:    3190.0,
  // RWA
  "RWA-TB": 1.00,
  "RWA-RE": 1.00,
  "RWA-CB": 1.00,
  // Robinhood Chain Stock Tokens
  TSLA:     315.0,
  AMZN:     225.0,
  PLTR:     45.0,
  NFLX:     1050.0,
  AMD:      155.0,
  NVDA:     135.0,
  AAPL:     230.0,
};

const APX_PRICE = 0.0082;
const APX_TOTAL_SUPPLY = 10_000_000;

router.get("/protocol/stats", async (req, res): Promise<void> => {
  const [positionRows, stakingRows, atRiskRows] = await Promise.all([
    db.select().from(positionsTable).where(eq(positionsTable.status, "active")),
    db.select().from(stakingPositionsTable).where(eq(stakingPositionsTable.status, "active")),
    db
      .select()
      .from(positionsTable)
      .where(and(eq(positionsTable.status, "active"), lt(positionsTable.healthFactor, "1.2"))),
  ]);

  const tvlUsd = positionRows.reduce((sum, p) => sum + Number(p.collateralValueUsd), 0);
  const usdaxSupply = positionRows.reduce((sum, p) => sum + Number(p.usdaxMinted), 0);
  const totalStaked = stakingRows.reduce((sum, s) => sum + Number(s.stakedAmount), 0);
  const totalStakedUsd = totalStaked * APX_PRICE;
  const collateralRatio = usdaxSupply > 0 ? tvlUsd / usdaxSupply : 0;

  const stats = {
    tvlUsd: tvlUsd + totalStakedUsd,
    usdaxSupply,
    apxPrice: APX_PRICE,
    apxMarketCap: APX_PRICE * APX_TOTAL_SUPPLY,
    totalPositions: positionRows.length,
    totalStaked,
    totalStakedUsd,
    baseApy: 15,
    activeStakers: stakingRows.length,
    atRiskPositions: atRiskRows.length,
    collateralRatio,
  };

  res.json(GetProtocolStatsResponse.parse(stats));
});

router.get("/protocol/activity", async (req, res): Promise<void> => {
  const events = await db
    .select()
    .from(activityEventsTable)
    .orderBy(desc(activityEventsTable.timestamp))
    .limit(50);

  const mapped = events.map((e) => ({
    id: e.id,
    type: e.type,
    user: e.user,
    amount: Number(e.amount),
    token: e.token,
    timestamp: e.timestamp.toISOString(),
    txHash: e.txHash,
  }));

  res.json(ListProtocolActivityResponse.parse(mapped));
});

router.get("/protocol/collateral-breakdown", async (req, res): Promise<void> => {
  const positions = await db
    .select()
    .from(positionsTable)
    .where(eq(positionsTable.status, "active"));

  const byToken: Record<string, { amount: number; valueUsd: number }> = {};
  for (const p of positions) {
    const token = p.collateralToken;
    if (!byToken[token]) byToken[token] = { amount: 0, valueUsd: 0 };
    byToken[token].amount += Number(p.collateralAmount);
    byToken[token].valueUsd += Number(p.collateralValueUsd);
  }

  const totalValueUsd = Object.values(byToken).reduce((s, v) => s + v.valueUsd, 0);

  const breakdown = Object.entries(byToken).map(([token, data]) => ({
    token,
    symbol: token,
    amountLocked: data.amount,
    valueUsd: data.valueUsd,
    percentage: totalValueUsd > 0 ? (data.valueUsd / totalValueUsd) * 100 : 0,
    price: TOKEN_PRICES[token] ?? 0,
  }));

  res.json(GetCollateralBreakdownResponse.parse(breakdown));
});

router.get("/protocol/health-distribution", async (req, res): Promise<void> => {
  const positions = await db
    .select()
    .from(positionsTable)
    .where(eq(positionsTable.status, "active"));

  const buckets: Record<string, { count: number; riskLevel: string }> = {
    "< 1.0": { count: 0, riskLevel: "critical" },
    "1.0 – 1.2": { count: 0, riskLevel: "critical" },
    "1.2 – 1.5": { count: 0, riskLevel: "warning" },
    "1.5 – 2.0": { count: 0, riskLevel: "healthy" },
    "> 2.0": { count: 0, riskLevel: "safe" },
  };

  for (const p of positions) {
    const hf = Number(p.healthFactor);
    if (hf < 1.0) buckets["< 1.0"].count++;
    else if (hf < 1.2) buckets["1.0 – 1.2"].count++;
    else if (hf < 1.5) buckets["1.2 – 1.5"].count++;
    else if (hf < 2.0) buckets["1.5 – 2.0"].count++;
    else buckets["> 2.0"].count++;
  }

  const distribution = Object.entries(buckets).map(([range, data]) => ({
    range,
    count: data.count,
    riskLevel: data.riskLevel,
  }));

  res.json(GetHealthDistributionResponse.parse(distribution));
});

router.get("/protocol/network-stats", async (_req, res): Promise<void> => {
  const [positionRows, stakingRows, events] = await Promise.all([
    db.select().from(positionsTable).where(eq(positionsTable.status, "active")),
    db.select().from(stakingPositionsTable).where(eq(stakingPositionsTable.status, "active")),
    db.select().from(activityEventsTable),
  ]);

  const now = Date.now();
  const h24ago = now - 24 * 3_600_000;

  const events24h  = events.filter((e) => e.timestamp.getTime() >= h24ago);
  const usdaxEvents = events.filter((e) => ["MINT", "BURN"].includes(e.type));
  const usdaxEvents24h = events24h.filter((e) => ["MINT", "BURN"].includes(e.type));

  const totalVolumeUsd = usdaxEvents.reduce((s, e) => s + Number(e.amount), 0);
  const volume24hUsd   = usdaxEvents24h.reduce((s, e) => s + Number(e.amount), 0);

  const tvlUsd     = positionRows.reduce((s, p) => s + Number(p.collateralValueUsd), 0);
  const usdaxSupply= positionRows.reduce((s, p) => s + Number(p.usdaxMinted), 0);
  const totalStakedUsd = stakingRows.reduce((s, p) => s + Number(p.stakedAmount), 0) * APX_PRICE;
  const uniqueUsers= new Set(events.map((e) => e.user)).size;

  res.json(NetworkStatsSchema.parse({
    chainId: 46630,
    networkName: "Robinhood Chain Testnet",
    rpcUrl: "https://testnet-rpc.robinhoodchain.io",
    explorerUrl: "https://testnet-explorer.robinhoodchain.io",
    totalTransactions: events.length,
    transactions24h:   events24h.length,
    volume24hUsd,
    totalVolumeUsd,
    uniqueUsers,
    usdaxSupply,
    tvlUsd: tvlUsd + totalStakedUsd,
    lastUpdated: new Date().toISOString(),
  }));
});

export default router;
