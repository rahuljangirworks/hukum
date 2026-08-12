import { useId } from "react";
import { ExternalLink, KeyRound, Trash2 } from "lucide-react";
import {
  PROVIDER_DISPLAY_NAMES,
  type ProviderCliState,
} from "@hukum/protocol/host/provider-schemas";
import { MutedAgentSpinner } from "@/components/ui/agent-spinning-dots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProvidersSetApiKey } from "@/hooks/providers/use-providers-set-api-key-mutation";
import { useProvidersClearApiKey } from "@/hooks/providers/use-providers-clear-api-key-mutation";
import { useProvidersAddApiKey } from "@/hooks/providers/use-providers-add-api-key-mutation";
import { useProvidersRemoveApiKey } from "@/hooks/providers/use-providers-remove-api-key-mutation";
import { useProvidersListApiKeys } from "@/hooks/providers/use-providers-list-api-keys-query";
import { useRunnerHost } from "@/providers/use-runner-host";
import { envNamePlaceholder } from "./provider-env-name-placeholder";

type ProviderId = ProviderCliState["providerId"];

const API_KEY_DASHBOARD_URL: Record<ProviderId, string | null> = {
  "claude-code": null,
  codex: null,
  opencode: null,
  cursor: "https://cursor.com/dashboard/api?section=user-keys#user-api-keys",
  hukum: null,
  openrouter: "https://openrouter.ai/settings/keys",
  huggingface: "https://huggingface.co/settings/tokens",
  grok: null,
  qwen: null,
  kiro: null,
  droid: "https://app.factory.ai/settings/api-keys",
  kimi: null,
  copilot: null,
  kilocode: null,
  amp: "https://ampcode.com/settings",
  devin: null,
  pi: null,
  hermes: null,
  omp: null,
};

function apiKeyStatusLabel(apiKey: ProviderCliState["apiKey"]): string {
  if (!apiKey.configured) return "Not set";
  return apiKey.source === "stored" ? "Key set" : "From environment";
}

export function ProviderApiKeySection({
  state,
  draft,
  onDraftChange,
}: {
  readonly state: ProviderCliState;
  readonly draft: string;
  readonly onDraftChange: (draft: string) => void;
}) {
  const inputId = useId();
  const setApiKey = useProvidersSetApiKey();
  const clearApiKey = useProvidersClearApiKey();
  const addApiKey = useProvidersAddApiKey();
  const removeApiKey = useProvidersRemoveApiKey();
  const runnerHost = useRunnerHost();

  const providerId = state.providerId;
  const listApiKeysQuery = useProvidersListApiKeys(providerId);

  if (!state.apiKey.supported) return null;

  const dashboardUrl = API_KEY_DASHBOARD_URL[providerId];
  const isMultiKey = providerId === "opencode" || providerId === "kiro" || providerId === "kilocode";

  const onSaveSingle = (): void => {
    const trimmed = draft.trim();
    if (trimmed.length === 0 || setApiKey.isPending) return;
    setApiKey.mutate(
      { providerId, apiKey: trimmed },
      { onSuccess: () => onDraftChange("") },
    );
  };

  const onAddMulti = (): void => {
    const trimmed = draft.trim();
    if (trimmed.length === 0 || addApiKey.isPending) return;
    addApiKey.mutate(
      { providerId, apiKey: trimmed },
      { 
        onSuccess: () => {
          onDraftChange("");
          listApiKeysQuery.refetch();
        }
      },
    );
  };

  const onRemoveMulti = (index: number): void => {
    if (removeApiKey.isPending) return;
    removeApiKey.mutate(
      { providerId, index },
      { onSuccess: () => listApiKeysQuery.refetch() },
    );
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={inputId}
          className="text-ui-sm font-medium text-foreground"
        >
          {isMultiKey ? "API keys (Round-robin)" : "API key"}
        </label>
        <span className="text-ui-xs text-muted-foreground">
          {apiKeyStatusLabel(state.apiKey)}
        </span>
      </div>

      {dashboardUrl === null ? null : (
        <button
          type="button"
          onClick={() => {
            void runnerHost.openExternalLink(dashboardUrl);
          }}
          className="inline-flex w-fit items-center gap-1.5 text-ui-xs font-medium text-primary transition-colors hover:text-primary/80 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 rounded"
        >
          Create an API key
          <ExternalLink className="size-3" />
        </button>
      )}

      {/* Multi-Key List View (OpenCode only) */}
      {isMultiKey && listApiKeysQuery.data && listApiKeysQuery.data.keys.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-2 mb-1">
          {listApiKeysQuery.data.keys.map((key) => {
            const isActive = key.index === listApiKeysQuery.data.activeIndex;
            return (
              <div key={key.index} className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2 border border-border/40 shadow-sm transition-colors hover:bg-muted/60">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <KeyRound className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="font-mono text-ui-xs text-foreground truncate">{key.masked}</span>
                  {isActive && (
                    <span className="shrink-0 text-[10px] uppercase font-semibold text-primary tracking-wider bg-primary/10 px-1.5 py-0.5 rounded ring-1 ring-primary/20">Active Next</span>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onRemoveMulti(key.index)}
                  disabled={removeApiKey.isPending}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Input Field */}
      <div className="flex items-center gap-2 mt-1">
        <Input
          id={inputId}
          type="password"
          autoComplete="off"
          className="w-full font-mono text-ui-sm"
          placeholder={
            isMultiKey 
              ? `Add another ${PROVIDER_DISPLAY_NAMES[providerId]} API key`
              : (state.apiKey.source === "stored"
                  ? "Replace stored key…"
                  : `Paste your ${PROVIDER_DISPLAY_NAMES[providerId]} API key`)
          }
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          disabled={isMultiKey ? addApiKey.isPending : setApiKey.isPending}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              isMultiKey ? onAddMulti() : onSaveSingle();
            }
          }}
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={isMultiKey ? onAddMulti : onSaveSingle}
          disabled={isMultiKey ? (addApiKey.isPending || draft.trim().length === 0) : (setApiKey.isPending || draft.trim().length === 0)}
        >
          {isMultiKey 
            ? (addApiKey.isPending ? <MutedAgentSpinner /> : "Add")
            : (setApiKey.isPending ? <MutedAgentSpinner /> : "Save")}
        </Button>
        
        {/* Legacy Clear Button for single-key providers */}
        {!isMultiKey && state.apiKey.source === "stored" ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (!clearApiKey.isPending) clearApiKey.mutate({ providerId });
            }}
            disabled={clearApiKey.isPending}
          >
            {clearApiKey.isPending ? <MutedAgentSpinner /> : null}
            Clear
          </Button>
        ) : null}
      </div>
      
      <p className="text-ui-xs text-muted-foreground">
        {isMultiKey 
          ? "Keys are rotated round-robin: each new agent launch uses the next key in the list to avoid rate limits."
          : (state.apiKey.source === "env"
              ? `Using ${envNamePlaceholder(providerId)} from your shell environment. Save a key here to override it.`
              : `Stored encrypted on this device. Falls back to ${envNamePlaceholder(providerId)} from your shell when unset.`
            )
        }
      </p>
    </div>
  );
}
