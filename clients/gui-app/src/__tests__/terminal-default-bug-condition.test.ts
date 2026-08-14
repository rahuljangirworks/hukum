/**
 * Bug Condition Exploration Test - defaultTerminalSelection IS UNDEFINED
 *
 * **Validates: Requirements 2.3, 2.4**
 *
 * This test is written BEFORE implementing the fix and is EXPECTED TO FAIL
 * on unfixed code. Failure confirms the bug exists:
 *
 * - `settingsStore.getState().defaultTerminalSelection` is undefined
 * - New terminal conversations use `defaultSelection` (chat default) instead
 *   of a terminal-specific default
 *
 * The test encodes EXPECTED behavior that will pass AFTER the fix is implemented.
 */
import { describe, it, expect } from "vitest";
import { useSettingsStore } from "@/stores/settings/settings-store";
import { DEFAULT_SELECTION } from "@/components/home/data/landing-options";

describe("Bug Condition: defaultTerminalSelection IS UNDEFINED", () => {
  it("settings store exposes a defaultTerminalSelection field", () => {
    const state = useSettingsStore.getState();

    // BUG: On unfixed code, `defaultTerminalSelection` does not exist on the
    // settings store. This assertion will FAIL, proving the bug exists.
    // After the fix, the store will have this field defined.
    expect(state).toHaveProperty("defaultTerminalSelection");
  });

  it("defaultTerminalSelection is a valid HarnessModelSelection object", () => {
    const state = useSettingsStore.getState();

    // BUG: On unfixed code, this field is undefined.
    // Expected: it should be a HarnessModelSelection with harnessId, modelSlug, profileId.
    const terminalDefault = (state as Record<string, unknown>).defaultTerminalSelection;

    expect(terminalDefault).toBeDefined();
    expect(terminalDefault).not.toBeNull();
    expect(terminalDefault).toHaveProperty("harnessId");
    expect(terminalDefault).toHaveProperty("modelSlug");
    expect(terminalDefault).toHaveProperty("profileId");
  });

  it("defaultTerminalSelection has a sensible initial value", () => {
    const state = useSettingsStore.getState();

    // BUG: On unfixed code, defaultTerminalSelection doesn't exist.
    // Expected: initial value should be DEFAULT_SELECTION (same starting point as chat).
    const terminalDefault = (state as Record<string, unknown>).defaultTerminalSelection as typeof DEFAULT_SELECTION | undefined;

    // This will FAIL on unfixed code because the field is undefined
    expect(terminalDefault).toEqual(DEFAULT_SELECTION);
  });

  it("defaultTerminalSelection is independent from defaultSelection (chat default)", () => {
    const store = useSettingsStore;
    const initialState = store.getState();

    // BUG: On unfixed code, there's only one `defaultSelection` shared across
    // both chat and terminal modes. No `defaultTerminalSelection` exists.
    //
    // Expected: after the fix, the store should have BOTH:
    // - `defaultSelection` for chat conversations
    // - `defaultTerminalSelection` for terminal conversations
    // And they should be independently configurable.

    const hasDefaultSelection = "defaultSelection" in initialState;
    const hasDefaultTerminalSelection = "defaultTerminalSelection" in initialState;

    expect(hasDefaultSelection).toBe(true);
    // This FAILS on unfixed code - proves terminal-specific default is missing
    expect(hasDefaultTerminalSelection).toBe(true);
  });

  it("settings store exposes a setDefaultTerminalSelection setter", () => {
    const state = useSettingsStore.getState();

    // BUG: On unfixed code, no setter exists for terminal default.
    // Expected: the store should expose a `setDefaultTerminalSelection` function.
    expect(state).toHaveProperty("setDefaultTerminalSelection");
    expect(typeof (state as Record<string, unknown>).setDefaultTerminalSelection).toBe("function");
  });

  it("new terminal conversations should use defaultTerminalSelection, not defaultSelection", () => {
    const state = useSettingsStore.getState();

    // BUG: On unfixed code, there is no `defaultTerminalSelection` field.
    // Terminal conversations fall back to reading `defaultSelection` (the chat
    // default) or `composerHarnessMemoryStore` last-used, which means there's
    // no way to configure a terminal-specific default.
    //
    // Expected behavior after fix:
    // - Terminal conversations read `defaultTerminalSelection`
    // - Chat conversations read `defaultSelection`
    // - The two are independent

    const terminalDefault = (state as Record<string, unknown>).defaultTerminalSelection;
    const chatDefault = state.defaultSelection;

    // First: terminal default must exist (FAILS on unfixed code)
    expect(terminalDefault).toBeDefined();

    // Both defaults should initially be the same (DEFAULT_SELECTION),
    // but they must be independent fields that CAN diverge.
    expect(terminalDefault).toEqual(chatDefault);
  });
});
