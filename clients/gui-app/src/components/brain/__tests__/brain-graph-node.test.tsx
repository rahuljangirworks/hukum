import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { NodeProps } from "@xyflow/react";
import { BrainGraphNodeView, type BrainGraphFlowNode } from "@/components/brain/brain-graph-node";

vi.mock("@xyflow/react", () => ({
  Handle: () => null,
  Position: { Top: "top", Bottom: "bottom" },
}));

describe("BrainGraphNodeView", () => {
  it("selects on click and opens on double-click or Enter", () => {
    const onSelect = vi.fn();
    const onOpen = vi.fn();
    const node = {
      id: "projects/hukum.md",
      type: "brainGraphNote",
      position: { x: 0, y: 0 },
      data: {
        path: "projects/hukum.md",
        title: "Hukum",
        folder: "projects",
        incomingCount: 2,
        outgoingCount: 3,
        isRoot: true,
        folderTone: 0,
        onSelect,
        onOpen,
      },
    } satisfies BrainGraphFlowNode;
    const nodeProps = { data: node.data } as unknown as NodeProps<BrainGraphFlowNode>;
    render(<BrainGraphNodeView {...nodeProps} />);
    const button = screen.getByRole("button", { name: /Hukum, 2 incoming links, 3 outgoing links/ });
    fireEvent.click(button);
    expect(onSelect).toHaveBeenCalledWith("projects/hukum.md");
    fireEvent.doubleClick(button);
    fireEvent.keyDown(button, { key: "Enter" });
    expect(onOpen).toHaveBeenCalledTimes(2);
    expect(onOpen).toHaveBeenLastCalledWith("projects/hukum.md", "Hukum");
  });
});
