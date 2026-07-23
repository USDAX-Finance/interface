import { Router, type IRouter } from "express";
import { db, positionsTable, activityEventsTable } from "@workspace/db";
import {
  CreatePositionBody,
  UpdatePositionBody,
  GetPositionParams,
  UpdatePositionParams,
  ClosePositionParams,
  ListPositionsResponse,
  CreatePositionResponse,
  GetPositionResponse,
  UpdatePositionResponse,
  ClosePositionResponse,
} from "@workspace/api-zod";
import { eq, desc } from "drizzle-orm";

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

// Per-token liquidation thresholds (match seed.ts)
const LIQ_THRESHOLDS: Record<string, number> = {
  WETH:     0.80,
  WBTC:     0.75,
  stETH:    0.68,
  "RWA-TB": 0.95,
  "RWA-RE": 0.73,
  "RWA-CB": 0.83,
  TSLA:     0.67,
  AMZN:     0.72,
  PLTR:     0.63,
  NFLX:     0.70,
  AMD:      0.68,
  NVDA:     0.72,
  AAPL:     0.75,
};

function calcHealthFactor(collateralValueUsd: number, usdaxMinted: number, token?: string): number {
  if (usdaxMinted === 0) return 999;
  const thresh = LIQ_THRESHOLDS[token ?? ""] ?? 0.75;
  return (collateralValueUsd * thresh) / usdaxMinted;
}

function calcCollateralRatio(collateralValueUsd: number, usdaxMinted: number): number {
  if (usdaxMinted === 0) return 999;
  return (collateralValueUsd / usdaxMinted) * 100;
}

function randomTxHash(): string {
  return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

function mapPosition(p: any) {
  return {
    id: p.id,
    owner: p.owner,
    collateralToken: p.collateralToken,
    collateralAmount: Number(p.collateralAmount),
    collateralValueUsd: Number(p.collateralValueUsd),
    usdaxMinted: Number(p.usdaxMinted),
    healthFactor: Number(p.healthFactor),
    collateralRatio: Number(p.collateralRatio),
    status: p.status,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

const router: IRouter = Router();

router.get("/positions", async (req, res): Promise<void> => {
  const positions = await db.select().from(positionsTable).orderBy(desc(positionsTable.createdAt));
  res.json(ListPositionsResponse.parse(positions.map(mapPosition)));
});

router.post("/positions", async (req, res): Promise<void> => {
  const parsed = CreatePositionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { owner, collateralToken, collateralAmount, usdaxToMint } = parsed.data;
  const price = TOKEN_PRICES[collateralToken] ?? 0;
  const collateralValueUsd = collateralAmount * price;
  const healthFactor = calcHealthFactor(collateralValueUsd, usdaxToMint, collateralToken);
  const collateralRatio = calcCollateralRatio(collateralValueUsd, usdaxToMint);

  if (healthFactor < 1.0) {
    res.status(400).json({ error: "Health factor would be below 1.0. Add more collateral or mint less USDAX." });
    return;
  }

  const [position] = await db
    .insert(positionsTable)
    .values({
      owner,
      collateralToken,
      collateralAmount: String(collateralAmount),
      collateralValueUsd: String(collateralValueUsd),
      usdaxMinted: String(usdaxToMint),
      healthFactor: String(healthFactor),
      collateralRatio: String(collateralRatio),
      status: "active",
    })
    .returning();

  // Record activity
  await db.insert(activityEventsTable).values([
    {
      type: "DEPOSIT",
      user: owner,
      amount: String(collateralAmount),
      token: collateralToken,
      txHash: randomTxHash(),
    },
    {
      type: "MINT",
      user: owner,
      amount: String(usdaxToMint),
      token: "USDAX",
      txHash: randomTxHash(),
    },
  ]);

  res.status(201).json(CreatePositionResponse.parse(mapPosition(position)));
});

router.get("/positions/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetPositionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [position] = await db.select().from(positionsTable).where(eq(positionsTable.id, params.data.id));
  if (!position) {
    res.status(404).json({ error: "Position not found" });
    return;
  }

  res.json(GetPositionResponse.parse(mapPosition(position)));
});

router.patch("/positions/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdatePositionParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePositionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(positionsTable).where(eq(positionsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Position not found" });
    return;
  }

  const newCollateralAmount = parsed.data.collateralAmount ?? Number(existing.collateralAmount);
  const newUsdaxMinted = parsed.data.usdaxMinted ?? Number(existing.usdaxMinted);
  const price = TOKEN_PRICES[existing.collateralToken] ?? 0;
  const collateralValueUsd = newCollateralAmount * price;
  const healthFactor = calcHealthFactor(collateralValueUsd, newUsdaxMinted);
  const collateralRatio = calcCollateralRatio(collateralValueUsd, newUsdaxMinted);

  if (healthFactor < 1.0) {
    res.status(400).json({ error: "Health factor would be below 1.0." });
    return;
  }

  const [updated] = await db
    .update(positionsTable)
    .set({
      collateralAmount: String(newCollateralAmount),
      collateralValueUsd: String(collateralValueUsd),
      usdaxMinted: String(newUsdaxMinted),
      healthFactor: String(healthFactor),
      collateralRatio: String(collateralRatio),
    })
    .where(eq(positionsTable.id, params.data.id))
    .returning();

  res.json(UpdatePositionResponse.parse(mapPosition(updated)));
});

router.delete("/positions/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ClosePositionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db.select().from(positionsTable).where(eq(positionsTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Position not found" });
    return;
  }

  const [closed] = await db
    .update(positionsTable)
    .set({ status: "closed" })
    .where(eq(positionsTable.id, params.data.id))
    .returning();

  await db.insert(activityEventsTable).values([
    {
      type: "BURN",
      user: existing.owner,
      amount: existing.usdaxMinted,
      token: "USDAX",
      txHash: randomTxHash(),
    },
    {
      type: "REDEEM",
      user: existing.owner,
      amount: existing.collateralAmount,
      token: existing.collateralToken,
      txHash: randomTxHash(),
    },
  ]);

  res.json(ClosePositionResponse.parse(mapPosition(closed)));
});

export default router;
