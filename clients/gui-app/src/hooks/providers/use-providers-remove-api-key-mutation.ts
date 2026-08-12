import type { UseMutationResult } from "@tanstack/react-query";
import type {
  HostRpcError,
  RequestOfMethod,
  ResponseOfMethod,
} from "@hukum-clients/shared/host-transport/host-messenger";
import type { HostRpcRegistry } from "@/lib/host";
import { useHostScopedMutation } from "@/hooks/host/use-host-scoped-mutation";
import { PROVIDER_INVALIDATIONS } from "@/hooks/providers/invalidations";
import { providersMutationKeys } from "@/lib/query-keys";

export function useProvidersRemoveApiKey(): UseMutationResult<
  ResponseOfMethod<HostRpcRegistry, "providers.removeApiKey">,
  HostRpcError,
  RequestOfMethod<HostRpcRegistry, "providers.removeApiKey">,
  { readonly hostId: string | null }
> {
  return useHostScopedMutation({
    method: "providers.removeApiKey",
    mutationKey: providersMutationKeys.removeApiKey(),
    errorMessage: "Couldn't remove the API key.",
    invalidateMethods: PROVIDER_INVALIDATIONS,
  });
}
