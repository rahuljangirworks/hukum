import type { UseMutationResult } from "@tanstack/react-query";
import type {
  HostRpcError,
  RequestOfMethod,
  ResponseOfMethod,
} from "@hukum-clients/shared/host-transport/host-messenger";
import type { HostRpcRegistry } from "@/lib/host";
import { useHostScopedMutation } from "@/hooks/host/use-host-scoped-mutation";
import { PROVIDER_INVALIDATIONS } from "@/hooks/providers/invalidations";

export function useProvidersUpdateBundled(): UseMutationResult<
  ResponseOfMethod<HostRpcRegistry, "providers.updateBundled">,
  HostRpcError,
  RequestOfMethod<HostRpcRegistry, "providers.updateBundled">,
  { readonly hostId: string | null }
> {
  return useHostScopedMutation({
    method: "providers.updateBundled",
    mutationKey: ["providers", "updateBundled"],
    errorMessage: "Couldn't update provider.",
    invalidateMethods: PROVIDER_INVALIDATIONS,
  });
}
