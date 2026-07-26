import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";
import type { Position } from "./generated/api.schemas";

export const getMyPositionsQueryKey = (owner: string) =>
  ["positions", "owner", owner.toLowerCase()] as const;

/**
 * Fetch only the positions owned by the connected wallet.
 * Passes ?owner= to the API so the DB filters server-side.
 * Includes the address in the query key so React Query never
 * serves one wallet's cache to a different wallet.
 */
export function useMyPositions(owner: string) {
  return useQuery<Position[]>({
    queryKey: getMyPositionsQueryKey(owner),
    queryFn: ({ signal }) =>
      customFetch<Position[]>(
        `/api/positions?owner=${encodeURIComponent(owner.toLowerCase())}`,
        { signal },
      ),
    enabled: !!owner,
  });
}
