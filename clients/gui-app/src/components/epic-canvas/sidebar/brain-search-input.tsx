/**
 * Brain search input — inline search bar in the brain sidebar section.
 *
 * Debounces keystrokes by 300ms before triggering a search RPC.
 * Shows results inline below the input.
 */

import { useCallback, useEffect, useRef } from "react";
import { Search, X, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrainSearchStore } from "@/stores/brain/brain-search-store";
import { useBrainTreeStore } from "@/stores/brain/brain-tree-store";

export function BrainSearchInput() {
  const query = useBrainSearchStore((s) => s.query);
  const results = useBrainSearchStore((s) => s.results);
  const isSearching = useBrainSearchStore((s) => s.isSearching);
  const setQuery = useBrainSearchStore((s) => s.setQuery);
  const clearSearch = useBrainSearchStore((s) => s.clearSearch);
  const setOpenNote = useBrainTreeStore((s) => s.setOpenNote);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (value: string) => {
      setQuery(value);

      // Debounce the actual search
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!value.trim()) return;

      debounceRef.current = setTimeout(() => {
        // The actual RPC call would be triggered here via a hook/effect
        // For now, the store exposes setResults for the host-client hook to call
        useBrainSearchStore.getState().setSearching(true);
      }, 300);
    },
    [setQuery],
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleResultClick = useCallback(
    (path: string) => {
      setOpenNote(path);
      clearSearch();
    },
    [setOpenNote, clearSearch],
  );

  return (
    <div className="px-2">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
        <input
          type="text"
          placeholder="Search brain..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          className={cn(
            "h-7 w-full rounded-md border border-border/40 bg-background/50 pl-7 pr-7 text-[0.8125rem]",
            "placeholder:text-muted-foreground/50",
            "focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/20",
          )}
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground/60 hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Search results */}
      {query.trim() && (
        <div className="mt-1 max-h-48 overflow-y-auto rounded-md border border-border/40 bg-card/80">
          {isSearching ? (
            <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="py-3 text-center text-xs text-muted-foreground">
              No results found
            </div>
          ) : (
            results.map((result) => (
              <button
                key={result.path}
                type="button"
                onClick={() => handleResultClick(result.path)}
                className="flex w-full items-start gap-2 px-2.5 py-1.5 text-left hover:bg-accent/50 first:rounded-t-md last:rounded-b-md"
              >
                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[0.8125rem] font-medium text-foreground">
                    {result.title}
                  </div>
                  {result.snippet && (
                    <div className="mt-0.5 truncate text-[0.6875rem] text-muted-foreground">
                      {result.snippet}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
