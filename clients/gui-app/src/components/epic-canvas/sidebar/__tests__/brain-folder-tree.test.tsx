import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBrainConfigStore } from "@/stores/brain/brain-config-store";

const mocks = vi.hoisted(() => ({
  query: {
    data: undefined as
      | {
          files: ReadonlyArray<{ path: string; name: string }>;
        }
      | undefined,
    isPending: true,
    isError: false,
  },
  resetPaths: vi.fn(),
  setSearch: vi.fn(),
}));

vi.mock("@/hooks/workspace/use-list-file-tree-query", () => ({
  useWorkspaceListFileTree: () => mocks.query,
}));

vi.mock("@pierre/trees/react", () => ({
  FileTree: () => <div data-testid="pierre-file-tree" />,
  useFileTree: () => ({
    model: {
      resetPaths: mocks.resetPaths,
      setSearch: mocks.setSearch,
    },
  }),
  useFileTreeSearch: () => ({
    value: "",
    matchingPaths: [],
  }),
}));

vi.mock("@/hooks/host/use-reactive-active-host-id", () => ({
  useReactiveActiveHostId: () => "host-one",
}));

vi.mock("@/hooks/epic/use-epic-nested-focus-navigation", () => ({
  useEpicNestedFocusNavigation: () => vi.fn(),
}));

vi.mock("@/stores/epics/canvas/store", () => ({
  useEpicCanvasStore: (selector: (state: object) => unknown) =>
    selector({
      prepareOpenTilePreviewInTabFocusTarget: vi.fn(),
      prepareOpenTileInTabFocusTarget: vi.fn(),
    }),
}));

import { BrainFolderTree } from "@/components/epic-canvas/sidebar/brain-folder-tree";

describe("BrainFolderTree", () => {
  beforeEach(() => {
    mocks.query.data = undefined;
    mocks.query.isPending = true;
    mocks.query.isError = false;
    mocks.resetPaths.mockReset();
    mocks.setSearch.mockReset();
    useBrainConfigStore.setState({
      config: {
        vaultPath: "/vaults/orca",
        template: "existing",
        createdAt: "2026-08-13T00:00:00.000Z",
        agentContextFiles: [],
        contextTokenBudget: 4_000,
        watchEnabled: true,
        sync: null,
      },
      isConfigured: true,
    });
  });

  it("resets the Pierre model when the vault file query settles", async () => {
    const view = render(<BrainFolderTree epicId="epic-one" tabId="tab-one" />);

    expect(mocks.resetPaths).not.toHaveBeenCalled();

    mocks.query.data = {
      files: [
        { path: "notes/idea.md", name: "idea.md" },
        { path: "_agent/MEMORY.md", name: "MEMORY.md" },
      ],
    };
    mocks.query.isPending = false;
    view.rerender(<BrainFolderTree epicId="epic-one" tabId="tab-one" />);

    await waitFor(() => {
      expect(mocks.resetPaths).toHaveBeenCalledWith([
        "notes/idea.md",
        "_agent/MEMORY.md",
      ]);
    });
  });
});
