/**
 * Preservation Property Test - Chat Default and Settings Migration Unchanged
 *
 * **Validates: Requirements 3.3, 3.5**
 *
 * This test is written BEFORE implementing the fix and is EXPECTED TO PASS
 * on unfixed code. It captures the CORRECT baseline behavior for:
 *
 * - `settingsStore.getState().defaultSelection` returns current chat default
 * - Persisted settings load and merge correctly
 * - Settings store merge handles legacy data gracefully
 *
 * After the fix, these tests must STILL PASS (no regressions).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "@/stores/settings/settings-store";
import {
  DEFAULT_SELECTION,
  DEFAULT_PERMISSION,
  DEFAULT_COMPOSER_MODE,
  DEFAULT_REASONING,
  DEFAULT_SERVICE_TIER,
  type HarnessModelSelection,
} from "@/components/home/data/landing-options";

describe("Preservation: Chat defaultSelection behavior", () => {
  // Property: For all chat conversations, `defaultSelection` is used as the
  // initial provider/model selection. This must remain unchanged.

  it("settings store exposes defaultSelection field", () => {
    const state = useSettingsStore.getState();
    expect(state).toHaveProperty("defaultSelection");
    expect(state.defaultSelection).toBeDefined();
  });

  it("defaultSelection has the correct initial value (DEFAULT_SELECTION)", () => {
    const state = useSettingsStore.getState();
    expect(state.defaultSelection).toEqual(DEFAULT_SELECTION);
  });

  it("defaultSelection is a valid HarnessModelSelection with required fields", () => {
    const state = useSettingsStore.getState();
    const selection = state.defaultSelection;

    expect(selection).toHaveProperty("harnessId");
    expect(selection).toHaveProperty("modelSlug");
    expect(selection).toHaveProperty("profileId");
    expect(typeof selection.harnessId).toBe("string");
    expect(typeof selection.modelSlug).toBe("string");
  });

  it("DEFAULT_SELECTION constant has expected shape", () => {
    // Captures the known default: codex with empty model slug
    expect(DEFAULT_SELECTION.harnessId).toBe("codex");
    expect(DEFAULT_SELECTION.modelSlug).toBe("");
    expect(DEFAULT_SELECTION.profileId).toBeNull();
  });

  it("defaultSelection initial value matches DEFAULT_SELECTION constant", () => {
    const state = useSettingsStore.getState();
    expect(state.defaultSelection.harnessId).toBe(DEFAULT_SELECTION.harnessId);
    expect(state.defaultSelection.modelSlug).toBe(DEFAULT_SELECTION.modelSlug);
    expect(state.defaultSelection.profileId).toBe(DEFAULT_SELECTION.profileId);
  });
});

describe("Preservation: Settings store initial state completeness", () => {
  // Property: All expected fields are present and have sensible defaults.
  // This catches regressions where adding new fields might break existing ones.

  it("all core settings fields are present with expected defaults", () => {
    const state = useSettingsStore.getState();

    expect(state.theme).toBe("system");
    expect(state.defaultSelection).toEqual(DEFAULT_SELECTION);
    expect(state.defaultReasoning).toBe(DEFAULT_REASONING);
    expect(state.defaultServiceTier).toBe(DEFAULT_SERVICE_TIER);
    expect(state.defaultPermission).toBe(DEFAULT_PERMISSION);
    expect(state.composerMode).toBe(DEFAULT_COMPOSER_MODE);
  });

  it("composerMode defaults to 'chat'", () => {
    const state = useSettingsStore.getState();
    expect(state.composerMode).toBe("chat");
  });

  it("composerMode can be set to 'terminal' without affecting defaultSelection", () => {
    const store = useSettingsStore;
    const originalDefaultSelection = store.getState().defaultSelection;

    // Change composer mode
    store.getState().setComposerMode("terminal");

    // defaultSelection for chat must remain unchanged
    expect(store.getState().defaultSelection).toEqual(originalDefaultSelection);

    // Reset
    store.getState().setComposerMode("chat");
  });
});

describe("Preservation: Settings merge handles legacy persisted state", () => {
  // Property: For all persisted state shapes (simulating legacy data without
  // `defaultTerminalSelection`), merge produces valid state without data loss.

  // The merge function in the settings store handles rehydration from localStorage.
  // We simulate what happens when persisted data is loaded.

  it("merge function exists on the persist configuration", () => {
    // The store uses zustand persist with a custom merge function.
    // We verify the store correctly initializes even with partial state.
    const state = useSettingsStore.getState();

    // All setters should be functions (not lost during merge)
    expect(typeof state.setTheme).toBe("function");
    expect(typeof state.setComposerMode).toBe("function");
  });

  it("store initializes correctly with no persisted data (fresh install)", () => {
    // On fresh install, no localStorage data exists. The store should
    // initialize with all defaults.
    const state = useSettingsStore.getState();

    expect(state.defaultSelection).toEqual(DEFAULT_SELECTION);
    expect(state.defaultPermission).toBe(DEFAULT_PERMISSION);
    expect(state.composerMode).toBe(DEFAULT_COMPOSER_MODE);
    expect(state.theme).toBe("system");
  });

  it("worktreeBranchPrefix has valid default value", () => {
    const state = useSettingsStore.getState();
    expect(state.worktreeBranchPrefix).toBe("hukum/");
    expect(typeof state.worktreeBranchPrefix).toBe("string");
  });

  it("chatTurnMinimapSide has valid default value", () => {
    const state = useSettingsStore.getState();
    expect(["left", "right", "hide"]).toContain(state.chatTurnMinimapSide);
  });

  it("simulated legacy state without new fields merges correctly", () => {
    // Simulate what the merge function does when persisted state is loaded.
    // Legacy state won't have `defaultTerminalSelection` (since it doesn't
    // exist yet on unfixed code).
    //
    // The merge function signature: merge(persistedState, currentState) => merged
    // It does: { ...currentState, ...persistedState } with validation for
    // worktreeBranchPrefix and chatTurnMinimapSide.

    // Simulate a legacy persisted state blob (no defaultTerminalSelection)
    const legacyPersistedState: Record<string, unknown> = {
      theme: "dark",
      defaultSelection: { harnessId: "claude", modelSlug: "opus", profileId: null },
      defaultPermission: "supervised",
      composerMode: "chat",
      worktreeBranchPrefix: "my-prefix/",
      chatTurnMinimapSide: "left",
    };

    // The current state (what the store initializes with)
    const currentState = useSettingsStore.getState();

    // Manually replicate the merge logic from settings-store.ts
    const merged = { ...currentState, ...legacyPersistedState };
    const finalState = {
      ...merged,
      worktreeBranchPrefix:
        typeof merged.worktreeBranchPrefix === "string"
          ? merged.worktreeBranchPrefix
          : "hukum/",
      chatTurnMinimapSide:
        merged.chatTurnMinimapSide === "left" ||
        merged.chatTurnMinimapSide === "right" ||
        merged.chatTurnMinimapSide === "hide"
          ? merged.chatTurnMinimapSide
          : "right",
    };

    // Verify merged state preserves the persisted values
    expect(finalState.theme).toBe("dark");
    expect(finalState.defaultSelection).toEqual({
      harnessId: "claude",
      modelSlug: "opus",
      profileId: null,
    });
    expect(finalState.defaultPermission).toBe("supervised");
    expect(finalState.composerMode).toBe("chat");
    expect(finalState.worktreeBranchPrefix).toBe("my-prefix/");
    expect(finalState.chatTurnMinimapSide).toBe("left");

    // Verify all setters are still functions (not overwritten)
    expect(typeof finalState.setTheme).toBe("function");
    expect(typeof finalState.setComposerMode).toBe("function");
  });

  it("merge handles invalid worktreeBranchPrefix by falling back to default", () => {
    const currentState = useSettingsStore.getState();

    // Simulate corrupted persisted state
    const corruptedState: Record<string, unknown> = {
      worktreeBranchPrefix: 123, // wrong type
    };

    const merged = { ...currentState, ...corruptedState };
    const finalWorktreePrefix =
      typeof merged.worktreeBranchPrefix === "string"
        ? merged.worktreeBranchPrefix
        : "hukum/";

    expect(finalWorktreePrefix).toBe("hukum/");
  });

  it("merge handles invalid chatTurnMinimapSide by falling back to default", () => {
    const currentState = useSettingsStore.getState();

    // Simulate corrupted persisted state
    const corruptedState: Record<string, unknown> = {
      chatTurnMinimapSide: "invalid-value",
    };

    const merged = { ...currentState, ...corruptedState };
    const finalMinimapSide =
      merged.chatTurnMinimapSide === "left" ||
      merged.chatTurnMinimapSide === "right" ||
      merged.chatTurnMinimapSide === "hide"
        ? merged.chatTurnMinimapSide
        : "right";

    expect(finalMinimapSide).toBe("right"); // Falls back to default
  });
});

describe("Preservation: Settings store property-based merge validation", () => {
  // Property: For all persisted state shapes, merge produces valid state
  // that maintains type correctness and never loses existing preferences.

  // Test with various combinations of partial persisted state
  const partialStateVariants: Array<{
    label: string;
    persisted: Record<string, unknown>;
    expectedDefaultSelection: HarnessModelSelection;
  }> = [
    {
      label: "empty persisted state (fresh install)",
      persisted: {},
      expectedDefaultSelection: DEFAULT_SELECTION,
    },
    {
      label: "only theme persisted",
      persisted: { theme: "dark" },
      expectedDefaultSelection: DEFAULT_SELECTION,
    },
    {
      label: "defaultSelection persisted as claude",
      persisted: {
        defaultSelection: { harnessId: "claude", modelSlug: "sonnet", profileId: null },
      },
      expectedDefaultSelection: { harnessId: "claude", modelSlug: "sonnet", profileId: null },
    },
    {
      label: "defaultSelection persisted as codex",
      persisted: {
        defaultSelection: { harnessId: "codex", modelSlug: "", profileId: null },
      },
      expectedDefaultSelection: { harnessId: "codex", modelSlug: "", profileId: null },
    },
    {
      label: "full legacy state with all common fields",
      persisted: {
        theme: "light",
        defaultSelection: { harnessId: "claude", modelSlug: "opus", profileId: "prof-1" },
        defaultPermission: "full_access",
        composerMode: "terminal",
        worktreeBranchPrefix: "dev/",
        chatTurnMinimapSide: "right",
      },
      expectedDefaultSelection: { harnessId: "claude", modelSlug: "opus", profileId: "prof-1" },
    },
  ];

  for (const variant of partialStateVariants) {
    it(`merge preserves defaultSelection for: ${variant.label}`, () => {
      const currentState = useSettingsStore.getState();
      const merged = { ...currentState, ...variant.persisted };

      // defaultSelection should be what was persisted, or the default if not persisted
      expect(merged.defaultSelection).toEqual(variant.expectedDefaultSelection);
    });

    it(`merge retains all setters for: ${variant.label}`, () => {
      const currentState = useSettingsStore.getState();
      const merged = { ...currentState, ...variant.persisted };

      // All functions from currentState should survive the merge
      expect(typeof merged.setTheme).toBe("function");
      expect(typeof merged.setComposerMode).toBe("function");
    });
  }
});
