import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const activityEventsTable = pgTable("activity_events", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // MINT | BURN | DEPOSIT | REDEEM | STAKE | UNSTAKE | CLAIM | LIQUIDATE
  user: text("user").notNull(),
  amount: numeric("amount", { precision: 30, scale: 8 }).notNull(),
  token: text("token").notNull(),
  txHash: text("tx_hash").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const insertActivityEventSchema = createInsertSchema(activityEventsTable).omit({ id: true });
export type InsertActivityEvent = z.infer<typeof insertActivityEventSchema>;
export type ActivityEvent = typeof activityEventsTable.$inferSelect;
