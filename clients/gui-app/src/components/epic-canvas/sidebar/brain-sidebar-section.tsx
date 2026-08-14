/**
 * Brain sidebar section — the "BRAIN" panel body in the left sidebar.
 *
 * Shows either:
 * - Empty state with setup CTA (when no brain configured)
 * - Brain header + file tree (powered by workspace infrastructure) + skills
 *
 * The file tree uses @pierre/trees + workspace.listFileTree with the brain
 * vault path. Clicking a file opens a WorkspaceFileRef tile in the canvas.
 */

import { useState, useEffect } from "react";
import { Brain, Network, Plus, Settings2 } from "lucide-react";
import {
  useBrainConfigStore,
  type BrainEntry,
} from "@/stores/brain/brain-config-store";
import { useBrainRegistry } from "@/hooks/brain";
import { BrainSearchInput } from "./brain-search-input";
import { BrainFolderTree } from "./brain-folder-tree";
import { ConnectedBrainSkillList } from "./brain-skill-list";
import { BrainPickerDropdown } from "./brain-picker-dropdown";
import { BrainAddFolderDialog } from "@/components/brain/brain-add-folder-dialog";
import { Button } from "@/components/ui/button";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";
import { useSystemTabModalActions } from "@/stores/tabs/use-system-tab-modal";
import { useOpenBrainGraph } from "@/components/brain/use-open-brain-graph";

export interface BrainSidebarSectionProps {
  readonly epicId: string;
  readonly tabId: string;
}

function normalizeBrainTemplate(template: string): BrainEntry["template"] {
  if (
    template === "para" ||
    template === "johnny-decimal" ||
    template === "zettelkasten"
  ) {
    return template;
  }
  return "existing";
}

export function BrainSidebarSection(props: BrainSidebarSectionProps) {
  const isConfigured = useBrainConfigStore((s) => s.isConfigured);
  const openSetupWizard = useBrainConfigStore((s) => s.openSetupWizard);
  const setBrains = useBrainConfigStore((s) => s.setBrains);
  const [addFolderOpen, setAddFolderOpen] = useState(false);
  const { openSettings } = useSystemTabModalActions();

  // Sync the brain store from the backend registry on mount and when it changes
  const registryQuery = useBrainRegistry();
  useEffect(() => {
    if (registryQuery.data) {
      setBrains(
        registryQuery.data.brains.map((brain) => ({
          ...brain,
          template: normalizeBrainTemplate(brain.template),
        })),
        registryQuery.data.activeBrainId,
      );
    }
  }, [registryQuery.data, setBrains]);

  // First brain: open the full wizard. Additional brains: simple folder picker.
  const handleAddBrain = () => {
    if (!isConfigured) {
      openSetupWizard();
    } else {
      setAddFolderOpen(true);
    }
  };

  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      data-testid="brain-sidebar-section"
    >
      {isConfigured ? (
        <BrainConfiguredContent
          epicId={props.epicId}
          tabId={props.tabId}
          onAddBrain={handleAddBrain}
          onManageCapabilities={() =>
            openSettings({ section: "brain", resetToGeneral: false })
          }
        />
      ) : (
        <BrainEmptyState onSetup={openSetupWizard} />
      )}
      <BrainAddFolderDialog
        open={addFolderOpen}
        onOpenChange={setAddFolderOpen}
      />
    </div>
  );
}

// ─── Configured State ─────────────────────────────────────────────────────────

function BrainConfiguredContent(props: {
  epicId: string;
  tabId: string;
  onAddBrain: () => void;
  onManageCapabilities: () => void;
}) {
  const openGraph = useOpenBrainGraph(props.epicId);
  return (
    <div className="flex flex-col flex-1 min-h-0 gap-0 pb-2">
      {/* Brain header with picker dropdown + add button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 shrink-0">
        <BrainPickerDropdown onAddBrain={props.onAddBrain} />
        <div className="flex items-center gap-0.5">
          <TooltipWrapper
            label="Open knowledge graph"
            side="top"
            sideOffset={4}
            align="center"
          >
            <button
              type="button"
              onClick={openGraph}
              className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
              aria-label="Open knowledge graph"
              data-testid="brain-open-knowledge-graph"
            >
              <Network className="h-3.5 w-3.5" />
            </button>
          </TooltipWrapper>
          <TooltipWrapper
            label="Manage Brain capabilities"
            side="top"
            sideOffset={4}
            align="center"
          >
            <button
              type="button"
              onClick={props.onManageCapabilities}
              className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
              aria-label="Manage Brain capabilities"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
          </TooltipWrapper>
          <TooltipWrapper
            label="Add brain"
            side="top"
            sideOffset={4}
            align="center"
          >
            <button
              type="button"
              onClick={props.onAddBrain}
              className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
              aria-label="Add brain"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </TooltipWrapper>
        </div>
      </div>

      {/* Brain-specific search (FTS via brain.search) */}
      <BrainSearchInput />

      {/* File tree — powered by workspace.listFileTree(vaultPath) */}
      <BrainFolderTree epicId={props.epicId} tabId={props.tabId} />

      {/* Skills */}
      <ConnectedBrainSkillList />
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
        <p className="text-sm font-medium text-foreground">Set up your brain</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your agent will remember things across sessions and search your notes
          for context.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onSetup} className="mt-1">
        Set up brain
      </Button>
    </div>
  );
}
