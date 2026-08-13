/**
 * Brain search hook — debounced full-text search across the brain vault.
 */

import type { UseQueryResult } from "@tanstack/react-query";
import type {
  HostRpcError,
  ResponseOfMethod,
} from "@hukum-clients/shared/host-transport/host-messenger";
import { useHostClient, type HostRpcRegistry } from "@/lib/host";
import { useHostQuery } from "@/hooks/host/use-host-query";

/**
 * Search the brain vault. Only fires when `query` is non-empty.
 * Use with a debounced input value for best UX.
 */
export function useBrainSearch(
  query: string,
  maxResults: number = 10,
): UseQueryResult<
  ResponseOfMethod<HostRpcRegistry, "brain.search">,
  HostRpcError
> {
  const client = useHostClient();
  return useHostQuery<HostRpcRegistry, "brain.search">({
    client,
    method: "brain.search",
    params: { query, maxResults },
    cacheKeyIdentity: undefined,
    options: {
      enabled: query.trim().length > 0,
    },
  });
}
