/**
 * Brain search store.
 *
 * Manages the search query and results for the brain sidebar.
 * Debounces input to avoid spamming the host RPC.
 */

import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BrainSearchResult {
  path: string;
  title: string;
  snippet: string;
  relevance: number;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface BrainSearchState {
  query: string;
  results: BrainSearchResult[];
  isSearching: boolean;
  error: string | null;

  setQuery: (query: string) => void;
  setResults: (results: BrainSearchResult[]) => void;
  setSearching: (searching: boolean) => void;
  setError: (error: string | null) => void;
  clearSearch: () => void;
}

export const useBrainSearchStore = create<BrainSearchState>((set) => ({
  query: "",
  results: [],
  isSearching: false,
  error: null,

  setQuery: (query) => set({ query, error: null }),
  setResults: (results) => set({ results, isSearching: false }),
  setSearching: (isSearching) => set({ isSearching }),
  setError: (error) => set({ error, isSearching: false }),
  clearSearch: () => set({ query: "", results: [], isSearching: false, error: null }),
}));
