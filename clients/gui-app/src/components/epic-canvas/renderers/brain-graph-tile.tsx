import { useCallback } from "react";
import { Network, RefreshCw } from "lucide-react";
import type { BrainGraphTileRef } from "@/stores/epics/canvas/types";
import { useEpicCanvasStore } from "@/stores/epics/canvas/store";
import { useBrainGraph } from "@/hooks/brain";
import { useEpicTileNavigation } from "@/hooks/epic/use-epic-tile-navigation";
import { workspaceFileRefFromTreePath } from "@/components/epic-canvas/workspace-file/workspace-file-ref";
import { BrainGraphView } from "@/components/brain/brain-graph-view";
import { AgentSpinningDots } from "@/components/ui/agent-spinning-dots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface BrainGraphTileProps {
  readonly node: BrainGraphTileRef;
  readonly viewTabId: string;
  readonly epicId: string;
}

export function BrainGraphTile(props: BrainGraphTileProps) {
  const updateTile = useEpicCanvasStore((state) => state.updateBrainGraphTileInTab);
  const tileNavigation = useEpicTileNavigation();
  const graphQuery = useBrainGraph({
    ...(props.node.rootPath === null ? {} : { rootPath: props.node.rootPath }),
    depth: props.node.depth,
    ...(props.node.folder === null ? {} : { folder: props.node.folder }),
    ...(props.node.query.length === 0 ? {} : { query: props.node.query }),
    includeOrphans: props.node.includeOrphans,
    maxNodes: 250,
  });
  const patchTile = useCallback(
    (patch: Partial<Pick<BrainGraphTileRef, "rootPath" | "depth" | "folder" | "query" | "includeOrphans">>) => {
      updateTile(props.viewTabId, props.node.id, patch);
    },
    [props.node.id, props.viewTabId, updateTile],
  );
  const openNote = useCallback(
    (path: string, title: string) => {
      const ref = workspaceFileRefFromTreePath(props.node.hostId, props.node.vaultPath, path, title);
      if (ref !== null) tileNavigation.openTileInEpic(props.epicId, ref);
    },
    [props.epicId, props.node.hostId, props.node.vaultPath, tileNavigation],
  );

  const graph = graphQuery.data;
  const wrongBrain = graph !== undefined && graph.brainId !== props.node.brainId;
  return (
    <div className="flex h-full min-h-0 flex-col bg-background" data-testid="brain-graph-tile">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <Network className="size-4 text-muted-foreground" />
        <Input
          value={props.node.query}
          onChange={(event) => patchTile({ query: event.target.value })}
          placeholder="Filter notes"
          aria-label="Filter Brain graph"
          className="h-8 min-w-40 flex-1"
        />
        <Input
          value={props.node.folder ?? ""}
          onChange={(event) => {
            const folder = event.target.value.trim();
            patchTile({ folder: folder.length === 0 ? null : folder });
          }}
          placeholder="Folder"
          aria-label="Filter Brain graph by folder"
          className="h-8 w-36"
        />
        <select
          value={props.node.depth}
          onChange={(event) => patchTile({ depth: event.target.value === "2" ? 2 : 1 })}
          aria-label="Graph depth"
          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
        >
          <option value={1}>1 hop</option>
          <option value={2}>2 hops</option>
        </select>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <input type="checkbox" checked={props.node.includeOrphans} onChange={(event) => patchTile({ includeOrphans: event.target.checked })} />
          Orphans
        </label>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Refresh Brain graph" onClick={() => void graphQuery.refetch()}>
          <RefreshCw className="size-4" />
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        {graphQuery.isPending ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground"><AgentSpinningDots className="size-4" testId="brain-graph-loading-spinner" variant={undefined} /> Loading graph</div>
        ) : graphQuery.error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm font-medium">Could not load the Brain graph</p>
            <p className="text-xs text-muted-foreground">{graphQuery.error.message}</p>
            <Button type="button" size="sm" variant="outline" onClick={() => void graphQuery.refetch()}>Retry</Button>
          </div>
        ) : wrongBrain ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">This graph belongs to an inactive Brain. Open Graph again from the active Brain.</div>
        ) : graph === undefined || graph.nodes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center" data-testid="brain-graph-empty">
            <Network className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">No connected notes yet</p>
            <p className="max-w-sm text-xs text-muted-foreground">Add links such as [[Project Notes]] to your Markdown files, or enable Orphans to include unlinked notes.</p>
          </div>
        ) : (
          <div className="relative h-full">
            {graph.truncated ? <div className="absolute right-3 top-3 z-10 rounded-md border bg-background/90 px-2 py-1 text-xs text-muted-foreground">Showing the top 250 notes</div> : null}
            <BrainGraphView graph={graph} tile={props.node} onOpenNote={openNote} onPatchTile={patchTile} />
          </div>
        )}
      </div>
    </div>
  );
}
