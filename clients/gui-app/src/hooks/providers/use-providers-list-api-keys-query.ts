import type { UseQueryResult } from "@tanstack/react-query";
import type {
  HostRpcError,
  ResponseOfMethod,
} from "@hukum-clients/shared/host-transport/host-messenger";
import type { ProviderCliState } from "@hukum/protocol/host/provider-schemas";
import { useHostClient, type HostRpcRegistry } from "@/lib/host";
import { useHostQuery } from "@/hooks/host/use-host-query";

export function useProvidersListApiKeys(
  providerId: ProviderCliState["providerId"],
): UseQueryResult<
  ResponseOfMethod<HostRpcRegistry, "providers.listApiKeys">,
  HostRpcError
> {
  const client = useHostClient();
  return useHostQuery<HostRpcRegistry, "providers.listApiKeys">({
    cacheKeyIdentity: undefined,
    client,
    method: "providers.listApiKeys",
    params: { providerId },
    options: { enabled: providerId === "opencode" || providerId === "kiro" || providerId === "kilocode" },
  });
}
