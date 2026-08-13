/**
 * Brain skill list — shows active/inactive skills with toggle switches.
 *
 * Lives at the bottom of the brain sidebar section.
 * Skills are focused knowledge files the agent loads at conversation start.
 */

import { useCallback } from "react";
import { Sparkles, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BrainSkill {
  name: string;
  path: string;
  scope: string;
  lineCount: number;
  enabled: boolean;
  updatedAt: string;
  overLimit: boolean;
}

interface BrainSkillListProps {
  /** Skills to display. Passed from parent or fetched via hook. */
  skills?: BrainSkill[];
  /** Callback when a skill is toggled. */
  onToggle?: (name: string, enabled: boolean) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BrainSkillList({ skills, onToggle }: BrainSkillListProps) {
  // If no skills provided (not wired to RPC yet), show placeholder
  if (!skills || skills.length === 0) return null;

  return (
    <div className="border-t border-border/40 px-2 py-2">
      <h3 className="mb-1.5 flex items-center gap-1.5 px-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
        <Sparkles className="h-3 w-3" />
        Skills ({skills.length})
      </h3>
      <div className="space-y-0.5">
        {skills.map((skill) => (
          <BrainSkillRow
            key={skill.name}
            skill={skill}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Skill Row ────────────────────────────────────────────────────────────────

function BrainSkillRow({
  skill,
  onToggle,
}: {
  skill: BrainSkill;
  onToggle?: (name: string, enabled: boolean) => void;
}) {
  const handleToggle = useCallback(
    (checked: boolean) => {
      onToggle?.(skill.name, checked);
    },
    [skill.name, onToggle],
  );

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded px-1.5 py-1 hover:bg-accent/50",
        !skill.enabled && "opacity-60",
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <span
          className={cn(
            "truncate text-[0.8125rem]",
            skill.enabled ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {skill.name}
        </span>
        {skill.overLimit && (
          <span title="Over 200 lines — consider compressing">
            <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />
          </span>
        )}
      </div>
      <Switch
        checked={skill.enabled}
        onCheckedChange={handleToggle}
        className="h-4 w-7 shrink-0"
      />
    </div>
  );
}
