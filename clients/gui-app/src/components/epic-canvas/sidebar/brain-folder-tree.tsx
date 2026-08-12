/**
 * Brain folder tree — collapsible tree of vault directories and notes.
 *
 * Lazy-loads folder contents when expanded (via RPC or store cache).
 * Directories show first, then files alphabetically.
 */

import { useCallback } from "react";
import { ChevronRight, Folder, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useBrainTreeStore,
  type BrainFolderEntry,
} from "@/stores/brain/brain-tree-store";

// ─── Root Tree ────────────────────────────────────────────────────────────────

export function BrainFolderTree() {
  const folderCache = useBrainTreeStore((s) => s.folderCache);
  const rootEntries = folderCache[""] ?? [];

  if (rootEntries.length === 0) {
    return (
      <div className="px-3 py-2 text-xs text-muted-foreground">
        No notes yet. The agent will populate your brain over time.
      </div>
    );
  }

  return (
    <div className="px-1 py-1" data-testid="brain-folder-tree">
      {rootEntries.map((entry) =>
        entry.isDir ? (
          <BrainFolderNode key={entry.path} entry={entry} depth={0} />
        ) : (
          <BrainNoteItem key={entry.path} entry={entry} depth={0} />
        ),
      )}
    </div>
  );
}

// ─── Folder Node ──────────────────────────────────────────────────────────────

function BrainFolderNode({
  entry,
  depth,
}: {
  entry: BrainFolderEntry;
  depth: number;
}) {
  const expanded = useBrainTreeStore((s) => s.expandedFolders.has(entry.path));
  const toggleFolder = useBrainTreeStore((s) => s.toggleFolder);
  const folderCache = useBrainTreeStore((s) => s.folderCache);
  const children = folderCache[entry.path];

  const handleClick = useCallback(() => {
    toggleFolder(entry.path);
    // In a real implementation, this would trigger an RPC to load children
    // if they're not in the cache yet. The hook layer handles that.
  }, [entry.path, toggleFolder]);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex w-full items-center gap-1 rounded px-1.5 py-[3px] text-left hover:bg-accent/50",
        )}
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
      >
        <ChevronRight
          className={cn(
            "h-3 w-3 shrink-0 text-muted-foreground/60 transition-transform",
            expanded && "rotate-90",
          )}
        />
        <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate text-[0.8125rem] text-foreground">
          {formatFolderName(entry.name)}
        </span>
      </button>

      {expanded && children && (
        <>
          {children.map((child) =>
            child.isDir ? (
              <BrainFolderNode
                key={child.path}
                entry={child}
                depth={depth + 1}
              />
            ) : (
              <BrainNoteItem
                key={child.path}
                entry={child}
                depth={depth + 1}
              />
            ),
          )}
          {children.length === 0 && (
            <div
              className="text-[0.6875rem] text-muted-foreground/60 italic"
              style={{ paddingLeft: `${(depth + 1) * 12 + 24}px` }}
            >
              Empty
            </div>
          )}
        </>
      )}
    </>
  );
}

// ─── Note Item ────────────────────────────────────────────────────────────────

function BrainNoteItem({
  entry,
  depth,
}: {
  entry: BrainFolderEntry;
  depth: number;
}) {
  const openNotePath = useBrainTreeStore((s) => s.openNotePath);
  const setOpenNote = useBrainTreeStore((s) => s.setOpenNote);
  const isActive = openNotePath === entry.path;

  const handleClick = useCallback(() => {
    setOpenNote(entry.path);
  }, [entry.path, setOpenNote]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full items-center gap-1.5 rounded px-1.5 py-[3px] text-left",
        isActive
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent/50 text-foreground",
      )}
      style={{ paddingLeft: `${depth * 12 + 20}px` }}
    >
      <FileText
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          isActive ? "text-accent-foreground" : "text-muted-foreground",
        )}
      />
      <span className="truncate text-[0.8125rem]">
        {entry.title ?? entry.name.replace(/\.md$/, "")}
      </span>
    </button>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Remove leading numbers and dashes from folder names for display */
function formatFolderName(name: string): string {
  // Strip leading "00-09-" or "10-19-" patterns from Johnny Decimal names
  return name.replace(/^\d+-\d+-/, "").replace(/^_/, "");
}
