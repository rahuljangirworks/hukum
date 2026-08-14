import { memo, type KeyboardEvent } from "react";
import { Brain, FileText } from "lucide-react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";

export const BRAIN_GRAPH_NODE_TYPE = "brainGraphNote";

export interface BrainGraphNodeData extends Record<string, unknown> {
  readonly path: string;
  readonly title: string;
  readonly folder: string;
  readonly incomingCount: number;
  readonly outgoingCount: number;
  readonly isRoot: boolean;
  readonly folderTone: number;
  readonly onSelect: (path: string) => void;
  readonly onOpen: (path: string, title: string) => void;
}

export type BrainGraphFlowNode = Node<BrainGraphNodeData, typeof BRAIN_GRAPH_NODE_TYPE>;

export const BrainGraphNodeView = memo(function BrainGraphNodeView(
  props: NodeProps<BrainGraphFlowNode>,
) {
  const { data } = props;
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    data.onOpen(data.path, data.title);
  };
  return (
    <button
      type="button"
      onClick={() => data.onSelect(data.path)}
      onDoubleClick={() => data.onOpen(data.path, data.title)}
      onKeyDown={handleKeyDown}
      aria-label={`${data.title}, ${data.incomingCount} incoming links, ${data.outgoingCount} outgoing links`}
      data-testid={`brain-graph-node-${data.path}`}
      className={cn(
        "flex w-full flex-col gap-1 rounded-lg border bg-card px-3 py-2 text-left text-ui-xs shadow-sm hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        data.isRoot && "border-primary ring-2 ring-primary/25",
        data.folderTone === 0 && "bg-blue-500/5",
        data.folderTone === 1 && "bg-emerald-500/5",
        data.folderTone === 2 && "bg-violet-500/5",
        data.folderTone === 3 && "bg-amber-500/5",
        data.folderTone === 4 && "bg-rose-500/5",
      )}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} className="pointer-events-none opacity-0" />
      <span className="flex min-w-0 items-center gap-2 font-medium">
        {data.isRoot ? <Brain className="size-3.5 shrink-0 text-primary" /> : <FileText className="size-3.5 shrink-0 text-muted-foreground" />}
        <span className="truncate">{data.title}</span>
      </span>
      <span className="truncate text-muted-foreground">{data.folder || "Root"}</span>
      <span className="text-muted-foreground">{data.incomingCount} in · {data.outgoingCount} out</span>
      <Handle type="source" position={Position.Bottom} isConnectable={false} className="pointer-events-none opacity-0" />
    </button>
  );
});

export function brainGraphFolderTone(folder: string): number {
  let hash = 0;
  for (const character of folder) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return hash % 5;
}
