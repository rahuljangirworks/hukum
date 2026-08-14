/**
 * Simple "Add brain" dialog for second+ brains.
 *
 * No template selection — just a folder path input and a "Connect" button.
 * The first brain uses the full setup wizard; subsequent brains use this
 * lightweight dialog since the user already understands the concept.
 *
 * Calls brain.connect RPC which validates the path, creates the _agent/
 * layer if missing, indexes the vault, and starts the file watcher.
 */

import { use, useCallback, useState } from "react";
import { FolderOpen, AlertCircle } from "lucide-react";
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
import { AgentSpinningDots } from "@/components/ui/agent-spinning-dots";
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper";
import { useBrainConnect } from "@/hooks/brain";
import { RunnerHostContext } from "@/providers/runner-host-context";

export interface BrainAddFolderDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function BrainAddFolderDialog(props: BrainAddFolderDialogProps) {
  const { open, onOpenChange } = props;
  const [vaultPath, setVaultPath] = useState("");
  const [error, setError] = useState<string | null>(null);
  const connectMutation = useBrainConnect();
  const runnerHost = use(RunnerHostContext);

  const isConnecting = connectMutation.isPending;
  const canPickNatively =
    runnerHost?.workspaceFolders.canPickNatively ?? false;

  const handleBrowse = useCallback(async () => {
    if (!runnerHost?.workspaceFolders.canPickNatively) return;
    try {
      const paths = await runnerHost.workspaceFolders.pickFolders();
      if (paths.length > 0) {
        setVaultPath(paths[0]);
        setError(null);
      }
    } catch {
      // User cancelled or error — ignore
    }
  }, [runnerHost]);

  const handleConnect = useCallback(async () => {
    const trimmed = vaultPath.trim();
    if (!trimmed) {
      setError("Please enter a folder path");
      return;
    }

    setError(null);
    try {
      await connectMutation.mutateAsync({ vaultPath: trimmed });
      // Reset and close
      setVaultPath("");
      setError(null);
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  }, [vaultPath, connectMutation, onOpenChange]);

  const handleClose = useCallback(() => {
    setVaultPath("");
    setError(null);
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add brain</DialogTitle>
          <DialogDescription>
            Connect an existing folder as a brain vault. The agent layer
            (_agent/) will be created if it doesn't exist.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="brain-vault-path">Vault folder path</Label>
            <div className="flex gap-2">
              <Input
                id="brain-vault-path"
                type="text"
                placeholder="/home/user/my-notes"
                value={vaultPath}
                onChange={(e) => {
                  setVaultPath(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isConnecting) void handleConnect();
                }}
                disabled={isConnecting}
                className="flex-1 font-mono text-sm"
              />
              <TooltipWrapper
                label="Browse folder"
                side="top"
                sideOffset={4}
                align="center"
              >
                <Button
                  variant="outline"
                  size="icon"
                  disabled={isConnecting || !canPickNatively}
                  onClick={() => void handleBrowse()}
                  aria-label="Browse folder"
                  className="shrink-0"
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </TooltipWrapper>
            </div>
            <p className="text-[0.6875rem] text-muted-foreground">
              Any folder with markdown files works. Obsidian vaults are auto-detected.
            </p>
          </div>

          {error !== null ? (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isConnecting}>
            Cancel
          </Button>
          <Button onClick={() => void handleConnect()} disabled={isConnecting || !vaultPath.trim()}>
            Connect
            {isConnecting ? (
              <AgentSpinningDots
                className="ml-2"
                testId="brain-connect-spinner"
                variant="dots"
              />
            ) : null}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
