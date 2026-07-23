import * as z from "zod";

export const NetworkStatsSchema = z.object({
  chainId: z.number(),
  networkName: z.string(),
  rpcUrl: z.string(),
  explorerUrl: z.string(),
  totalTransactions: z.number(),
  transactions24h: z.number(),
  volume24hUsd: z.number(),
  totalVolumeUsd: z.number(),
  uniqueUsers: z.number(),
  usdaxSupply: z.number(),
  tvlUsd: z.number(),
  lastUpdated: z.string(),
});

export type NetworkStats = z.infer<typeof NetworkStatsSchema>;
