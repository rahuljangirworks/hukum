/**
 * Brain folder tree — full vault file browser powered by the workspace
 * infrastructure (@pierre/trees + workspace.listFileTree).
 *
 * Shows ALL file types (not just .md), supports filtering, and opens files
 * as WorkspaceFileRef tiles in the canvas — the same editor as workspace files.
 * Brain-specific decorators (WikiLink badges, backlink counts) will be added
 * in Phase C.
 */

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from "react";
import { FileTree, useFileTree, useFileTreeSearch } from "@pierre/trees/react";
import type { GitStatusEntry } from "@pierre/trees";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { AgentSpinningDots } from "@/components/ui/agent-spinning-dots";
import { PIERRE_FILE_TREE_THEME_STYLE } from "@/components/epic-canvas/pierre-tree-theme";
import { workspaceFileRefFromTreePath } from "@/components/epic-canvas/workspace-file/workspace-file-ref";
import { extractPierreItemPathFromEvent } from "@/components/epic-canvas/pierre-tree-adapter";
import { useEpicNestedFocusNavigation } from "@/hooks/epic/use-epic-nested-focus-navigation";
import { useReactiveActiveHostId } from "@/hooks/host/use-reactive-active-host-id";
import { useWorkspaceListFileTree } from "@/hooks/workspace/use-list-file-tree-query";
import { useDebouncedValue } from "@/hooks/ui/use-debounced-value";
import { useEpicCanvasStore } from "@/stores/epics/canvas/store";
import { useBrainConfigStore } from "@/stores/brain/brain-config-store";
import type { WorkspaceFileRef } from "@/stores/epics/canvas/types";
import type { NestedFocusTarget } from "@/lib/epic-nested-focus-route";

/** Filter-box pause before the local filter runs. */
const SEARCH_DEBOUNCE_MS = 200;

const EMPTY_TREE_PATHS: ReadonlyArray<string> = Object.freeze([]);
const EMPTY_GIT_STATUS: ReadonlyArray<GitStatusEntry> = Object.freeze([]);

// ─── Main Component ───────────────────────────────────────────────────────────

export interface BrainFolderTreeProps {
  readonly epicId: string;
  readonly tabId: string;
}

export function BrainFolderTree(props: BrainFolderTreeProps) {
  const config = useBrainConfigStore((s) => s.config);
  const vaultPath = config?.vaultPath ?? null;

  if (!vaultPath) {
    return (
      <div className="px-3 py-2 text-xs text-muted-foreground">
        No brain configured.
      </div>
    );
  }

  return (
    <BrainFileTreeBody
      epicId={props.epicId}
      tabId={props.tabId}
      vaultPath={vaultPath}
    />
  );
}

// ─── File Tree Body ───────────────────────────────────────────────────────────

function BrainFileTreeBody(props: {
  readonly epicId: string;
  readonly tabId: string;
  readonly vaultPath: string;
}) {
  const activeHostId = useReactiveActiveHostId();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);

  // Fetch the file tree using the existing workspace.listFileTree RPC
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- Brain vaults do not yet expose a file-list subscription.
  const fileTreeQuery = useWorkspaceListFileTree(props.vaultPath, true);

  // Build the path list and file name map from the query data
  const files = fileTreeQuery.data?.files;
  const treePaths = files?.map((file) => file.path) ?? EMPTY_TREE_PATHS;

  // Navigation helpers
  const navigateNested = useEpicNestedFocusNavigation();
  const prepareOpenTilePreviewInTabFocusTarget = useEpicCanvasStore(
    (s) => s.prepareOpenTilePreviewInTabFocusTarget,
  );
  const prepareOpenTileInTabFocusTarget = useEpicCanvasStore(
    (s) => s.prepareOpenTileInTabFocusTarget,
  );

  // Handlers for single-click (preview) and double-click (pin)
  const handlersRef = useRef({
    onSelect(_treePath: string) {},
    onOpen(_treePath: string) {},
  });

  useEffect(() => {
    const fileNameByPath = new Map(
      files?.map((file) => [file.path, file.name]) ?? [],
    );
    const workspaceFileRefForTreePath = (
      treePath: string,
    ): WorkspaceFileRef | null => {
      if (activeHostId === null) return null;
      const name = fileNameByPath.get(treePath);
      if (name === undefined) return null; // directory row, not openable
      return workspaceFileRefFromTreePath(
        activeHostId,
        props.vaultPath,
        treePath,
        name,
      );
    };
    const openInTab = (
      treePath: string,
      open: (tabId: string, ref: WorkspaceFileRef) => NestedFocusTarget | null,
    ) => {
      const ref = workspaceFileRefForTreePath(treePath);
      if (ref === null) return;
      navigateNested(props.epicId, props.tabId, () => open(props.tabId, ref));
    };
    handlersRef.current.onSelect = (treePath) => {
      openInTab(treePath, prepareOpenTilePreviewInTabFocusTarget);
    };
    handlersRef.current.onOpen = (treePath) => {
      openInTab(treePath, prepareOpenTileInTabFocusTarget);
    };
  }, [
    activeHostId,
    files,
    navigateNested,
    props.epicId,
    props.tabId,
    props.vaultPath,
    prepareOpenTilePreviewInTabFocusTarget,
    prepareOpenTileInTabFocusTarget,
  ]);

  // Pierre file tree model
  const { model } = useFileTree({
    paths: treePaths,
    initialExpansion: "closed",
    density: "compact",
    icons: "complete",
    stickyFolders: true,
    gitStatus: EMPTY_GIT_STATUS,
    fileTreeSearchMode: "hide-non-matches",
    onSelectionChange: (selectedPaths) => {
      const selectedPath = selectedPaths.at(-1);
      if (selectedPath === undefined) return;
      handlersRef.current.onSelect(selectedPath);
    },
  });

  // Filter/search input
  const handleSearchQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Apply local filter to the tree model
  useEffect(() => {
    model.setSearch(debouncedQuery.length > 0 ? debouncedQuery : null);
  }, [model, debouncedQuery]);

  // `useFileTree` only consumes `paths` when its model is created. The query
  // starts with an empty snapshot, so apply each new authoritative path list
  // imperatively just like the workspace File Tree does. Re-assert an active
  // filter because Pierre retains its search value across resetPaths without
  // recomputing the matches against the new tree store.
  const appliedFilesRef = useRef(files);
  useEffect(() => {
    if (appliedFilesRef.current === files) return;
    appliedFilesRef.current = files;
    model.resetPaths(treePaths);
    if (debouncedQuery.length === 0) return;
    model.setSearch(null);
    model.setSearch(debouncedQuery);
  }, [debouncedQuery, files, model, treePaths]);

  // No-matches detection
  const pierreSearch = useFileTreeSearch(model);
  const noMatches =
    debouncedQuery.length > 0 &&
    pierreSearch.value.length > 0 &&
    pierreSearch.matchingPaths.length === 0;

  // Double-click handler for pinning tabs
  const handleDoubleClick = (event: MouseEvent<HTMLElement>) => {
    const treePath = extractPierreItemPathFromEvent(event);
    if (treePath === null) return;
    handlersRef.current.onOpen(treePath);
  };

  const isLoading = fileTreeQuery.isPending;
  const hasError = fileTreeQuery.isError;

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      onDoubleClickCapture={handleDoubleClick}
      data-testid="brain-folder-tree"
    >
      {/* Filter input */}
      <div className="px-2 pb-1.5">
        <InputGroup className="h-7">
          <InputGroupAddon align="inline-start">
            <Search className="size-3.5" aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            type="text"
            value={searchQuery}
            onChange={handleSearchQueryChange}
            placeholder="Filter files…"
            aria-label="Filter brain files"
            className="text-ui-sm"
          />
        </InputGroup>
      </div>

      {/* Tree */}
      <div className="relative min-h-0 flex-1 px-2">
        <div className={cn("h-full", noMatches && "invisible")}>
          <FileTree model={model} style={PIERRE_FILE_TREE_THEME_STYLE} />
        </div>

        {noMatches ? (
          <output
            aria-label="No matching files"
            className="pointer-events-none absolute inset-0 flex items-center justify-center px-3 text-center text-ui-xs text-muted-foreground"
          >
            No files match the filter.
          </output>
        ) : null}

        {isLoading ? (
          <output
            aria-label="Loading files"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <AgentSpinningDots
              className="text-muted-foreground"
              testId={undefined}
              variant={undefined}
            />
          </output>
        ) : null}

        {hasError ? (
          <div className="px-3 py-2 text-ui-xs text-destructive">
            Unable to load vault files.
          </div>
        ) : null}
      </div>
    </div>
  );
}
