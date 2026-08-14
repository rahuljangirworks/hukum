import { describe, expect, it } from "vitest";
import { layoutBrainGraphNodes } from "@/components/brain/brain-graph-layout";

const NODES = [
  { id: "projects/a.md", folder: "projects", isRoot: true },
  { id: "projects/b.md", folder: "projects", isRoot: false },
  { id: "knowledge/c.md", folder: "knowledge", isRoot: false },
];

describe("Brain graph layout", () => {
  it("places a local graph root at a stable center", () => {
    const first = layoutBrainGraphNodes(NODES, "projects/a.md");
    const second = layoutBrainGraphNodes([...NODES].reverse(), "projects/a.md");
    expect(first.get("projects/a.md")).toEqual({ x: 420, y: 300 });
    expect(second.get("projects/a.md")).toEqual({ x: 420, y: 300 });
  });

  it("groups overview nodes deterministically by folder and path", () => {
    const first = layoutBrainGraphNodes(NODES, null);
    const second = layoutBrainGraphNodes([...NODES].reverse(), null);
    expect([...first.entries()]).toEqual([...second.entries()]);
  });
});
