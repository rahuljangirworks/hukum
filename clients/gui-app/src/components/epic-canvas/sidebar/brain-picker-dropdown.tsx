/**
 * Brain picker dropdown — lets the user switch between registered brains.
 *
 * Shows in the brain sidebar header. Lists all brains with a checkmark
 * on the active one. Includes "Add brain" action at the bottom.
 * Switching brains closes old vault tabs and reloads the tree.
 */

import { useCallback, useState } from "react";
import { Brain, Check, ChevronDown, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";
import {
  useBrainConfigStore,
  selectActiveBrain,
  selectHasMultipleBrains,
  type BrainEntry,
} from "@/stores/brain/brain-config-store";
import { closeBrainVaultTabs } from "@/stores/brain/close-brain-tabs";
import { useBrainSwitch, useBrainRemove } from "@/hooks/brain";

export interface BrainPickerDropdownProps {
  readonly onAddBrain: () => void;
}

export function BrainPickerDropdown(props: BrainPickerDropdownProps) {
  const { onAddBrain } = props;
  const [open, setOpen] = useState(false);
  const brains = useBrainConfigStore((s) => s.brains);
  const activeBrainId = useBrainConfigStore((s) => s.activeBrainId);
  const activeBrain = useBrainConfigStore(selectActiveBrain);
  const hasMultiple = useBrainConfigStore(selectHasMultipleBrains);

  const switchMutation = useBrainSwitch();
  const removeMutation = useBrainRemove();

  const brainName = activeBrain?.name ?? "brain";

  const handleSwitch = useCallback(
    (brain: BrainEntry) => {
      if (brain.id === activeBrainId) {
        setOpen(false);
        return;
      }
      // Close tabs from the current brain vault before switching
      if (activeBrain !== null) {
        closeBrainVaultTabs(activeBrain.vaultPath);
      }
      switchMutation.mutate({ brainId: brain.id });
      setOpen(false);
    },
    [activeBrainId, activeBrain, switchMutation],
  );

  const handleRemove = useCallback(
    (brain: BrainEntry, event: React.MouseEvent) => {
      event.stopPropagation();
      if (brain.id === activeBrainId) {
        closeBrainVaultTabs(brain.vaultPath);
      }
      removeMutation.mutate({ brainId: brain.id });
    },
    [activeBrainId, removeMutation],
  );

  const handleAdd = useCallback(() => {
    setOpen(false);
    onAddBrain();
  }, [onAddBrain]);

  // Only show the dropdown trigger if there are multiple brains or as an
  // affordance to add more. Single brain still shows the chevron for add.
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1 rounded px-1 py-0.5 text-sm font-medium text-foreground",
            "hover:bg-accent/50 transition-colors",
          )}
          data-testid="brain-picker-trigger"
        >
          <Brain className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="truncate max-w-[120px]">{brainName}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-64 p-1"
        data-testid="brain-picker-popover"
      >
        {/* Brain list */}
        <div className="space-y-0.5">
          {brains.map((brain) => (
            <div
              key={brain.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSwitch(brain)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleSwitch(brain);
              }}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer",
                "hover:bg-accent/60 transition-colors",
                brain.id === activeBrainId && "bg-accent/40",
              )}
            >
              {/* Checkmark */}
              <div className="w-4 shrink-0">
                {brain.id === activeBrainId ? (
                  <Check className="h-3.5 w-3.5 text-primary" />
                ) : null}
              </div>

              {/* Brain info */}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground truncate">
                  {brain.name}
                </div>
                <div className="text-[0.6875rem] text-muted-foreground font-mono truncate">
                  {brain.vaultPath}
                </div>
              </div>

              {/* Remove button (only show if multiple brains) */}
              {hasMultiple ? (
                <TooltipWrapper
                  label="Remove brain (vault files are not deleted)"
                  side="right"
                  sideOffset={4}
                  align="center"
                >
                  <button
                    type="button"
                    onClick={(event) => handleRemove(brain, event)}
                    className="shrink-0 rounded p-0.5 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label={`Remove ${brain.name}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </TooltipWrapper>
              ) : null}
            </div>
          ))}
        </div>

        {/* Separator + Add brain */}
        <div className="border-t border-border/40 mt-1 pt-1">
          <button
            type="button"
            onClick={handleAdd}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add brain</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
