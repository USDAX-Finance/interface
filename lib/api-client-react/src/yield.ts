import {
  useQuery, useMutation,
  type UseQueryOptions, type UseMutationOptions,
} from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";
import type { YieldPool, YieldPosition, YieldStats, DepositYieldBody } from "@workspace/api-zod";

/* ─── query keys ─── */
export const getGetYieldStatsQueryKey     = () => ["yield", "stats"]     as const;
export const getListYieldPoolsQueryKey    = () => ["yield", "pools"]     as const;
export const getListYieldPositionsQueryKey= () => ["yield", "positions"] as const;

/* ─── fetchers ─── */
const fetchYieldStats     = (owner?: string) =>
  customFetch<YieldStats>    (owner ? `/api/yield/stats?owner=${encodeURIComponent(owner)}` : "/api/yield/stats");
const fetchYieldPools      = () => customFetch<YieldPool[]>   ("/api/yield/pools");
const fetchYieldPositions  = (owner?: string) =>
  customFetch<YieldPosition[]>(owner ? `/api/yield/positions?owner=${encodeURIComponent(owner)}` : "/api/yield/positions");

/* ─── hooks ─── */
export function useGetYieldStats(
  owner?: string,
  options?: { query?: UseQueryOptions<YieldStats> },
) {
  return useQuery({
    queryKey: [...getGetYieldStatsQueryKey(), owner ?? ""],
    queryFn:  () => fetchYieldStats(owner),
    ...options?.query,
  });
}

export function useListYieldPools(
  options?: { query?: UseQueryOptions<YieldPool[]> },
) {
  return useQuery({
    queryKey: getListYieldPoolsQueryKey(),
    queryFn:  fetchYieldPools,
    ...options?.query,
  });
}

export function useListYieldPositions(
  owner?: string,
  options?: { query?: UseQueryOptions<YieldPosition[]> },
) {
  return useQuery({
    queryKey: [...getListYieldPositionsQueryKey(), owner ?? ""],
    queryFn:  () => fetchYieldPositions(owner),
    ...options?.query,
  });
}

export function useDepositYield(
  options?: { mutation?: UseMutationOptions<YieldPosition, unknown, DepositYieldBody> },
) {
  return useMutation<YieldPosition, unknown, DepositYieldBody>({
    mutationFn: (data) =>
      customFetch<YieldPosition>("/api/yield/positions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ...options?.mutation,
  });
}

export function useWithdrawYield(
  options?: { mutation?: UseMutationOptions<YieldPosition, unknown, { id: number; amount: number }> },
) {
  return useMutation<YieldPosition, unknown, { id: number; amount: number }>({
    mutationFn: ({ id, amount }) =>
      customFetch<YieldPosition>(`/api/yield/positions/${id}/withdraw`, {
        method: "POST",
        body: JSON.stringify({ amount }),
      }),
    ...options?.mutation,
  });
}

export function useClaimYieldRewards(
  options?: { mutation?: UseMutationOptions<YieldPosition, unknown, { id: number }> },
) {
  return useMutation<YieldPosition, unknown, { id: number }>({
    mutationFn: ({ id }) =>
      customFetch<YieldPosition>(`/api/yield/positions/${id}/claim`, {
        method: "POST",
      }),
    ...options?.mutation,
  });
}
