/**
 * Brain note tile — renders a markdown note from the brain vault in the canvas.
 * Reads the note content from the brain tree store and renders it as formatted markdown.
 */

import { useState, useEffect } from "react";
import { FileText, ExternalLink } from "lucide-react";
import type { TileRenderArgs } from "./tile-render";
import type { BrainNoteTileRef } from "@/stores/epics/canvas/tile-schema/brain-note-tile";
import { useBrainConfigStore } from "@/stores/brain/brain-config-store";

export function BrainNoteTile({ node }: TileRenderArgs<BrainNoteTileRef>) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const config = useBrainConfigStore((s) => s.config);

  useEffect(() => {
    if (!config?.vaultPath || !node.notePath) {
      setLoading(false);
      return;
    }

    // Read the file content directly (in production this would be via RPC)
    // For now, show a placeholder with the note path info
    setContent(null);
    setLoading(false);
  }, [config, node.notePath]);

  const title = node.name || node.notePath.replace(/\.md$/, "").split("/").pop() || "Note";

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3 shrink-0">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-medium text-foreground truncate">{title}</h2>
          <p className="text-[0.6875rem] text-muted-foreground font-mono truncate">{node.notePath}</p>
        </div>
        {config?.vaultPath && (
          <button
            type="button"
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Open in system editor"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
          </div>
        ) : content ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
              {content}
            </pre>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {config?.vaultPath}/{node.notePath}
              </p>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs mt-2">
              Brain note preview will load when the brain RPC is connected.
              For now, you can edit this note directly in your vault.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
