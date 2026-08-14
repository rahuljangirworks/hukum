import type { UseQueryResult } from "@tanstack/react-query";
import type {
  HostRpcError,
  RequestOfMethod,
  ResponseOfMethod,
} from "@hukum-clients/shared/host-transport/host-messenger";
import { useHostClient, type HostRpcRegistry } from "@/lib/host";
import { useHostQuery } from "@/hooks/host/use-host-query";
import { useBrainConfigStore } from "@/stores/brain/brain-config-store";

export function useBrainGraph(
  params: RequestOfMethod<HostRpcRegistry, "brain.getGraph">,
): UseQueryResult<
  ResponseOfMethod<HostRpcRegistry, "brain.getGraph">,
  HostRpcError
> {
  const client = useHostClient();
  const activeBrainId = useBrainConfigStore((state) => state.activeBrainId);
  return useHostQuery<HostRpcRegistry, "brain.getGraph">({
    client,
    method: "brain.getGraph",
    params,
    cacheKeyIdentity: [activeBrainId],
    options: { poll: true },
  });
}
