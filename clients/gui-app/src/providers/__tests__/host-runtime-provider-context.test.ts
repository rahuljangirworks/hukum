import { afterEach, describe, expect, it, vi } from "vitest";
import type { HostRpcRegistry } from "@hukum/protocol/host/index";
import {
  type HostRuntimeBinding,
  type HostRuntimeState,
} from "@/providers/host-runtime-provider";

interface HostRuntimeDevGlobals {
  __HUKUM_HOST_RUNTIME_STATE__: HostRuntimeState<HostRpcRegistry> | undefined;
}

const runtimeDevGlobals = globalThis as typeof globalThis &
  HostRuntimeDevGlobals;
const initialRuntimeState = runtimeDevGlobals.__HUKUM_HOST_RUNTIME_STATE__;

afterEach(() => {
  vi.resetModules();
  if (initialRuntimeState === undefined) {
    Reflect.deleteProperty(runtimeDevGlobals, "__HUKUM_HOST_RUNTIME_STATE__");
    return;
  }
  runtimeDevGlobals.__HUKUM_HOST_RUNTIME_STATE__ = initialRuntimeState;
});

describe("host runtime module", () => {
  it("retains the provider context and binding snapshot across Fast Refresh module generations", async () => {
    vi.resetModules();
    Reflect.deleteProperty(runtimeDevGlobals, "__HUKUM_HOST_RUNTIME_STATE__");

    const providerGeneration = await import("@/lib/host/runtime");
    const providerState = runtimeDevGlobals.__HUKUM_HOST_RUNTIME_STATE__;
    if (providerState === undefined) {
      throw new Error("Expected the hot runtime state to be retained globally");
    }

    const binding = Object.create(null) as HostRuntimeBinding<HostRpcRegistry>;
    providerState.bindingSnapshot.value = binding;

    vi.resetModules();
    const hookGeneration = await import("@/lib/host/runtime");

    expect(hookGeneration.HostRuntimeContext).toBe(
      providerGeneration.HostRuntimeContext,
    );

    expect(hookGeneration.getHostBindingSnapshot()).toBe(binding);
  });
});
