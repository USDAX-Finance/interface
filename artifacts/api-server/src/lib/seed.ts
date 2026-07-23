import { db, positionsTable, activityEventsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const TOKEN_PRICES: Record<string, number> = {
  WETH:   3247.5,
  WBTC:   67823.0,
  stETH:  3190.0,   // slight discount vs WETH
  "RWA-TB": 1.00,  // T-Bills at par
  "RWA-RE": 1.00,  // Real-Estate token
  "RWA-CB": 1.00,  // Corporate Bonds
};

const LIQ_THRESH: Record<string, number> = {
  WETH:   0.80,
  WBTC:   0.75,
  stETH:  0.68,
  "RWA-TB": 0.95,
  "RWA-RE": 0.73,
  "RWA-CB": 0.83,
};

function hf(collateralValueUsd: number, token: string, usdaxMinted: number) {
  if (usdaxMinted === 0) return 999;
  return (collateralValueUsd * (LIQ_THRESH[token] ?? 0.80)) / usdaxMinted;
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

const SEED_POSITIONS = [
  // stETH positions — 3 vaults
  { owner: "0xA1B2C3D4E5F6a1b2c3d4e5f6a1b2c3d4e5f60001", token: "stETH",   amount: 32.0,    mint: 51200  },
  { owner: "0xA1B2C3D4E5F6a1b2c3d4e5f6a1b2c3d4e5f60002", token: "stETH",   amount: 15.5,    mint: 24000  },
  { owner: "0xA1B2C3D4E5F6a1b2c3d4e5f6a1b2c3d4e5f60003", token: "stETH",   amount: 8.0,     mint: 10000  },
  // RWA-TB T-Bill positions — institutional sized
  { owner: "0xB1B2C3D4E5F6a1b2c3d4e5f6a1b2c3d4e5f60001", token: "RWA-TB",  amount: 250000,  mint: 220000 },
  { owner: "0xB1B2C3D4E5F6a1b2c3d4e5f6a1b2c3d4e5f60002", token: "RWA-TB",  amount: 100000,  mint: 88000  },
  { owner: "0xB1B2C3D4E5F6a1b2c3d4e5f6a1b2c3d4e5f60003", token: "RWA-TB",  amount: 75000,   mint: 65000  },
  // RWA-RE Real Estate — mid-sized vaults
  { owner: "0xC1B2C3D4E5F6a1b2c3d4e5f6a1b2c3d4e5f60001", token: "RWA-RE",  amount: 80000,   mint: 45000  },
  { owner: "0xC1B2C3D4E5F6a1b2c3d4e5f6a1b2c3d4e5f60002", token: "RWA-RE",  amount: 35000,   mint: 18000  },
  // RWA-CB Corporate Bond
  { owner: "0xD1B2C3D4E5F6a1b2c3d4e5f6a1b2c3d4e5f60001", token: "RWA-CB",  amount: 120000,  mint: 90000  },
];

export async function seedProtocolData() {
  try {
    // Check if stETH positions already exist
    const existing = await db
      .select()
      .from(positionsTable)
      .where(eq(positionsTable.collateralToken, "stETH"))
      .limit(1);

    if (existing.length > 0) {
      console.log("[seed] Diverse collateral positions already seeded — skipping.");
      return;
    }

    console.log("[seed] Seeding diverse collateral positions (stETH, RWA-TB, RWA-RE, RWA-CB)…");

    for (const pos of SEED_POSITIONS) {
      const price   = TOKEN_PRICES[pos.token] ?? 1.0;
      const valUsd  = pos.amount * price;
      const health  = hf(valUsd, pos.token, pos.mint);
      const ratio   = cr(valUsd, pos.mint);

      await db.insert(positionsTable).values({
        owner:              pos.owner,
        collateralToken:    pos.token,
        collateralAmount:   String(pos.amount),
        collateralValueUsd: String(valUsd),
        usdaxMinted:        String(pos.mint),
        healthFactor:       String(health),
        collateralRatio:    String(ratio),
        status:             "active",
      });

      await db.insert(activityEventsTable).values([
        {
          type:    "DEPOSIT",
          user:    pos.owner,
          amount:  String(pos.amount),
          token:   pos.token,
          txHash:  txHash(),
        },
        {
          type:    "MINT",
          user:    pos.owner,
          amount:  String(pos.mint),
          token:   "USDAX",
          txHash:  txHash(),
        },
      ]);
    }

    console.log(`[seed] Seeded ${SEED_POSITIONS.length} positions across 4 collateral types.`);
  } catch (err) {
    console.error("[seed] Seed failed (non-fatal):", err);
  }
}
