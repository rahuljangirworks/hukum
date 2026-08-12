/**
 * Brain template card — shows one vault structure option during setup.
 */

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { BrainTemplateInfo } from "@/stores/brain/brain-config-store";

interface BrainTemplateCardProps {
  readonly template: BrainTemplateInfo;
  readonly selected: boolean;
  readonly onSelect: () => void;
}

export function BrainTemplateCard({
  template,
  selected,
  onSelect,
}: BrainTemplateCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex flex-col gap-2 rounded-lg border p-3 text-left transition-all",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border/60 hover:border-border hover:bg-card/60",
      )}
    >
      {selected && (
        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
      <div className="font-medium text-sm text-foreground">
        {template.label}
      </div>
      <pre className="whitespace-pre text-[0.625rem] leading-[1.4] text-muted-foreground font-mono overflow-hidden">
        {template.preview}
      </pre>
      <p className="text-[0.6875rem] text-muted-foreground/80 italic">
        {template.bestFor}
      </p>
    </button>
  );
}
