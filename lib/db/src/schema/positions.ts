import { pgTable, serial, text, numeric, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const positionsTable = pgTable("positions", {
  id: serial("id").primaryKey(),
  owner: text("owner").notNull(),
  collateralToken: text("collateral_token").notNull(), // WETH, WBTC, or stETH
  collateralAmount: numeric("collateral_amount", { precision: 30, scale: 18 }).notNull(),
  collateralValueUsd: numeric("collateral_value_usd", { precision: 30, scale: 6 }).notNull(),
  usdaxMinted: numeric("usdax_minted", { precision: 30, scale: 6 }).notNull(),
  healthFactor: numeric("health_factor", { precision: 30, scale: 18 }).notNull(),
  collateralRatio: numeric("collateral_ratio", { precision: 10, scale: 4 }).notNull(),
  status: text("status").notNull().default("active"), // active | closed | liquidated
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPositionSchema = createInsertSchema(positionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Position = typeof positionsTable.$inferSelect;
