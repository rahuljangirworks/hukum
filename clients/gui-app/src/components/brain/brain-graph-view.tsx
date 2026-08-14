import { useCallback, useMemo, useState } from "react";
import { Background, Controls, MarkerType, ReactFlow, type Edge, type NodeMouseHandler } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { LocateFixed, Network, X } from "lucide-react";
import type { ResponseOfMethod } from "@hukum-clients/shared/host-transport/host-messenger";
import type { HostRpcRegistry } from "@/lib/host";
import { useResolvedTheme } from "@/providers/use-resolved-theme";
import { Button } from "@/components/ui/button";
import type { BrainGraphTileRef } from "@/stores/epics/canvas/types";
import { layoutBrainGraphNodes } from "./brain-graph-layout";
import {
  BRAIN_GRAPH_NODE_TYPE,
  BrainGraphNodeView,
  brainGraphFolderTone,
  type BrainGraphFlowNode,
} from "./brain-graph-node";

type BrainGraphResponse = ResponseOfMethod<HostRpcRegistry, "brain.getGraph">;

const NODE_TYPES = { [BRAIN_GRAPH_NODE_TYPE]: BrainGraphNodeView };
const PRO_OPTIONS = { hideAttribution: true };

export interface BrainGraphViewProps {
  readonly graph: BrainGraphResponse;
  readonly tile: BrainGraphTileRef;
  readonly onOpenNote: (path: string, title: string) => void;
  readonly onPatchTile: (patch: Partial<Pick<BrainGraphTileRef, "rootPath" | "depth" | "folder" | "query" | "includeOrphans">>) => void;
}

export function BrainGraphView(props: BrainGraphViewProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(props.tile.rootPath);
  const { resolvedTheme } = useResolvedTheme();
  const positions = useMemo(
    () => layoutBrainGraphNodes(props.graph.nodes, props.tile.rootPath),
    [props.graph.nodes, props.tile.rootPath],
  );
  const handleSelect = useCallback((path: string) => setSelectedPath(path), []);
  const handleNodeClick = useCallback<NodeMouseHandler<BrainGraphFlowNode>>(
    (_event, node) => setSelectedPath(node.id),
    [],
  );
  const nodes = useMemo<BrainGraphFlowNode[]>(
    () => props.graph.nodes.map((node) => ({
      id: node.id,
      type: BRAIN_GRAPH_NODE_TYPE,
      position: positions.get(node.id) ?? { x: 0, y: 0 },
      width: Math.min(224, 160 + (node.incomingCount + node.outgoingCount) * 8),
      height: 76,
      draggable: false,
      data: {
        path: node.path,
        title: node.title,
        folder: node.folder,
        incomingCount: node.incomingCount,
        outgoingCount: node.outgoingCount,
        isRoot: node.isRoot,
        folderTone: brainGraphFolderTone(node.folder),
        onSelect: handleSelect,
        onOpen: props.onOpenNote,
      },
    })),
    [handleSelect, positions, props.graph.nodes, props.onOpenNote],
  );
  const edges = useMemo<Edge[]>(
    () => props.graph.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed },
      animated: edge.isEmbed,
      style: { opacity: 0.62 },
    })),
    [props.graph.edges],
  );
  const selected = props.graph.nodes.find((node) => node.path === selectedPath) ?? null;

  return (
    <div className="flex h-full min-h-0 w-full min-w-0">
      <div className="min-h-0 min-w-0 flex-1" data-testid="brain-graph-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          fitView
          minZoom={0.12}
          onNodeClick={handleNodeClick}
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable={false}
          elementsSelectable={false}
          proOptions={PRO_OPTIONS}
          colorMode={resolvedTheme}
          aria-label="Brain knowledge graph"
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      {selected === null ? null : (
        <aside className="flex w-full max-w-xs shrink-0 flex-col gap-3 border-l border-border bg-card/80 p-4" data-testid="brain-graph-detail">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold">{selected.title}</h3>
              <p className="break-all text-xs text-muted-foreground">{selected.path}</p>
            </div>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Close graph details" onClick={() => setSelectedPath(null)}>
              <X className="size-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{selected.incomingCount} incoming · {selected.outgoingCount} outgoing</p>
          <div className="flex flex-col gap-2">
            <Button type="button" size="sm" onClick={() => props.onOpenNote(selected.path, selected.title)}>
              Open note
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => props.onPatchTile({ rootPath: selected.path })}>
              <LocateFixed className="size-4" />
              Focus neighborhood
            </Button>
            {props.tile.rootPath === null ? null : (
              <Button type="button" size="sm" variant="ghost" onClick={() => props.onPatchTile({ rootPath: null })}>
                <Network className="size-4" />
                Show all notes
              </Button>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
