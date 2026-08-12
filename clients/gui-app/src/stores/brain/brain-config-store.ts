/**
 * Brain config store — multi-brain registry support.
 *
 * Manages multiple brain vaults with one active at a time.
 * Config is fetched from the host via RPC; the wizard state is local.
 */

import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BrainTemplate = "para" | "johnny-decimal" | "zettelkasten";
export type BrainSetupStep = "choose-path" | "select-template" | "connecting" | "confirm" | null;

export interface BrainEntry {
  id: string;
  name: string;
  vaultPath: string;
  template: BrainTemplate | "existing";
  createdAt: string;
}

export interface BrainConfig {
  vaultPath: string;
  template: BrainTemplate | "existing";
  createdAt: string;
  agentContextFiles: string[];
  contextTokenBudget: number;
  watchEnabled: boolean;
  sync: unknown | null;
}

export interface BrainTemplateInfo {
  id: BrainTemplate;
  label: string;
  description: string;
  bestFor: string;
  directories: string[];
  preview: string;
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface BrainConfigState {
  // Multi-brain registry
  brains: BrainEntry[];
  activeBrainId: string | null;
  config: BrainConfig | null; // derived from active brain
  isConfigured: boolean;
  isLoading: boolean;
  templates: BrainTemplateInfo[];

  // Setup wizard state
  setupStep: BrainSetupStep;
  setupMode: "new" | "existing" | null;
  parentDir: string;
  vaultName: string;
  selectedTemplate: BrainTemplate | null;
  existingPath: string;
  setupError: string | null;
  setupResult: { noteCount?: number; vaultPath?: string } | null;

  // Actions — registry
  setBrains: (brains: BrainEntry[], activeBrainId: string | null) => void;
  switchBrain: (brainId: string) => void;
  addBrainEntry: (entry: BrainEntry) => void;
  removeBrainEntry: (brainId: string) => void;
  setConfig: (config: BrainConfig | null) => void;
  setTemplates: (templates: BrainTemplateInfo[]) => void;
  setLoading: (loading: boolean) => void;

  // Actions — wizard
  openSetupWizard: () => void;
  closeSetupWizard: () => void;
  setSetupStep: (step: BrainSetupStep) => void;
  setSetupMode: (mode: "new" | "existing") => void;
  setParentDir: (dir: string) => void;
  setVaultName: (name: string) => void;
  setSelectedTemplate: (t: BrainTemplate) => void;
  setExistingPath: (path: string) => void;
  setSetupError: (error: string | null) => void;
  setSetupResult: (result: { noteCount?: number; vaultPath?: string } | null) => void;
  resetSetup: () => void;
}

const DEFAULT_SETUP_STATE = {
  setupStep: null as BrainSetupStep,
  setupMode: null as "new" | "existing" | null,
  parentDir: "",
  vaultName: ".brain",
  selectedTemplate: "para" as BrainTemplate | null,
  existingPath: "",
  setupError: null as string | null,
  setupResult: null as { noteCount?: number; vaultPath?: string } | null,
};

export const useBrainConfigStore = create<BrainConfigState>((set, get) => ({
  // Initial state
  brains: [],
  activeBrainId: null,
  config: null,
  isConfigured: false,
  isLoading: true,
  templates: [],
  ...DEFAULT_SETUP_STATE,

  // Registry actions
  setBrains: (brains, activeBrainId) => {
    const active = brains.find((b) => b.id === activeBrainId) ?? brains[0] ?? null;
    set({
      brains,
      activeBrainId: active?.id ?? null,
      isConfigured: brains.length > 0,
      isLoading: false,
      config: active ? {
        vaultPath: active.vaultPath,
        template: active.template,
        createdAt: active.createdAt,
        agentContextFiles: ["_agent/IDENTITY.md", "_agent/MEMORY.md"],
        contextTokenBudget: 4000,
        watchEnabled: true,
        sync: null,
      } : null,
    });
  },

  switchBrain: (brainId) => {
    const { brains } = get();
    const brain = brains.find((b) => b.id === brainId);
    if (!brain) return;
    set({
      activeBrainId: brainId,
      config: {
        vaultPath: brain.vaultPath,
        template: brain.template,
        createdAt: brain.createdAt,
        agentContextFiles: ["_agent/IDENTITY.md", "_agent/MEMORY.md"],
        contextTokenBudget: 4000,
        watchEnabled: true,
        sync: null,
      },
    });
  },

  addBrainEntry: (entry) => {
    const { brains } = get();
    const updated = [...brains, entry];
    set({
      brains: updated,
      activeBrainId: entry.id,
      isConfigured: true,
      config: {
        vaultPath: entry.vaultPath,
        template: entry.template,
        createdAt: entry.createdAt,
        agentContextFiles: ["_agent/IDENTITY.md", "_agent/MEMORY.md"],
        contextTokenBudget: 4000,
        watchEnabled: true,
        sync: null,
      },
    });
  },

  removeBrainEntry: (brainId) => {
    const { brains, activeBrainId } = get();
    const updated = brains.filter((b) => b.id !== brainId);
    const newActive = activeBrainId === brainId
      ? (updated[0]?.id ?? null)
      : activeBrainId;
    const activeBrain = updated.find((b) => b.id === newActive);
    set({
      brains: updated,
      activeBrainId: newActive,
      isConfigured: updated.length > 0,
      config: activeBrain ? {
        vaultPath: activeBrain.vaultPath,
        template: activeBrain.template,
        createdAt: activeBrain.createdAt,
        agentContextFiles: ["_agent/IDENTITY.md", "_agent/MEMORY.md"],
        contextTokenBudget: 4000,
        watchEnabled: true,
        sync: null,
      } : null,
    });
  },

  setConfig: (config) =>
    set({ config, isConfigured: config !== null, isLoading: false }),
  setTemplates: (templates) => set({ templates }),
  setLoading: (isLoading) => set({ isLoading }),

  // Wizard actions
  openSetupWizard: () => set({ ...DEFAULT_SETUP_STATE, setupStep: "choose-path" }),
  closeSetupWizard: () => set(DEFAULT_SETUP_STATE),
  setSetupStep: (setupStep) => set({ setupStep, setupError: null }),
  setSetupMode: (setupMode) => set({ setupMode }),
  setParentDir: (parentDir) => set({ parentDir }),
  setVaultName: (vaultName) => set({ vaultName }),
  setSelectedTemplate: (selectedTemplate) => set({ selectedTemplate }),
  setExistingPath: (existingPath) => set({ existingPath }),
  setSetupError: (setupError) => set({ setupError }),
  setSetupResult: (setupResult) => set({ setupResult }),
  resetSetup: () => set(DEFAULT_SETUP_STATE),
}));

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectIsWizardOpen = (s: BrainConfigState): boolean => s.setupStep !== null;
export const selectResolvedVaultPath = (s: BrainConfigState): string => {
  if (s.setupMode === "existing") return s.existingPath;
  if (!s.parentDir) return "";
  return `${s.parentDir.replace(/\/$/, "")}/${s.vaultName || ".brain"}`;
};
export const selectActiveBrain = (s: BrainConfigState): BrainEntry | null => {
  return s.brains.find((b) => b.id === s.activeBrainId) ?? null;
};
export const selectHasMultipleBrains = (s: BrainConfigState): boolean => s.brains.length > 1;
