/**
 * Close all open workspace-file tiles that belong to a brain vault.
 *
 * Called when switching brains — closes tabs for the OLD vault path
 * so the canvas doesn't show stale files from the previous brain.
 *
 * Iterates all open canvases, finds workspace-file tiles whose
 * `workspacePath` matches the given vault path, and closes them.
 */

import { useEpicCanvasStore } from "@/stores/epics/canvas/store";
import { collectPanes } from "@/stores/epics/canvas/tile-tree";
import { isWorkspaceFileRef, WORKSPACE_FILE_TAB_KIND } from "@/stores/epics/canvas/types";

/**
 * Close all workspace-file tiles whose `workspacePath` matches `vaultPath`.
 * Call this BEFORE switching the active brain so the old tabs disappear.
 */
export function closeBrainVaultTabs(vaultPath: string): void {
  const store = useEpicCanvasStore.getState();
  const { canvasByTabId, tabsById } = store;

  // Collect all tiles to close: { tabId, paneId, tileInstanceId }
  const toClose: Array<{ tabId: string; paneId: string; tileInstanceId: string }> = [];

  for (const [tabId, canvas] of Object.entries(canvasByTabId)) {
    if (canvas === undefined || canvas.root === null) continue;
    if (tabsById[tabId] === undefined) continue;

    const panes = collectPanes(canvas.root);
    for (const pane of panes) {
      for (const tileInstanceId of pane.tabInstanceIds) {
        const tile = canvas.tilesByInstanceId[tileInstanceId];
        if (tile === undefined) continue;
        if (tile.type !== WORKSPACE_FILE_TAB_KIND) continue;
        if (isWorkspaceFileRef(tile) && tile.workspacePath === vaultPath) {
          toClose.push({ tabId, paneId: pane.id, tileInstanceId });
        }
      }
    }
  }

  // Close each tile (process in reverse to avoid index invalidation issues)
  for (const { tabId, paneId, tileInstanceId } of toClose.reverse()) {
    store.closeCanvasTab(tabId, paneId, tileInstanceId);
  }
}
