/**
 * Brain setup wizard — modal dialog for creating or connecting a brain vault.
 *
 * Three steps:
 * 1. Choose path (new vs existing)
 * 2. Configure (template selection OR folder picker)
 * 3. Confirmation
 */

import { useCallback, use, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Brain,
  FolderOpen,
  Plus,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useBrainConfigStore,
  selectIsWizardOpen,
  selectResolvedVaultPath,
  type BrainTemplate,
} from "@/stores/brain/brain-config-store";
import { BrainTemplateCard } from "./brain-template-card";
import { RunnerHostContext } from "@/providers/runner-host-context";
import { useHostClient } from "@/lib/host";

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export function BrainSetupWizard() {
  const isOpen = useBrainConfigStore(selectIsWizardOpen);
  const setupStep = useBrainConfigStore((s) => s.setupStep);
  const closeSetupWizard = useBrainConfigStore((s) => s.closeSetupWizard);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeSetupWizard(); }}>
      <DialogContent className="flex !max-w-4xl w-[92vw] min-h-[500px] flex-col gap-0 p-0 overflow-hidden max-h-[80vh]">
        {setupStep === "choose-path" && <ChoosePathStep />}
        {setupStep === "select-template" && <SelectTemplateStep />}
        {setupStep === "connecting" && <ConnectingStep />}
        {setupStep === "confirm" && <ConfirmStep />}
      </DialogContent>
    </Dialog>
  );
}

// ─── Step 1: Choose Path ──────────────────────────────────────────────────────

function ChoosePathStep() {
  const setupMode = useBrainConfigStore((s) => s.setupMode);
  const setSetupMode = useBrainConfigStore((s) => s.setSetupMode);
  const setSetupStep = useBrainConfigStore((s) => s.setSetupStep);
  const closeSetupWizard = useBrainConfigStore((s) => s.closeSetupWizard);

  const handleNext = useCallback(() => {
    setSetupStep("select-template");
  }, [setSetupStep]);

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <DialogTitle className="text-lg">Set up your second brain</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              A local folder of markdown notes the agent reads for context.
            </DialogDescription>
          </div>
        </div>

        <div className="space-y-2 mt-6">
          <OptionCard
            selected={setupMode === "new"}
            onClick={() => setSetupMode("new")}
            icon={<Plus className="h-4 w-4" />}
            title="Create a new brain"
            description="Start fresh with a guided template"
          />
          <OptionCard
            selected={setupMode === "existing"}
            onClick={() => setSetupMode("existing")}
            icon={<FolderOpen className="h-4 w-4" />}
            title="Connect an existing vault"
            description="Point to your Obsidian or markdown folder"
          />
        </div>
      </div>

      <DialogFooter className="shrink-0 border-t border-border/40 px-6 py-4 pb-5">
        <Button variant="ghost" onClick={closeSetupWizard}>
          Cancel
        </Button>
        <Button onClick={handleNext} disabled={!setupMode}>
          Next
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </DialogFooter>
    </>
  );
}

// ─── Step 2: Select Template / Connect ────────────────────────────────────────

function SelectTemplateStep() {
  const setupMode = useBrainConfigStore((s) => s.setupMode);
  const setSetupStep = useBrainConfigStore((s) => s.setSetupStep);

  return setupMode === "new" ? <NewBrainForm /> : <ConnectBrainForm />;
}

function NewBrainForm() {
  const parentDir = useBrainConfigStore((s) => s.parentDir);
  const vaultName = useBrainConfigStore((s) => s.vaultName);
  const selectedTemplate = useBrainConfigStore((s) => s.selectedTemplate);
  const templates = useBrainConfigStore((s) => s.templates);
  const setParentDir = useBrainConfigStore((s) => s.setParentDir);
  const setVaultName = useBrainConfigStore((s) => s.setVaultName);
  const setSelectedTemplate = useBrainConfigStore((s) => s.setSelectedTemplate);
  const setSetupStep = useBrainConfigStore((s) => s.setSetupStep);
  const setSetupError = useBrainConfigStore((s) => s.setSetupError);
  const setupError = useBrainConfigStore((s) => s.setupError);
  const resolvedPath = useBrainConfigStore(selectResolvedVaultPath);
  const runnerHost = use(RunnerHostContext);

  const displayTemplates = templates.length > 0 ? templates : DEFAULT_TEMPLATES;
  const activeTemplate = displayTemplates.find((t) => t.id === selectedTemplate) ?? displayTemplates[0];

  const canCreate = parentDir.trim().length > 0 && selectedTemplate !== null;

  const handleBrowse = useCallback(async () => {
    if (!runnerHost?.workspaceFolders?.canPickNatively) return;
    try {
      const paths = await runnerHost.workspaceFolders.pickFolders();
      if (paths.length > 0) {
        const picked = paths[0];
        setParentDir(picked);
        // Auto-derive brain name from picked folder
        const segments = picked.replace(/\/+$/, "").split("/");
        const lastSegment = segments[segments.length - 1] ?? "";
        if (lastSegment && !lastSegment.startsWith(".")) {
          setVaultName(`.${lastSegment}`);
        }
      }
    } catch {
      // User cancelled or error — ignore
    }
  }, [runnerHost, setParentDir, setVaultName]);

  const handleParentDirChange = useCallback(
    (value: string) => {
      setParentDir(value);
      const segments = value.replace(/\/+$/, "").split("/");
      const lastSegment = segments[segments.length - 1] ?? "";
      if (lastSegment && lastSegment !== "/" && !lastSegment.startsWith(".")) {
        setVaultName(`.${lastSegment}`);
      }
    },
    [setParentDir, setVaultName],
  );

  const handleCreate = useCallback(async () => {
    if (!canCreate) return;
    setSetupStep("connecting");
  }, [canCreate, setSetupStep]);

  return (
    <>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Panel — Form */}
        <div className="flex-1 min-w-0 overflow-y-auto p-6 space-y-5 border-r border-border/40">
          <div>
            <DialogTitle className="text-base mb-1">Create your brain</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Pick a folder and structure for your second brain.
            </DialogDescription>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Location</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="/home/user/work"
                  value={parentDir}
                  onChange={(e) => handleParentDirChange(e.target.value)}
                  className="font-mono text-sm flex-1"
                />
                <Button variant="outline" size="sm" onClick={handleBrowse} className="shrink-0">
                  <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
                  Browse
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Brain name</Label>
              <Input
                placeholder=".brain"
                value={vaultName}
                onChange={(e) => setVaultName(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            {resolvedPath && (
              <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                <p className="text-xs text-foreground font-mono truncate">{resolvedPath}</p>
              </div>
            )}
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Structure</Label>
            <div className="space-y-1.5">
              {displayTemplates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTemplate(t.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all",
                    selectedTemplate === t.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border/60 hover:border-border hover:bg-card/60",
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-bold",
                    selectedTemplate === t.id ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                  )}>
                    {t.label[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">{t.label}</div>
                    <div className="text-xs text-muted-foreground truncate">{t.description}</div>
                  </div>
                  {selectedTemplate === t.id && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {setupError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {setupError}
            </div>
          )}
        </div>

        {/* Right Panel — Preview */}
        <div className="w-[300px] shrink-0 flex flex-col bg-muted/20 p-5 overflow-y-auto">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-foreground">{activeTemplate?.label ?? "Preview"}</h3>
            <p className="text-xs text-muted-foreground mt-1">{activeTemplate?.bestFor}</p>
          </div>

          {/* Folder tree preview */}
          <div className="rounded-lg border border-border/40 bg-background/80 p-3 font-mono text-[0.6875rem] leading-[1.6] text-muted-foreground">
            <div className="text-foreground font-medium mb-1">{vaultName || ".brain"}/</div>
            {activeTemplate?.directories.map((dir) => (
              <div key={dir} className="pl-3 flex items-center gap-1.5">
                <span className="text-muted-foreground/50">├──</span>
                <span className="text-foreground/80">{dir}/</span>
              </div>
            ))}
            <div className="pl-3 flex items-center gap-1.5">
              <span className="text-muted-foreground/50">├──</span>
              <span className="text-primary/80">_agent/</span>
            </div>
            <div className="pl-3 flex items-center gap-1.5">
              <span className="text-muted-foreground/50">└──</span>
              <span className="text-muted-foreground">_config.md</span>
            </div>
          </div>

          {/* What's included */}
          <div className="mt-4 space-y-2">
            <h4 className="text-xs font-medium text-foreground">Includes</h4>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="h-3 w-3 mt-0.5 text-green-500 shrink-0" />
                <span>Agent identity + memory files</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-3 w-3 mt-0.5 text-green-500 shrink-0" />
                <span>Skills folder for agent context</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-3 w-3 mt-0.5 text-green-500 shrink-0" />
                <span>README in each folder</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-3 w-3 mt-0.5 text-green-500 shrink-0" />
                <span>Obsidian-compatible (WikiLinks)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <DialogFooter className="shrink-0 border-t border-border/40 px-6 py-4 pb-5">
        <Button variant="ghost" onClick={() => setSetupStep("choose-path")}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back
        </Button>
        <Button onClick={handleCreate} disabled={!canCreate}>
          Create brain
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </DialogFooter>
    </>
  );
}

function ConnectBrainForm() {
  const existingPath = useBrainConfigStore((s) => s.existingPath);
  const setExistingPath = useBrainConfigStore((s) => s.setExistingPath);
  const setSetupStep = useBrainConfigStore((s) => s.setSetupStep);
  const setupError = useBrainConfigStore((s) => s.setupError);
  const runnerHost = use(RunnerHostContext);

  const canConnect = existingPath.trim().length > 0;

  const handleBrowse = useCallback(async () => {
    if (!runnerHost?.workspaceFolders?.canPickNatively) return;
    try {
      const paths = await runnerHost.workspaceFolders.pickFolders();
      if (paths.length > 0) {
        setExistingPath(paths[0]);
      }
    } catch {
      // User cancelled
    }
  }, [runnerHost, setExistingPath]);

  const handleConnect = useCallback(() => {
    if (!canConnect) return;
    setSetupStep("connecting");
  }, [canConnect, setSetupStep]);

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6 pb-4 space-y-4">
        <div>
          <DialogTitle className="text-base mb-1">Connect existing vault</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Point to any folder containing markdown files (Obsidian vault, notes folder, etc.)
          </DialogDescription>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm">Vault path</Label>
          <div className="flex gap-2">
            <Input
              placeholder="/home/user/Documents/my-vault"
              value={existingPath}
              onChange={(e) => setExistingPath(e.target.value)}
              className="font-mono text-sm flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleBrowse}
              className="shrink-0"
            >
              <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
              Browse
            </Button>
          </div>
        </div>

        {setupError && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {setupError}
          </div>
        )}
      </div>

      <DialogFooter className="shrink-0 border-t border-border/40 px-6 py-4 pb-5">
        <Button variant="ghost" onClick={() => setSetupStep("choose-path")}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back
        </Button>
        <Button onClick={handleConnect} disabled={!canConnect}>
          Connect
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </DialogFooter>
    </>
  );
}

// ─── Step: Connecting (progress display) ──────────────────────────────────

function ConnectingStep() {
  const setupMode = useBrainConfigStore((s) => s.setupMode);
  const parentDir = useBrainConfigStore((s) => s.parentDir);
  const vaultName = useBrainConfigStore((s) => s.vaultName);
  const selectedTemplate = useBrainConfigStore((s) => s.selectedTemplate);
  const existingPath = useBrainConfigStore((s) => s.existingPath);
  const setSetupStep = useBrainConfigStore((s) => s.setSetupStep);
  const setSetupError = useBrainConfigStore((s) => s.setSetupError);
  const setSetupResult = useBrainConfigStore((s) => s.setSetupResult);
  const setConfig = useBrainConfigStore((s) => s.setConfig);
  const resolvedPath = useBrainConfigStore(selectResolvedVaultPath);
  const client = useHostClient();

  const [steps, setSteps] = useState<Array<{ label: string; status: "pending" | "active" | "done" | "error" }>>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const setupSteps = setupMode === "new"
      ? [
          { label: "Creating vault directory", status: "pending" as const },
          { label: `Scaffolding ${selectedTemplate ?? "PARA"} structure`, status: "pending" as const },
          { label: "Writing seed notes", status: "pending" as const },
          { label: "Setting up agent layer", status: "pending" as const },
          { label: "Building search index", status: "pending" as const },
          { label: "Starting file watcher", status: "pending" as const },
        ]
      : [
          { label: "Validating vault path", status: "pending" as const },
          { label: "Scanning markdown files", status: "pending" as const },
          { label: "Setting up agent layer", status: "pending" as const },
          { label: "Building search index", status: "pending" as const },
          { label: "Starting file watcher", status: "pending" as const },
        ];

    setSteps(setupSteps);

    let isCancelled = false;
    let step = 0;
    const interval = setInterval(() => {
      if (isCancelled) return;
      step++;
      setCurrentStep(step);
      setSteps((prev) =>
        prev.map((s, i) => ({
          ...s,
          status: i < step ? "done" : i === step ? "active" : "pending",
        })),
      );
    }, 600);

    const executeSetup = async () => {
      try {
        if (!client) {
          throw new Error("No host connection. Try refreshing the window (Ctrl+Shift+R).");
        }
        let result: any;
        if (setupMode === "new") {
          result = await client.request("brain.scaffold", {
            parentDir: parentDir,
            vaultName: vaultName || ".brain",
            template: selectedTemplate || "para",
          });
        } else {
          result = await client.request("brain.connect", {
            vaultPath: existingPath,
          });
        }

        if (isCancelled) return;
        clearInterval(interval);
        
        // Mark all remaining steps as done
        setSteps((prev) => prev.map((s) => ({ ...s, status: "done" })));
        
        setTimeout(() => {
          if (isCancelled) return;
          const vaultPath = result?.vaultPath ?? resolvedPath;
          setSetupResult({ vaultPath, noteCount: result?.noteCount || 0 });
          useBrainConfigStore.getState().setConfig({
            vaultPath,
            template: (setupMode === "new" ? selectedTemplate : "existing") as any,
            createdAt: new Date().toISOString(),
            agentContextFiles: ["_agent/IDENTITY.md", "_agent/MEMORY.md"],
            contextTokenBudget: 4000,
            watchEnabled: true,
            sync: null,
          });
          setSetupStep("confirm");
        }, 400);
      } catch (err) {
        if (isCancelled) return;
        clearInterval(interval);
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Brain setup RPC failed:", msg, err);
        setError(msg);
        setSteps((prev) => prev.map((s, i) => 
          i === currentStep ? { ...s, status: "error" as const } : s
        ));
        // Don't navigate away — show the error in place
      }
    };
    
    executeSetup();

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-10 min-h-[300px]">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-foreground">Setting up your brain</p>
        <p className="text-xs text-muted-foreground font-mono">{resolvedPath}</p>
      </div>

      {/* Step list */}
      <div className="w-full max-w-sm space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="shrink-0">
              {step.status === "done" ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : step.status === "active" ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : step.status === "error" ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : (
                <div className="h-4 w-4 rounded-full border border-border/60" />
              )}
            </div>
            <span className={cn(
              "text-sm",
              step.status === "done" && "text-muted-foreground",
              step.status === "active" && "text-foreground font-medium",
              step.status === "pending" && "text-muted-foreground/60",
              step.status === "error" && "text-destructive",
            )}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <Button variant="ghost" size="sm" onClick={() => setSetupStep("select-template")}>
            Back
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Confirm ──────────────────────────────────────────────────────────

function ConfirmStep() {
  const setupResult = useBrainConfigStore((s) => s.setupResult);
  const closeSetupWizard = useBrainConfigStore((s) => s.closeSetupWizard);
  const resolvedPath = useBrainConfigStore(selectResolvedVaultPath);

  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        {/* Success icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mb-5">
          <Check className="h-8 w-8 text-green-500" />
        </div>

        <DialogTitle className="text-xl mb-2">Brain ready!</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground mb-6 max-w-md">
          Your second brain is set up and the agent can now remember things across conversations.
        </DialogDescription>

        {/* Info cards */}
        <div className="w-full max-w-sm space-y-2 text-left">
          <InfoRow icon={<FolderOpen className="h-4 w-4" />} label="Location" value={setupResult?.vaultPath ?? resolvedPath} mono />
          {setupResult?.noteCount != null && (
            <InfoRow icon={<Brain className="h-4 w-4" />} label="Notes indexed" value={`${setupResult.noteCount}`} />
          )}
          <InfoRow icon={<Check className="h-4 w-4 text-green-500" />} label="Agent layer" value="Created at _agent/" />
          <InfoRow icon={<Check className="h-4 w-4 text-green-500" />} label="Memory" value="Ready to remember" />
        </div>

        {/* Next step hint */}
        <div className="mt-6 w-full max-w-sm rounded-lg border border-border/40 bg-muted/30 p-4 text-left">
          <p className="text-sm font-medium text-foreground mb-1">What's next?</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Edit <code className="font-mono text-[0.7rem] bg-muted px-1 py-0.5 rounded">_agent/IDENTITY.md</code> to tell the agent about yourself. 
            Or just start chatting — the agent will learn about you over time.
          </p>
        </div>
      </div>

      <DialogFooter className="shrink-0 border-t border-border/40 px-6 py-4 pb-5">
        <Button onClick={closeSetupWizard} size="lg">
          Get started
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </DialogFooter>
    </>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────

function InfoRow(props: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-muted/30 px-3 py-2">
      <div className="shrink-0 text-muted-foreground">{props.icon}</div>
      <div className="min-w-0 flex-1">
        <span className="text-xs text-muted-foreground">{props.label}</span>
        <p className={cn("text-sm text-foreground truncate", props.mono && "font-mono text-xs")}>{props.value}</p>
      </div>
    </div>
  );
}

function OptionCard(props: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all",
        props.selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border/60 hover:border-border hover:bg-card/60",
      )}
    >
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
        props.selected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
      )}>
        {props.icon}
      </div>
      <div>
        <div className="text-sm font-medium text-foreground">{props.title}</div>
        <div className="text-xs text-muted-foreground">{props.description}</div>
      </div>
    </button>
  );
}

// ─── Default Templates (fallback before RPC loads them) ───────────────────────

const DEFAULT_TEMPLATES = [
  {
    id: "para" as BrainTemplate,
    label: "PARA",
    description: "Projects, Areas, Resources, Archive",
    bestFor: "Best for: work management",
    directories: ["inbox", "projects", "areas", "resources", "archive"],
    preview: "inbox/\nprojects/\nareas/\nresources/\narchive/",
  },
  {
    id: "johnny-decimal" as BrainTemplate,
    label: "Johnny Decimal",
    description: "Numbered categories",
    bestFor: "Best for: large collections",
    directories: ["00-09-inbox", "10-19-work", "20-29-personal", "30-39-knowledge", "40-49-resources", "90-99-archive"],
    preview: "00-09-inbox/\n10-19-work/\n20-29-personal/\n30-39-knowledge/\n90-99-archive/",
  },
  {
    id: "zettelkasten" as BrainTemplate,
    label: "Zettelkasten",
    description: "Flat notes connected by links",
    bestFor: "Best for: research & ideas",
    directories: ["inbox", "notes", "references"],
    preview: "inbox/\nnotes/\nreferences/",
  },
];
