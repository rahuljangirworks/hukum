import { defineRpcContract } from "@hukum/protocol/framework/index";
import {
  runtimeCapabilitiesRequestSchema,
  runtimeCapabilitiesResponseSchema,
} from "@hukum/protocol/host/runtime-capabilities/schemas";

export const hostGetRuntimeCapabilitiesV10 = defineRpcContract({
  method: "host.getRuntimeCapabilities",
  schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: runtimeCapabilitiesRequestSchema,
  responseSchema: runtimeCapabilitiesResponseSchema,
});
