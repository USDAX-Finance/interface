import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const yieldPositionsTable = pgTable("yield_positions", {
  id:                serial("id").primaryKey(),
  owner:             text("owner").notNull(),
  poolId:            text("pool_id").notNull(),
  poolName:          text("pool_name").notNull(),
  poolType:          text("pool_type").notNull().default("savings"),
  depositedUsdax:    numeric("deposited_usdax", { precision: 30, scale: 18 }).notNull(),
  status:            text("status").notNull().default("active"),  // active | withdrawn
  lastClaimAt:       timestamp("last_claim_at",   { withTimezone: true }).notNull().defaultNow(),
  totalClaimedUsdax: numeric("total_claimed_usdax", { precision: 30, scale: 18 }).notNull().default("0"),
  depositedAt:       timestamp("deposited_at",    { withTimezone: true }).notNull().defaultNow(),
  updatedAt:         timestamp("updated_at",       { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertYieldPositionSchema = createInsertSchema(yieldPositionsTable).omit({
  id: true,
  depositedAt: true,
  updatedAt: true,
});
export type InsertYieldPosition = z.infer<typeof insertYieldPositionSchema>;
export type YieldPositionRow    = typeof yieldPositionsTable.$inferSelect;
