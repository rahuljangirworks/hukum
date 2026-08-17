import { type ReactNode, useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useShallow } from "zustand/react/shallow";
import { useQueryClient } from "@tanstack/react-query";
import { SettingsGroup } from "@/components/settings/settings-group";
import { SettingsRow } from "@/components/settings/settings-row";
import { Switch } from "@/components/ui/switch";
import { useSettingsStore } from "@/stores/settings/settings-store";
import { useHostQuery, useHostMutation } from "@/hooks/host/use-host-query";
import { useHostClient, type HostRpcRegistry } from "@/lib/host";
import { hostQueryKeys, speechMutationKeys } from "@/lib/query-keys";
import { Analytics, AnalyticsEvent } from "@/lib/analytics";

type DictationMode = "toggle" | "hold";

interface SpeechModelOption {
  id: string;
  label: string;
  description: string;
  type: "streaming" | "offline" | "cloud";
  sizeLabel: string;
  recommended?: boolean;
  provider: "local" | "openai";
}

const AVAILABLE_MODELS: SpeechModelOption[] = [
  { id: "parakeet-tdt-0.6b-v3-int8", label: "Parakeet TDT v3", description: "Highest accuracy for 25 European languages. Punctuation, capitalization, and word-level timestamps.", type: "offline", sizeLabel: "670 MB", recommended: true, provider: "local" },
  { id: "parakeet-tdt-0.6b-v2-int8", label: "Parakeet TDT v2", description: "English only. Faster than v3 with similar accuracy. Punctuation and capitalization.", type: "offline", sizeLabel: "661 MB", provider: "local" },
  { id: "zipformer-bilingual-zh-en", label: "Zipformer Bilingual", description: "Chinese + English with code-switching. Low-latency real-time streaming.", type: "streaming", sizeLabel: "357 MB", provider: "local" },
  { id: "paraformer-bilingual-zh-en", label: "Paraformer Bilingual", description: "Chinese (Mandarin + dialects) + English. Strong on accented and regional Chinese.", type: "streaming", sizeLabel: "237 MB", provider: "local" },
  { id: "zipformer-streaming-en-20m", label: "Zipformer Streaming EN", description: "English only. Lightweight 20M-param model, good balance of speed and size.", type: "streaming", sizeLabel: "92 MB", provider: "local" },
  { id: "zipformer-streaming-zh-14m", label: "Zipformer Streaming ZH", description: "Chinese only. Ultra-lightweight 14M-param model, ideal for low-resource devices.", type: "streaming", sizeLabel: "56 MB", provider: "local" },
  { id: "zipformer-streaming-korean", label: "Zipformer Streaming KO", description: "Korean only. Low-latency real-time streaming.", type: "streaming", sizeLabel: "132 MB", provider: "local" },
  { id: "parakeet-tdt-ctc-0.6b-ja-int8", label: "Parakeet TDT-CTC JA", description: "Japanese only. Trained on 35k+ hours of natural speech. Punctuation included.", type: "offline", sizeLabel: "656 MB", provider: "local" },
  { id: "whisper-tiny", label: "Whisper Tiny", description: "90+ languages. Lower accuracy than Parakeet but broadest language coverage.", type: "offline", sizeLabel: "153 MB", provider: "local" },
  { id: "sense-voice-zh-en-ja-ko-yue", label: "SenseVoice", description: "Chinese, English, Japanese, Korean, and Cantonese with automatic language detection.", type: "offline", sizeLabel: "240 MB", provider: "local" },
  { id: "openai-gpt-4o-mini-transcribe", label: "GPT-4o mini Transcribe", description: "Cloud transcription with strong accuracy and low cost. Requires an OpenAI API key.", type: "cloud", sizeLabel: "", provider: "openai" },
  { id: "openai-gpt-4o-transcribe", label: "GPT-4o Transcribe", description: "Cloud transcription with higher accuracy. Requires an OpenAI API key.", type: "cloud", sizeLabel: "", provider: "openai" },
];

function ModelBadge({ type }: { type: "streaming" | "offline" | "cloud" }): ReactNode {
  const colors = {
    streaming: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    offline: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    cloud: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border ${colors[type]}`}>
      {type}
    </span>
  );
}

function RecommendedBadge(): ReactNode {
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border bg-amber-500/20 text-amber-400 border-amber-500/30">
      recommended
    </span>
  );
}

// ── Model Picker Dropdown ─────────────────────────────────────────────────

function ModelPickerDropdown({
  models, selectedId, onSelect, onDownload, modelStatuses, open, onClose, triggerRef,
}: {
  models: SpeechModelOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onDownload: (modelId: string) => void;
  modelStatuses: Record<string, { downloadState: string; progress: number | null }>;
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 480;
    const spaceBelow = viewportHeight - rect.bottom;
    const top = spaceBelow < dropdownHeight && rect.top > dropdownHeight
      ? rect.top - dropdownHeight - 4 : rect.bottom + 4;
    setPosition({ top, left: Math.max(8, rect.right - 420) });
  }, [open, triggerRef]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose, triggerRef]);

  if (!open) return null;

  return createPortal(
    <div ref={ref} className="fixed z-[9999] w-[420px] max-h-[480px] overflow-y-auto rounded-lg border border-border bg-popover shadow-2xl" style={{ top: position.top, left: position.left }}>
      {models.map((model) => {
        const status = modelStatuses[model.id];
        const downloadState = status?.downloadState ?? "absent";
        const progress = status?.progress;
        const isReady = downloadState === "ready";
        const isDownloading = downloadState === "downloading";

        return (
          <button
            key={model.id}
            type="button"
            className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-b-0 ${model.id === selectedId ? "bg-muted/30" : ""}`}
            onClick={() => { if (isReady) { onSelect(model.id); onClose(); } }}
            disabled={isDownloading}
          >
            <div className="flex items-center gap-2 mb-1">
              {model.id === selectedId && isReady && (
                <svg className="w-4 h-4 text-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
              {model.provider === "openai" && (
                <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582" />
                </svg>
              )}
              <span className="font-medium text-sm text-foreground">{model.label}</span>
              <ModelBadge type={model.type} />
              {model.recommended && <RecommendedBadge />}
              <span className="ml-auto flex items-center gap-2">
                {model.sizeLabel && <span className="text-xs text-muted-foreground">{model.sizeLabel}</span>}
                {model.provider === "local" && isReady && model.id !== selectedId && (
                  <span className="text-[10px] text-emerald-400 font-medium">ready</span>
                )}
                {model.provider === "local" && isDownloading && (
                  <span className="text-[10px] text-blue-400 font-medium animate-pulse">
                    {progress !== null ? `${Math.round(progress * 100)}%` : "downloading..."}
                  </span>
                )}
                {model.provider === "local" && !isReady && !isDownloading && (
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                    onClick={(e) => { e.stopPropagation(); onDownload(model.id); }}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    download
                  </button>
                )}
                {model.provider === "openai" && (
                  <span className="text-[10px] text-muted-foreground">API key</span>
                )}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{model.description}</p>
            {isDownloading && progress !== null && (
              <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            )}
          </button>
        );
      })}
    </div>,
    document.body,
  );
}

// ── Microphone Picker Dropdown ────────────────────────────────────────────

function MicPickerDropdown({
  microphones, selectedMic, onSelect, open, onClose, triggerRef,
}: {
  microphones: MediaDeviceInfo[];
  selectedMic: string;
  onSelect: (deviceId: string) => void;
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({ top: rect.bottom + 4, left: Math.max(8, rect.right - 280) });
  }, [open, triggerRef]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose, triggerRef]);

  if (!open) return null;

  return createPortal(
    <div ref={ref} className="fixed z-[9999] w-[280px] rounded-lg border border-border bg-popover shadow-2xl overflow-hidden" style={{ top: position.top, left: position.left }}>
      <button type="button" className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 flex items-center justify-between ${!selectedMic ? "text-foreground" : "text-muted-foreground"}`} onClick={() => onSelect("")}>
        System default
        {!selectedMic && <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
      </button>
      {microphones.map((mic) => (
        <button key={mic.deviceId} type="button" className={`w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 flex items-center justify-between ${selectedMic === mic.deviceId ? "text-foreground" : "text-muted-foreground"}`} onClick={() => onSelect(mic.deviceId)}>
          <span className="truncate">{mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}</span>
          {selectedMic === mic.deviceId && <svg className="w-4 h-4 shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
        </button>
      ))}
    </div>,
    document.body,
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────

export function VoiceSettingsPanel(): ReactNode {
  const { voiceInputEnabled, setVoiceInputEnabled } = useSettingsStore(
    useShallow((s) => ({ voiceInputEnabled: s.voiceInputEnabled, setVoiceInputEnabled: s.setVoiceInputEnabled })),
  );

  const client = useHostClient();
  const queryClient = useQueryClient();

  // Poll model status for the currently selected model
  const [selectedModel, setSelectedModel] = useState<string>(() =>
    (typeof window !== "undefined" ? localStorage.getItem("hukum:speech-model") : null) ?? "zipformer-streaming-en-20m",
  );

  const statusQuery = useHostQuery<HostRpcRegistry, "speech.getModelStatus">({
    cacheKeyIdentity: undefined,
    client,
    method: "speech.getModelStatus",
    params: { modelId: selectedModel },
    options: { enabled: true, refetchInterval: 3000 },
  });

  // Mutation to trigger model download
  const ensureMutation = useHostMutation<HostRpcRegistry, "speech.ensureModel", { hostId: string | null }>({
    client,
    method: "speech.ensureModel",
    mapVariables: (v) => v,
    options: {
      mutationKey: speechMutationKeys.ensureModel(),
      onMutate: () => ({ hostId: client.getActiveHostId() }),
      onSuccess: (_result, _variables, context) => {
        if (context.hostId) {
          void queryClient.invalidateQueries({
            queryKey: hostQueryKeys.method<HostRpcRegistry, "speech.getModelStatus">(
              context.hostId, "speech.getModelStatus", { modelId: selectedModel },
            ),
          });
        }
      },
    },
  });

  const handleDownload = (modelId: string) => {
    ensureMutation.mutate({ modelId });
  };

  // Build model statuses map from RPC response
  const modelStatuses = useMemo(() => {
    const statuses: Record<string, { downloadState: string; progress: number | null }> = {};
    const data = statusQuery.data;
    if (data) {
      statuses[data.modelId] = { downloadState: data.downloadState, progress: data.downloadProgress };
    }
    // Mark all other models as unknown (absent by default)
    for (const model of AVAILABLE_MODELS) {
      if (!statuses[model.id]) {
        statuses[model.id] = { downloadState: "absent", progress: null };
      }
    }
    return statuses;
  }, [statusQuery.data]);

  const [dictationMode, setDictationMode] = useState<DictationMode>(() =>
    (typeof window !== "undefined" ? localStorage.getItem("hukum:dictation-mode") as DictationMode : null) ?? "toggle",
  );
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>(() =>
    (typeof window !== "undefined" ? localStorage.getItem("hukum:microphone-device") : null) ?? "",
  );
  const [micDropdownOpen, setMicDropdownOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const micTriggerRef = useRef<HTMLButtonElement>(null);
  const modelTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices()
      .then((devices) => setMicrophones(devices.filter((d) => d.kind === "audioinput")))
      .catch(() => {});
  }, []);

  const handleDictationModeChange = (mode: DictationMode) => {
    setDictationMode(mode);
    localStorage.setItem("hukum:dictation-mode", mode);
  };
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem("hukum:speech-model", modelId);
  };
  const handleMicChange = (deviceId: string) => {
    setSelectedMic(deviceId);
    localStorage.setItem("hukum:microphone-device", deviceId);
    setMicDropdownOpen(false);
  };

  const currentModel = AVAILABLE_MODELS.find((m) => m.id === selectedModel) ?? AVAILABLE_MODELS[4];
  const selectedMicLabel = selectedMic
    ? microphones.find((m) => m.deviceId === selectedMic)?.label ?? "Unknown"
    : "System default";

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h2 className="text-xl font-semibold">Voice</h2>
        <p className="text-sm text-muted-foreground mt-1">Local speech-to-text dictation with on-device models.</p>
      </div>

      <SettingsGroup>
        <SettingsRow
          label="Enable Voice Dictation"
          description="Press Ctrl+E to dictate text into any focused pane."
          control={
            <Switch
              checked={voiceInputEnabled}
              onCheckedChange={(enabled) => {
                Analytics.getInstance().track(enabled ? AnalyticsEvent.VoiceEnabled : AnalyticsEvent.VoiceDisabled, { source: "voice_panel" });
                setVoiceInputEnabled(enabled);
              }}
              aria-label="Enable Voice Dictation"
            />
          }
        />

        <SettingsRow
          label="Dictation Mode"
          description="Toggle: press Ctrl+E once to start, again to stop. Hold: dictate while Ctrl+E is held."
          control={
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button type="button" className={`px-4 py-1.5 text-sm font-medium transition-colors ${dictationMode === "toggle" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`} onClick={() => handleDictationModeChange("toggle")}>Toggle</button>
              <button type="button" className={`px-4 py-1.5 text-sm font-medium transition-colors ${dictationMode === "hold" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`} onClick={() => handleDictationModeChange("hold")}>Hold</button>
            </div>
          }
        />

        <SettingsRow
          label="Microphone"
          description="Input device used for voice dictation. System default follows the OS microphone setting."
          control={
            <div className="relative">
              <button ref={micTriggerRef} type="button" className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-muted/50 transition-colors" onClick={() => setMicDropdownOpen(!micDropdownOpen)} aria-label="Select microphone">
                <span className="max-w-[200px] truncate">{selectedMicLabel}</span>
                <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
              </button>
              <MicPickerDropdown microphones={microphones} selectedMic={selectedMic} onSelect={handleMicChange} open={micDropdownOpen} onClose={() => setMicDropdownOpen(false)} triggerRef={micTriggerRef} />
            </div>
          }
        />

        <SettingsRow
          label="Speech Model"
          description={`${currentModel.label} \u2014 ${currentModel.description}`}
          control={
            <div className="relative">
              <button ref={modelTriggerRef} type="button" className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-muted/50 transition-colors" onClick={() => setModelDropdownOpen(!modelDropdownOpen)} aria-label="Select speech model">
                <span>{currentModel.label}</span>
                <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
              </button>
              <ModelPickerDropdown models={AVAILABLE_MODELS} selectedId={selectedModel} onSelect={handleModelChange} onDownload={handleDownload} modelStatuses={modelStatuses} open={modelDropdownOpen} onClose={() => setModelDropdownOpen(false)} triggerRef={modelTriggerRef} />
            </div>
          }
        />
      </SettingsGroup>
    </div>
  );
}
