import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrainGraphTile } from "@/components/epic-canvas/renderers/brain-graph-tile";
import { makeBrainGraphTileRef } from "@/stores/epics/canvas/tile-schema/brain-graph-tile";

const graphQuery = vi.hoisted(() => ({
  data: undefined as undefined | {
    brainId: string;
    revision: number;
    truncated: boolean;
    nodes: Array<Record<string, unknown>>;
    edges: Array<Record<string, unknown>>;
  },
  isPending: false,
  error: null as Error | null,
  refetch: vi.fn(),
}));

vi.mock("@/hooks/brain", () => ({ useBrainGraph: () => graphQuery }));
vi.mock("@/stores/epics/canvas/store", () => ({
  useEpicCanvasStore: (selector: (state: unknown) => unknown) =>
    selector({ updateBrainGraphTileInTab: vi.fn() }),
}));
vi.mock("@/hooks/epic/use-epic-tile-navigation", () => ({
  useEpicTileNavigation: () => ({ openTileInEpic: vi.fn() }),
}));
vi.mock("@/components/brain/brain-graph-view", () => ({
  BrainGraphView: () => <div data-testid="brain-graph-view" />,
}));

const NODE = makeBrainGraphTileRef({
  hostId: "host-one",
  brainId: "brain-one",
  vaultPath: "/vault/brain-one",
});

describe("BrainGraphTile", () => {
  beforeEach(() => {
    graphQuery.data = undefined;
    graphQuery.isPending = false;
    graphQuery.error = null;
    graphQuery.refetch.mockClear();
  });

  it("shows a useful empty state for a Brain without connected notes", () => {
    graphQuery.data = { brainId: "brain-one", revision: 1, truncated: false, nodes: [], edges: [] };
    render(<BrainGraphTile node={NODE} viewTabId="tab-one" epicId="epic-one" />);
    expect(screen.getByTestId("brain-graph-empty")).not.toBeNull();
    expect(screen.getByText("No connected notes yet")).not.toBeNull();
  });

  it("never renders graph data from a different active Brain", () => {
    graphQuery.data = {
      brainId: "brain-two",
      revision: 2,
      truncated: false,
      nodes: [{ id: "secret.md" }],
      edges: [],
    };
    render(<BrainGraphTile node={NODE} viewTabId="tab-one" epicId="epic-one" />);
    expect(screen.getByText(/belongs to an inactive Brain/)).not.toBeNull();
    expect(screen.queryByTestId("brain-graph-view")).toBeNull();
  });

  it("renders capped graph data with a truncation notice", () => {
    graphQuery.data = {
      brainId: "brain-one",
      revision: 3,
      truncated: true,
      nodes: [{ id: "alpha.md" }],
      edges: [],
    };
    render(<BrainGraphTile node={NODE} viewTabId="tab-one" epicId="epic-one" />);
    expect(screen.getByTestId("brain-graph-view")).not.toBeNull();
    expect(screen.getByText("Showing the top 250 notes")).not.toBeNull();
  });
});
