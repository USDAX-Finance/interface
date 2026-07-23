import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";
import type { NetworkStats } from "@workspace/api-zod";

export const getGetNetworkStatsQueryKey = () => ["protocol", "network-stats"] as const;

export function useGetNetworkStats(
  options?: { query?: UseQueryOptions<NetworkStats> },
) {
  return useQuery<NetworkStats>({
    queryKey: getGetNetworkStatsQueryKey(),
    queryFn:  () => customFetch<NetworkStats>("/api/protocol/network-stats"),
    refetchInterval: 30_000,
    ...options?.query,
  });
}
