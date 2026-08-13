/**
 * Brain note hooks — read and write notes in the brain vault.
 */

import type { UseQueryResult } from "@tanstack/react-query";
import type {
  HostRpcError,
  ResponseOfMethod,
} from "@hukum-clients/shared/host-transport/host-messenger";
import { useHostClient, type HostRpcRegistry } from "@/lib/host";
import { useHostQuery } from "@/hooks/host/use-host-query";
import { useHostScopedMutation } from "@/hooks/host/use-host-scoped-mutation";

/**
 * Read a single brain note by its vault-relative path.
 * Only fires when `path` is non-empty.
 */
export function useBrainNote(
  path: string | null,
): UseQueryResult<
  ResponseOfMethod<HostRpcRegistry, "brain.readNote">,
  HostRpcError
> {
  const client = useHostClient();
  return useHostQuery<HostRpcRegistry, "brain.readNote">({
    client,
    method: "brain.readNote",
    params: { path: path ?? "" },
    cacheKeyIdentity: undefined,
    options: {
      enabled: path !== null && path.length > 0,
    },
  });
}

/**
 * Write or update a brain note. Invalidates the note read and search caches.
 */
export function useBrainWriteNote() {
  return useHostScopedMutation<"brain.writeNote">({
    method: "brain.writeNote",
    mutationKey: ["brain", "writeNote"],
    errorMessage: "Failed to write brain note",
    invalidateMethods: ["brain.search", "brain.readNote", "brain.listFolder"],
  });
}
