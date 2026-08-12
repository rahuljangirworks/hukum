/**
 * Brain sidebar section — the "BRAIN" panel body in the left sidebar.
 *
 * Shows either:
 * - Empty state with setup CTA (when no brain configured)
 * - Search + folder tree + skills (when configured)
 */

import { useEffect } from "react";
import { Brain } from "lucide-react";
import { useBrainConfigStore, selectActiveBrain, selectHasMultipleBrains } from "@/stores/brain/brain-config-store";
import { useBrainTreeStore } from "@/stores/brain/brain-tree-store";
import { BrainSearchInput } from "./brain-search-input";
import { BrainFolderTree } from "./brain-folder-tree";
import { BrainSkillList } from "./brain-skill-list";
import { Button } from "@/components/ui/button";

export function BrainSidebarSection() {
  const isConfigured = useBrainConfigStore((s) => s.isConfigured);
  const openSetupWizard = useBrainConfigStore((s) => s.openSetupWizard);

  return (
    <div className="flex flex-col" data-testid="brain-sidebar-section">
      {isConfigured ? <BrainConfiguredContent /> : <BrainEmptyState onSetup={openSetupWizard} />}
    </div>
  );
}

// ─── Configured State ─────────────────────────────────────────────────────────

function BrainConfiguredContent() {
  const config = useBrainConfigStore((s) => s.config);
  const setFolderEntries = useBrainTreeStore((s) => s.setFolderEntries);
  const folderCache = useBrainTreeStore((s) => s.folderCache);

  // Populate root entries from config template when cache is empty
  useEffect(() => {
    if (folderCache[""] && folderCache[""].length > 0) return;
    if (!config) return;

    const TEMPLATE_DIRS: Record<string, string[]> = {
      para: ["inbox", "projects", "areas", "resources", "archive", "_agent"],
      "johnny-decimal": ["00-09-inbox", "10-19-work", "20-29-personal", "30-39-knowledge", "40-49-resources", "90-99-archive", "_agent"],
      zettelkasten: ["inbox", "notes", "references", "_agent"],
      existing: ["_agent"],
    };

    const dirs = TEMPLATE_DIRS[config.template] ?? TEMPLATE_DIRS.para;
    const entries = dirs.map((name) => ({
      path: name,
      name,
      isDir: true,
    }));
    entries.push({ path: "_config.md", name: "_config.md", isDir: false, title: "Brain Config" });

    setFolderEntries("", entries);
  }, [config, folderCache, setFolderEntries]);

  // Derive brain display name from vault path
  const activeBrain = useBrainConfigStore(selectActiveBrain);
  const brains = useBrainConfigStore((s) => s.brains);
  const hasMultiple = useBrainConfigStore(selectHasMultipleBrains);
  const switchBrain = useBrainConfigStore((s) => s.switchBrain);
  const openSetupWizard = useBrainConfigStore((s) => s.openSetupWizard);
  const removeBrainEntry = useBrainConfigStore((s) => s.removeBrainEntry);

  const brainName = activeBrain?.name ?? config?.vaultPath?.split("/").pop()?.replace(/^\./, "") ?? "brain";
  const brainPath = activeBrain?.vaultPath ?? config?.vaultPath ?? "";
  const templateLabel = config?.template === "para" ? "PARA"
    : config?.template === "johnny-decimal" ? "Johnny Decimal"
    : config?.template === "zettelkasten" ? "Zettelkasten"
    : "Custom";

  return (
    <div className="flex flex-col gap-0 pb-2">
      {/* Brain info header — matches File Tree workspace header */}
      <div className="px-3 py-2 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-foreground truncate">{brainName}</span>
              <span className="text-xs text-muted-foreground">· {templateLabel}</span>
            </div>
            <p className="text-[0.6875rem] text-muted-foreground font-mono truncate mt-0.5">{brainPath}</p>
          </div>
        </div>
      </div>

      {/* Search / filter */}
      <BrainSearchInput />

      {/* Folder tree */}
      <BrainFolderTree />

      {/* Skills */}
      <BrainSkillList />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function BrainEmptyState({ onSetup }: { onSetup: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Brain className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          Set up your brain
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your agent will remember things across sessions and search your notes for context.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onSetup}
        className="mt-1"
      >
        Set up brain
      </Button>
    </div>
  );
}
