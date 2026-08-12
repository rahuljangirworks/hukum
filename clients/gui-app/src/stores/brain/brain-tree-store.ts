/**
 * Brain tree store.
 *
 * Manages folder expansion state and the currently selected/open note
 * in the brain sidebar folder tree.
 */

import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BrainFolderEntry {
  path: string;
  name: string;
  isDir: boolean;
  title?: string;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface BrainTreeState {
  /** Set of expanded folder paths */
  expandedFolders: ReadonlySet<string>;
  /** Currently selected/open note path (for preview) */
  openNotePath: string | null;
  /** Cached folder entries by parent path */
  folderCache: Readonly<Record<string, BrainFolderEntry[] | undefined>>;

  // Actions
  toggleFolder: (path: string) => void;
  expandFolder: (path: string) => void;
  collapseFolder: (path: string) => void;
  setOpenNote: (path: string | null) => void;
  setFolderEntries: (parentPath: string, entries: BrainFolderEntry[]) => void;
  clearCache: () => void;
}

export const useBrainTreeStore = create<BrainTreeState>((set) => ({
  expandedFolders: new Set<string>(),
  openNotePath: null,
  folderCache: {},

  toggleFolder: (path) =>
    set((state) => {
      const next = new Set(state.expandedFolders);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return { expandedFolders: next };
    }),

  expandFolder: (path) =>
    set((state) => {
      if (state.expandedFolders.has(path)) return state;
      const next = new Set(state.expandedFolders);
      next.add(path);
      return { expandedFolders: next };
    }),

  collapseFolder: (path) =>
    set((state) => {
      if (!state.expandedFolders.has(path)) return state;
      const next = new Set(state.expandedFolders);
      next.delete(path);
      return { expandedFolders: next };
    }),

  setOpenNote: (openNotePath) => set({ openNotePath }),

  setFolderEntries: (parentPath, entries) =>
    set((state) => ({
      folderCache: { ...state.folderCache, [parentPath]: entries },
    })),

  clearCache: () => set({ folderCache: {}, expandedFolders: new Set() }),
}));
