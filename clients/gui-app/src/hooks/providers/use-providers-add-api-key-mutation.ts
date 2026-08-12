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

export function useProvidersAddApiKey(): UseMutationResult<
  ResponseOfMethod<HostRpcRegistry, "providers.addApiKey">,
  HostRpcError,
  RequestOfMethod<HostRpcRegistry, "providers.addApiKey">,
  { readonly hostId: string | null }
> {
  return useHostScopedMutation({
    method: "providers.addApiKey",
    mutationKey: providersMutationKeys.addApiKey(),
    errorMessage: "Couldn't add the API key.",
    invalidateMethods: PROVIDER_INVALIDATIONS,
  });
}
