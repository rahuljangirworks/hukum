/**
 * Brain config hooks — fetch the current brain configuration and registry.
 */

import type { UseQueryResult } from "@tanstack/react-query";
import type {
  HostRpcError,
  ResponseOfMethod,
} from "@hukum-clients/shared/host-transport/host-messenger";
import { useHostClient, type HostRpcRegistry } from "@/lib/host";
import { useHostQuery } from "@/hooks/host/use-host-query";

export function useBrainConfig(): UseQueryResult<
  ResponseOfMethod<HostRpcRegistry, "brain.getConfig">,
  HostRpcError
> {
  const client = useHostClient();
  return useHostQuery<HostRpcRegistry, "brain.getConfig">({
    client,
    method: "brain.getConfig",
    params: {},
    cacheKeyIdentity: undefined,
    options: null,
  });
}

export function useBrainRegistry(): UseQueryResult<
  ResponseOfMethod<HostRpcRegistry, "brain.getRegistry">,
  HostRpcError
> {
  const client = useHostClient();
  return useHostQuery<HostRpcRegistry, "brain.getRegistry">({
    client,
    method: "brain.getRegistry",
    params: {},
    cacheKeyIdentity: undefined,
    options: null,
  });
}

export function useBrainTemplates(): UseQueryResult<
  ResponseOfMethod<HostRpcRegistry, "brain.listTemplates">,
  HostRpcError
> {
  const client = useHostClient();
  return useHostQuery<HostRpcRegistry, "brain.listTemplates">({
    client,
    method: "brain.listTemplates",
    params: {},
    cacheKeyIdentity: undefined,
    options: null,
  });
}
