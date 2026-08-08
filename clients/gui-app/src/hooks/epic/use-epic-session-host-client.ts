import { use } from "react";
import type { HostClient } from "@hukum-clients/shared/host-client/host-client";
import type { HostRpcRegistry } from "@hukum/protocol/host/index";
import { EpicSessionHostClientContext } from "@/lib/registries/epic-session-registry";

/** The RPC client owned by the surrounding Epic session. */
export function useEpicSessionHostClient(): HostClient<HostRpcRegistry> | null {
  return use(EpicSessionHostClientContext);
}
