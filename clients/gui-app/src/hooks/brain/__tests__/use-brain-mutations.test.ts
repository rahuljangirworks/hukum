import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBrainConnect, useBrainSwitch } from "@/hooks/brain/use-brain-scaffold";
import { useBrainAttachSkill } from "@/hooks/brain/use-brain-capabilities";

interface CapturedMutationOptions {
  readonly onMutate?: () => { readonly hostId: string | null };
  readonly onSuccess?: (
    data: unknown,
    variables: unknown,
    context: { readonly hostId: string | null },
  ) => void;
}

const testState = vi.hoisted(() => ({
  capturedMethod: "",
  capturedOptions: null as CapturedMutationOptions | null,
  invalidateQueries: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: testState.invalidateQueries }),
}));

vi.mock("@/lib/host", () => ({
  useHostClient: () => ({ getActiveHostId: () => "brain-host" }),
}));

vi.mock("@/hooks/host/use-host-query", () => ({
  useHostMutation: (args: {
    readonly method: string;
    readonly options: CapturedMutationOptions;
  }) => {
    testState.capturedMethod = args.method;
    testState.capturedOptions = args.options;
    return { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false };
  },
}));

describe("Brain mutation invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testState.capturedMethod = "";
    testState.capturedOptions = null;
  });

  it("refreshes the registry after a successful brain switch", () => {
    renderHook(() => useBrainSwitch());

    expect(testState.capturedMethod).toBe("brain.switch");
    const context = testState.capturedOptions?.onMutate?.();
    expect(context).toEqual({ hostId: "brain-host" });
    if (!context) throw new Error("onMutate did not return context");

    testState.capturedOptions?.onSuccess?.(
      { ok: true },
      { brainId: "brain-two" },
      context,
    );

    expect(testState.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["host", "brain-host", "brain.getRegistry"],
    });
    expect(testState.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["host", "brain-host", "brain.listFolder"],
    });
  });

  it("refreshes the registry after connecting a brain", () => {
    renderHook(() => useBrainConnect());

    expect(testState.capturedMethod).toBe("brain.connect");
    const context = testState.capturedOptions?.onMutate?.();
    if (!context) throw new Error("onMutate did not return context");

    testState.capturedOptions?.onSuccess?.(
      {
        vaultPath: "/brain-two",
        noteCount: 4,
        hasObsidianConfig: false,
      },
      { vaultPath: "/brain-two" },
      context,
    );

    expect(testState.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["host", "brain-host", "brain.getRegistry"],
    });
  });

  it("refreshes mount ownership and inspection after attaching a skill", () => {
    renderHook(() => useBrainAttachSkill());

    expect(testState.capturedMethod).toBe("brain.mounts.attachSkill");
    const context = testState.capturedOptions?.onMutate?.();
    if (!context) throw new Error("onMutate did not return context");
    testState.capturedOptions?.onSuccess?.(
      {
        status: "healthy",
        mount: null,
        sourcePath: "/brain/_agent/skills/checks",
        linkPath: "/workspace/.agents/skills/checks",
      },
      { workspaceId: "workspace-one", skillId: "checks" },
      context,
    );

    expect(testState.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["host", "brain-host", "brain.mounts.getRegistry"],
    });
    expect(testState.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["host", "brain-host", "brain.mounts.inspect"],
    });
  });
});
