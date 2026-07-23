import { Router, type IRouter } from "express";
import { db, positionsTable, activityEventsTable } from "@workspace/db";
import {
  ExecuteLiquidationBody,
  ListLiquidationsResponse,
  ExecuteLiquidationResponse,
} from "@workspace/api-zod";
import { eq, lt, and, asc } from "drizzle-orm";

const LIQUIDATION_BONUS = 10; // 10%
const MIN_HEALTH_FACTOR = 1.0;

// Token prices (simulated — in production these come from Chainlink / Robinhood Chain oracle)
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

function randomTxHash(): string {
  return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

const router: IRouter = Router();

router.get("/liquidations", async (_req, res): Promise<void> => {
  // Return both critical (< 1.0) and at-risk (< 1.2) positions
  const positions = await db
    .select()
    .from(positionsTable)
    .where(and(eq(positionsTable.status, "active"), lt(positionsTable.healthFactor, "1.2")))
    .orderBy(asc(positionsTable.healthFactor));

  const targets = positions.map((p) => {
    const hf = Number(p.healthFactor);
    const usdaxDebt = Number(p.usdaxMinted);
    const collateralValueUsd = Number(p.collateralValueUsd);
    // Max debt that can be covered is 50% of outstanding debt in a single liquidation
    const maxLiquidatable = usdaxDebt * 0.5;
    const liquidationBonus = (maxLiquidatable * LIQUIDATION_BONUS) / 100;

    return {
      positionId: p.id,
      owner: p.owner,
      collateralToken: p.collateralToken,
      collateralAmount: Number(p.collateralAmount),
      collateralValueUsd,
      usdaxDebt,
      healthFactor: hf,
      maxLiquidatable,
      liquidationBonus,
      riskLevel: hf < 1.0 ? "critical" : "warning",
    };
  });

  res.json(ListLiquidationsResponse.parse(targets));
});

router.post("/liquidations", async (req, res): Promise<void> => {
  const parsed = ExecuteLiquidationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { positionId, liquidator, debtToCover } = parsed.data;

  const [position] = await db
    .select()
    .from(positionsTable)
    .where(eq(positionsTable.id, positionId));

  if (!position) {
    res.status(404).json({ error: "Position not found" });
    return;
  }

  const hf = Number(position.healthFactor);
  if (hf >= MIN_HEALTH_FACTOR) {
    res.status(400).json({ error: "Position is healthy and cannot be liquidated" });
    return;
  }

  const usdaxDebt = Number(position.usdaxMinted);
  const maxLiquidatable = usdaxDebt * 0.5;
  if (debtToCover > maxLiquidatable) {
    res.status(400).json({ error: `Max liquidatable amount is ${maxLiquidatable} USDAX` });
    return;
  }

  const price = TOKEN_PRICES[position.collateralToken] ?? 1;
  const bonusCollateral = (debtToCover * LIQUIDATION_BONUS) / 100;
  const totalDebtUsd = debtToCover + bonusCollateral;
  const collateralSeized = debtToCover / price;
  const bonusCollateralAmount = bonusCollateral / price;
  const totalCollateralReceived = collateralSeized + bonusCollateralAmount;

  // Update position
  const newUsdaxMinted = usdaxDebt - debtToCover;
  const newCollateralAmount = Number(position.collateralAmount) - totalCollateralReceived;
  const newCollateralValueUsd = newCollateralAmount * price;
  const newHealthFactor =
    newUsdaxMinted > 0 ? (newCollateralValueUsd * 0.8) / newUsdaxMinted : 999;
  const newCollateralRatio = newUsdaxMinted > 0 ? (newCollateralValueUsd / newUsdaxMinted) * 100 : 999;
  const newStatus = newUsdaxMinted <= 0 ? "liquidated" : "active";

  await db
    .update(positionsTable)
    .set({
      usdaxMinted: String(Math.max(newUsdaxMinted, 0)),
      collateralAmount: String(Math.max(newCollateralAmount, 0)),
      collateralValueUsd: String(Math.max(newCollateralValueUsd, 0)),
      healthFactor: String(newHealthFactor),
      collateralRatio: String(newCollateralRatio),
      status: newStatus,
    })
    .where(eq(positionsTable.id, positionId));

  await db.insert(activityEventsTable).values({
    type: "LIQUIDATE",
    user: liquidator,
    amount: String(debtToCover),
    token: "USDAX",
    txHash: randomTxHash(),
  });

  const result = {
    positionId,
    liquidator,
    debtCovered: debtToCover,
    collateralSeized,
    bonusCollateral: bonusCollateralAmount,
    totalCollateralReceived,
    newHealthFactor,
    timestamp: new Date().toISOString(),
  };

  res.json(ExecuteLiquidationResponse.parse(result));
});

export default router;
