import { db, positionsTable, activityEventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

/* ─── Shared prices (testnet mock — production uses Chainlink) ─── */
export const TOKEN_PRICES: Record<string, number> = {
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

/* ─── Per-token liquidation thresholds ─── */
export const LIQ_THRESH: Record<string, number> = {
  // Crypto — established, deep liquidity
  WETH:     0.80,
  WBTC:     0.75,
  stETH:    0.68,
  // RWA — T-Bills most stable, RE more volatile
  "RWA-TB": 0.95,
  "RWA-RE": 0.73,
  "RWA-CB": 0.83,
  // Stock Tokens — more volatile, conservative thresholds
  TSLA:     0.67,   // volatile EV growth stock
  AMZN:     0.72,   // large-cap, stable
  PLTR:     0.63,   // speculative / high volatility
  NFLX:     0.70,   // established streaming
  AMD:      0.68,   // semiconductor cyclical
  NVDA:     0.72,   // large-cap AI play
  AAPL:     0.75,   // most stable stock token
};

function hf(collateralValueUsd: number, token: string, usdaxMinted: number) {
  if (usdaxMinted === 0) return 999;
  return (collateralValueUsd * (LIQ_THRESH[token] ?? 0.75)) / usdaxMinted;
}

function cr(collateralValueUsd: number, usdaxMinted: number) {
  if (usdaxMinted === 0) return 999;
  return (collateralValueUsd / usdaxMinted) * 100;
}

function txHash() {
  return "0x" + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

/* ─── Seed 1: Diverse crypto + RWA collateral ─── */
const SEED_POSITIONS = [
  // stETH vaults
  { owner: "0xA1B2C3D4E5F6a1b2c3d4e5f6a1b2c3d4e5f60001", token: "stETH",   amount: 32.0,    mint: 51200  },
  { owner: "0xA1B2C3D4E5F6a1b2c3d4e5f6a1b2c3d4e5f60002", token: "stETH",   amount: 15.5,    mint: 24000  },
  { owner: "0xA1B2C3D4E5F6a1b2c3d4e5f6a1b2c3d4e5f60003", token: "stETH",   amount: 8.0,     mint: 10000  },
  // RWA-TB T-Bill (institutional)
  { owner: "0xB1B2C3D4E5F6a1b2c3d4e5f6a1b2c3d4e5f60001", token: "RWA-TB",  amount: 250000,  mint: 220000 },
  { owner: "0xB1B2C3D4E5F6a1b2c3d4e5f6a1b2c3d4e5f60002", token: "RWA-TB",  amount: 100000,  mint: 88000  },
  { owner: "0xB1B2C3D4E5F6a1b2c3d4e5f6a1b2c3d4e5f60003", token: "RWA-TB",  amount: 75000,   mint: 65000  },
  // RWA-RE Real Estate
  { owner: "0xC1B2C3D4E5F6a1b2c3d4e5f6a1b2c3d4e5f60001", token: "RWA-RE",  amount: 80000,   mint: 45000  },
  { owner: "0xC1B2C3D4E5F6a1b2c3d4e5f6a1b2c3d4e5f60002", token: "RWA-RE",  amount: 35000,   mint: 18000  },
  // RWA-CB Corporate Bond
  { owner: "0xD1B2C3D4E5F6a1b2c3d4e5f6a1b2c3d4e5f60001", token: "RWA-CB",  amount: 120000,  mint: 90000  },
];

export async function seedProtocolData() {
  try {
    const existing = await db
      .select()
      .from(positionsTable)
      .where(eq(positionsTable.collateralToken, "stETH"))
      .limit(1);

    if (existing.length > 0) {
      console.log("[seed] Crypto/RWA positions already seeded — skipping.");
      return;
    }

    console.log("[seed] Seeding stETH, RWA-TB, RWA-RE, RWA-CB positions…");

    for (const pos of SEED_POSITIONS) {
      const price  = TOKEN_PRICES[pos.token] ?? 1.0;
      const valUsd = pos.amount * price;

      await db.insert(positionsTable).values({
        owner:              pos.owner,
        collateralToken:    pos.token,
        collateralAmount:   String(pos.amount),
        collateralValueUsd: String(valUsd),
        usdaxMinted:        String(pos.mint),
        healthFactor:       String(hf(valUsd, pos.token, pos.mint)),
        collateralRatio:    String(cr(valUsd, pos.mint)),
        status:             "active",
      });

      await db.insert(activityEventsTable).values([
        { type: "DEPOSIT", user: pos.owner, amount: String(pos.amount), token: pos.token,  txHash: txHash() },
        { type: "MINT",    user: pos.owner, amount: String(pos.mint),   token: "USDAX",    txHash: txHash() },
      ]);
    }

    console.log(`[seed] Seeded ${SEED_POSITIONS.length} crypto/RWA positions.`);
  } catch (err) {
    console.error("[seed] Seed failed (non-fatal):", err);
  }
}

/* ─── Seed 2: Robinhood Chain Stock Token positions ─── */
const STOCK_POSITIONS = [
  // TSLA — Tesla
  { owner: "0xE1A2B3C4D5E6f1a2b3c4d5e6f1a2b3c4d5e60001", token: "TSLA", amount: 500,   mint: 80000  },
  { owner: "0xE1A2B3C4D5E6f1a2b3c4d5e6f1a2b3c4d5e60002", token: "TSLA", amount: 200,   mint: 35000  },
  { owner: "0xE1A2B3C4D5E6f1a2b3c4d5e6f1a2b3c4d5e60003", token: "TSLA", amount: 1000,  mint: 175000 },
  // AMZN — Amazon
  { owner: "0xF1A2B3C4D5E6f1a2b3c4d5e6f1a2b3c4d5e60001", token: "AMZN", amount: 300,   mint: 40000  },
  { owner: "0xF1A2B3C4D5E6f1a2b3c4d5e6f1a2b3c4d5e60002", token: "AMZN", amount: 150,   mint: 20000  },
  // PLTR — Palantir
  { owner: "0xF2A2B3C4D5E6f1a2b3c4d5e6f1a2b3c4d5e60001", token: "PLTR", amount: 5000,  mint: 110000 },
  { owner: "0xF2A2B3C4D5E6f1a2b3c4d5e6f1a2b3c4d5e60002", token: "PLTR", amount: 2000,  mint: 45000  },
  // NFLX — Netflix
  { owner: "0xF3A2B3C4D5E6f1a2b3c4d5e6f1a2b3c4d5e60001", token: "NFLX", amount: 100,   mint: 60000  },
  { owner: "0xF3A2B3C4D5E6f1a2b3c4d5e6f1a2b3c4d5e60002", token: "NFLX", amount: 50,    mint: 28000  },
  // AMD
  { owner: "0xF4A2B3C4D5E6f1a2b3c4d5e6f1a2b3c4d5e60001", token: "AMD",  amount: 1000,  mint: 85000  },
  { owner: "0xF4A2B3C4D5E6f1a2b3c4d5e6f1a2b3c4d5e60002", token: "AMD",  amount: 500,   mint: 45000  },
  // NVDA — NVIDIA
  { owner: "0xF5A2B3C4D5E6f1a2b3c4d5e6f1a2b3c4d5e60001", token: "NVDA", amount: 2000,  mint: 150000 },
  { owner: "0xF5A2B3C4D5E6f1a2b3c4d5e6f1a2b3c4d5e60002", token: "NVDA", amount: 1000,  mint: 80000  },
  // AAPL — Apple
  { owner: "0xF6A2B3C4D5E6f1a2b3c4d5e6f1a2b3c4d5e60001", token: "AAPL", amount: 800,   mint: 110000 },
  { owner: "0xF6A2B3C4D5E6f1a2b3c4d5e6f1a2b3c4d5e60002", token: "AAPL", amount: 400,   mint: 55000  },
];

export async function seedStockTokens() {
  try {
    const existing = await db
      .select()
      .from(positionsTable)
      .where(eq(positionsTable.collateralToken, "TSLA"))
      .limit(1);

    if (existing.length > 0) {
      console.log("[seed] Stock token positions already seeded — skipping.");
      return;
    }

    console.log("[seed] Seeding Robinhood Chain Stock Token positions (TSLA, AMZN, PLTR, NFLX, AMD, NVDA, AAPL)…");

    for (const pos of STOCK_POSITIONS) {
      const price  = TOKEN_PRICES[pos.token] ?? 1.0;
      const valUsd = pos.amount * price;

      await db.insert(positionsTable).values({
        owner:              pos.owner,
        collateralToken:    pos.token,
        collateralAmount:   String(pos.amount),
        collateralValueUsd: String(valUsd),
        usdaxMinted:        String(pos.mint),
        healthFactor:       String(hf(valUsd, pos.token, pos.mint)),
        collateralRatio:    String(cr(valUsd, pos.mint)),
        status:             "active",
      });

      await db.insert(activityEventsTable).values([
        { type: "DEPOSIT", user: pos.owner, amount: String(pos.amount), token: pos.token, txHash: txHash() },
        { type: "MINT",    user: pos.owner, amount: String(pos.mint),   token: "USDAX",   txHash: txHash() },
      ]);
    }

    console.log(`[seed] Seeded ${STOCK_POSITIONS.length} stock token positions.`);
  } catch (err) {
    console.error("[seed] Stock seed failed (non-fatal):", err);
  }
}
