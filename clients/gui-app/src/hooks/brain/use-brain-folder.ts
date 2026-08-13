/**
 * Brain folder hook — list entries in a vault folder.
 */

import type { UseQueryResult } from "@tanstack/react-query";
import type {
  HostRpcError,
  ResponseOfMethod,
} from "@hukum-clients/shared/host-transport/host-messenger";
import { useHostClient, type HostRpcRegistry } from "@/lib/host";
import { useHostQuery } from "@/hooks/host/use-host-query";

/**
 * List the contents of a brain vault folder.
 * Pass empty string or undefined for the root.
 * Only fires when `path` is not null (use null to disable the query).
 */
export function useBrainFolder(
  path: string | null,
): UseQueryResult<
  ResponseOfMethod<HostRpcRegistry, "brain.listFolder">,
  HostRpcError
> {
  const client = useHostClient();
  return useHostQuery<HostRpcRegistry, "brain.listFolder">({
    client,
    method: "brain.listFolder",
    params: { path: path ?? "" },
    cacheKeyIdentity: undefined,
    options: {
      enabled: path !== null,
    },
  });
}
