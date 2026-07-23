import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stakingPositionsTable = pgTable("staking_positions", {
  id: serial("id").primaryKey(),
  owner: text("owner").notNull(),
  stakedAmount: numeric("staked_amount", { precision: 30, scale: 18 }).notNull(),
  pendingRewards: numeric("pending_rewards", { precision: 30, scale: 18 }).notNull().default("0"),
  totalClaimed: numeric("total_claimed", { precision: 30, scale: 18 }).notNull().default("0"),
  stakedAt: timestamp("staked_at", { withTimezone: true }).notNull().defaultNow(),
  cooldownEndsAt: timestamp("cooldown_ends_at", { withTimezone: true }),
  status: text("status").notNull().default("active"), // active | cooldown | unstaked
  apy: numeric("apy", { precision: 10, scale: 4 }).notNull().default("15"),
  lastRewardTime: timestamp("last_reward_time", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertStakingPositionSchema = createInsertSchema(stakingPositionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStakingPosition = z.infer<typeof insertStakingPositionSchema>;
export type StakingPosition = typeof stakingPositionsTable.$inferSelect;
