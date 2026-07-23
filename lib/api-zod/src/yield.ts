import * as z from "zod";

export const YieldPoolSchema = z.object({
  id: z.string(),
  name: z.string(),
  protocol: z.string(),
  type: z.enum(["savings", "stable-lp", "volatile-lp", "vault"]),
  tokens: z.array(z.string()),
  tvlUsd: z.number(),
  apy: z.number(),
  baseApy: z.number(),
  rewardApy: z.number(),
  riskLevel: z.enum(["low", "medium", "high"]),
  isActive: z.boolean(),
  description: z.string(),
  volume24hUsd: z.number(),
  feeTier: z.string().optional(),
});

export const YieldPoolListSchema = z.array(YieldPoolSchema);

export const YieldPositionSchema = z.object({
  id: z.number(),
  poolId: z.string(),
  poolName: z.string(),
  poolType: z.enum(["savings", "stable-lp", "volatile-lp", "vault"]),
  tokens: z.array(z.string()),
  owner: z.string(),
  depositedUsdax: z.number(),
  currentValueUsd: z.number(),
  pendingRewardsApx: z.number(),
  pendingFeesUsdax: z.number(),
  pnlUsd: z.number(),
  pnlPercent: z.number(),
  depositedAt: z.string(),
  apy: z.number(),
});

export const YieldPositionListSchema = z.array(YieldPositionSchema);

export const YieldStatsSchema = z.object({
  totalTvlUsd: z.number(),
  bestApy: z.number(),
  activePools: z.number(),
  userTotalDepositedUsd: z.number(),
  userTotalEarnedUsd: z.number(),
  userPositions: z.number(),
});

export const DepositYieldBodySchema = z.object({
  poolId: z.string(),
  amount: z.number().positive(),
  owner: z.string(),
});

export const WithdrawYieldBodySchema = z.object({
  amount: z.number().positive(),
});

export type YieldPool     = z.infer<typeof YieldPoolSchema>;
export type YieldPosition = z.infer<typeof YieldPositionSchema>;
export type YieldStats    = z.infer<typeof YieldStatsSchema>;
export type DepositYieldBody  = z.infer<typeof DepositYieldBodySchema>;
export type WithdrawYieldBody = z.infer<typeof WithdrawYieldBodySchema>;
