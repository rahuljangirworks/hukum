import { describe, expect, it } from "vitest";
import { isTileRefRecordBacked, parseTileRef, serializeTileRef } from "@/stores/epics/canvas/tile-schema";
import {
  brainGraphTileId,
  makeBrainGraphTileRef,
} from "@/stores/epics/canvas/tile-schema/brain-graph-tile";
import { updateBrainGraphTile } from "@/stores/epics/canvas/actions";
import type { EpicCanvasState } from "@/stores/epics/canvas/types";

describe("brain-graph tile schema", () => {
  it("deduplicates by host and Brain and stays renderer-local", () => {
    const ref = makeBrainGraphTileRef({
      hostId: "host-one",
      brainId: "brain-one",
      vaultPath: "/vault/brain-one",
    });
    expect(ref.id).toBe(brainGraphTileId("host-one", "brain-one"));
    expect(isTileRefRecordBacked(ref)).toBe(false);
  });

  it("round-trips persistent filters without derived graph data", () => {
    const ref = {
      ...makeBrainGraphTileRef({
        hostId: "host-one",
        brainId: "brain-one",
        vaultPath: "/vault/brain-one",
      }),
      rootPath: "projects/hukum.md",
      depth: 2 as const,
      folder: "projects",
      query: "routing",
      includeOrphans: true,
    };
    const serialized = serializeTileRef(ref);
    expect(serialized).not.toHaveProperty("nodes");
    expect(serialized).not.toHaveProperty("edges");
    expect(parseTileRef(serialized)).toEqual(ref);
  });

  it("rejects a persisted graph without host, Brain, or vault identity", () => {
    expect(parseTileRef({ type: "brain-graph", brainId: "brain-one" })).toBeNull();
  });

  it("persists graph filters in the canvas tile state", () => {
    const ref = makeBrainGraphTileRef({
      hostId: "host-one",
      brainId: "brain-one",
      vaultPath: "/vault/brain-one",
    });
    const state: EpicCanvasState = {
      root: {
        kind: "pane",
        id: "pane-1",
        tabInstanceIds: [ref.instanceId],
        activeTabId: ref.instanceId,
        previewTabId: null,
        activationHistory: [ref.instanceId],
      },
      activePaneId: "pane-1",
      tilesByInstanceId: { [ref.instanceId]: ref },
      sizesByGroupId: {},
    };

    const next = updateBrainGraphTile(state, ref.id, {
      rootPath: "projects/hukum.md",
      depth: 2,
      folder: "projects",
      query: "routing",
      includeOrphans: true,
    });
    const updated = next.tilesByInstanceId[ref.instanceId];
    expect(updated?.type).toBe("brain-graph");
    if (updated === undefined || updated.type !== "brain-graph") return;
    expect(updated).toMatchObject({
      rootPath: "projects/hukum.md",
      depth: 2,
      folder: "projects",
      query: "routing",
      includeOrphans: true,
    });
  });
});
