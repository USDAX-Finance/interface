import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface ActivityEvent {
  id: number;
  type: string;
  user: string;
  amount: number;
  token: string;
  timestamp: string;
  txHash: string | null;
}

export const getMyActivityQueryKey = (user: string) =>
  ["activity", "user", user.toLowerCase()] as const;

/**
 * Fetch only the activity events belonging to the connected wallet.
 * Passes ?user= to the API for server-side filtering.
 * Includes the address in the query key for per-wallet cache isolation.
 */
export function useMyActivity(user: string) {
  return useQuery<ActivityEvent[]>({
    queryKey: getMyActivityQueryKey(user),
    queryFn: ({ signal }) =>
      customFetch<ActivityEvent[]>(
        `/api/protocol/activity?user=${encodeURIComponent(user.toLowerCase())}`,
        { signal },
      ),
    enabled: !!user,
    refetchInterval: 15_000, // refresh every 15s for real-time feel
  });
}
