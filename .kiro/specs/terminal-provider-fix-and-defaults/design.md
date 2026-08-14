# Terminal Provider Fix and Defaults Bugfix Design

## Overview

This fix addresses two intertwined issues that prevent the terminal (TUI) surface from working reliably: (1) the executable resolver fails to locate several harness binaries due to base-directory miscalculation and missing gitignored build artifacts, and (2) the client has no independent default provider setting for the terminal surface, instead sharing a single `defaultSelection` between chat and terminal modes. The fix makes the resolver robust across dev/compiled modes and introduces a per-surface default selection in the settings store.

## Glossary

- **Bug_Condition (C)**: The set of inputs where (a) a terminal harness launch is attempted but the executable resolver reports `available: false` despite the binary being present somewhere, or (b) the user expects to configure a terminal-specific default but no such setting exists.
- **Property (P)**: The resolver correctly finds bundled executables regardless of runtime mode, and the settings store exposes an independent `defaultTerminalSelection` used for new terminal conversations.
- **Preservation**: Existing behavior for `claude` and `codex` harnesses (which already resolve correctly), existing chat `defaultSelection`, mid-session provider switching, PATH fallback resolution, and persisted settings migration must remain unchanged.
- **`bundledExecutableCandidates()`**: Function in `resolver.ts` that computes the absolute path to a harness binary inside the `providers/` directory based on `baseDirectory`.
- **`defaultExecutableResolver()`**: Function in `resolver.ts` that searches bundled candidates then PATH for a harness command.
- **`baseDirectory`**: The computed root directory from which `providers/<id>/<command>` paths are resolved; currently derived from `process.execPath`, `process.cwd()`, or `HUKUM_HOST_SOURCE_DIR`.
- **`HarnessModelSelection`**: Type `{ harnessId: ProviderId; modelSlug: string; profileId: string | null }` representing a user's chosen provider + model pair.
- **`defaultTerminalSelection`**: The new per-surface default provider/model selection for terminal mode.
- **`composerHarnessMemoryStore`**: Zustand store that remembers last-used harness/model per provider; currently used as the source of truth for new conversations (the bug).

## Bug Details

### Bug Condition

The bug manifests in two related scenarios:

1. **Resolver failure**: When a user attempts to launch a terminal agent with certain harnesses, `listTuiHarnesses()` reports `available: false` because `bundledExecutableCandidates()` computes an incorrect `baseDirectory` or the binary simply doesn't exist (gitignored build artifacts).

2. **Missing terminal default**: When a user switches the landing composer to "terminal" mode, the system uses the same `defaultSelection` as chat mode. There is no way to set a terminal-specific default, and new conversations inherit the last-used provider from `composerHarnessMemoryStore` rather than the configured default.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { action: "resolve" | "default", harnessId: TuiHarnessId, runtimeMode: "dev" | "compiled" }
  OUTPUT: boolean

  IF input.action == "resolve" THEN
    RETURN input.harnessId IN ["opencode", "kiro", "kilocode", "pi", "gemini", "antigravity"]
           AND bundledBinaryNotFoundAtComputedPath(input.harnessId, input.runtimeMode)
           AND NOT executableOnSystemPATH(input.harnessId)
  END IF

  IF input.action == "default" THEN
    RETURN composerMode == "terminal"
           AND defaultTerminalSelection IS UNDEFINED
  END IF

  RETURN false
END FUNCTION
```

### Examples

- **opencode in dev mode**: `baseDirectory` = `process.cwd()` = project root. Path resolves to `<root>/providers/opencode/opencode`. Directory `providers/opencode/` is gitignored and doesn't exist unless built locally. Result: `available: false`. Expected: clear error message + PATH fallback.
- **pi in compiled mode**: `process.execPath` = `/path/to/compiled-binary`. `baseDirectory` = `dirname(execPath)/..` which may not be the directory containing `providers/`. Result: `available: false`. Expected: resolver uses a reliable strategy (e.g. `__dirname`-relative or app root) that works in both modes.
- **gemini in dev mode**: `baseDirectory` = `process.cwd()`. If the dev server is launched from a subdirectory, `cwd()` is wrong. Result: binary not found.
- **Terminal default**: User sets default provider to "claude" for chat. Switches to terminal mode and wants "codex" as default there. Only one `defaultSelection` exists — changing it affects chat too.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- `claude` and `codex` harness resolution via their existing bundled `providers/claude-code/` and `providers/codex/` directories must continue to work exactly as today.
- Mouse/keyboard interactions with the model picker for chat mode must remain unchanged.
- Mid-session provider switching within an active conversation must continue to work.
- PATH fallback resolution must continue to serve as the secondary lookup mechanism.
- Existing persisted settings must load and migrate correctly without data loss.
- The `composerHarnessMemoryStore` must continue to remember last-used providers for harness switching within a session.

**Scope:**
All inputs that do NOT involve (a) resolving the base directory for harnesses other than claude/codex, or (b) reading the terminal-specific default selection should be completely unaffected by this fix. This includes:
- Chat surface default selection behavior
- Provider profile management
- Terminal agent args and session resume flows
- All non-launch host RPCs

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Unreliable `baseDirectory` computation in `bundledExecutableCandidates()`**: The function uses a heuristic: if `process.execPath` does NOT end in "bun" or "node", it assumes compiled mode and computes `join(dirname(process.execPath), "..")`. Otherwise it falls back to `process.cwd()`. This breaks when:
   - In compiled mode, the binary is not two levels above `providers/`
   - In dev mode, `cwd()` differs from the project root (e.g. running from a monorepo workspace)
   - The `HUKUM_HOST_SOURCE_DIR` env var is not set in production builds

2. **Missing build artifacts for gitignored providers**: `providers/opencode/`, `providers/kiro/`, `providers/kilocode/` are gitignored. Their binaries only exist after a local build step. The resolver treats them identically to bundled providers but provides no diagnostic when the path doesn't exist vs. when it lacks execute permission.

3. **Single `defaultSelection` shared across surfaces**: The `SettingsState` interface has one `defaultSelection: HarnessModelSelection` field. The landing composer reads this for both chat and terminal modes. No `defaultTerminalSelection` field exists.

4. **`composerHarnessMemoryStore` overriding configured default**: New conversations consult `resolveHarnessSwitch()` which returns the last-used provider, effectively ignoring the settings-store default. This means even if the user configures a default, a new conversation opens with whatever was last used.

## Correctness Properties

Property 1: Bug Condition - Executable Resolution Across Runtime Modes

_For any_ terminal harness launch attempt where a bundled binary exists at the correct relative path under `providers/`, the fixed `bundledExecutableCandidates()` function SHALL compute the correct absolute path to that binary regardless of whether the host runs in dev mode (via bun/node) or compiled mode, using a resolution strategy anchored to the actual source/install directory rather than `process.cwd()`.

**Validates: Requirements 2.1, 2.2**

Property 2: Bug Condition - Independent Terminal Default Selection

_For any_ new terminal conversation creation, the system SHALL read `defaultTerminalSelection` from the settings store (rather than the chat `defaultSelection` or the last-used harness memory) and use it as the initial provider/model for that terminal session.

**Validates: Requirements 2.3, 2.4**

Property 3: Preservation - Existing Harness Resolution

_For any_ harness resolution where the harness is `claude` or `codex` (whose bundled executables already resolve correctly), the fixed resolver SHALL produce the same resolved path as the original resolver, preserving launch behavior for these established providers.

**Validates: Requirements 3.1, 3.4**

Property 4: Preservation - Chat Default and Settings Migration

_For any_ settings load or new chat conversation, the system SHALL continue to use `defaultSelection` for the chat surface exactly as before, and SHALL correctly migrate/merge persisted state including the new `defaultTerminalSelection` field without corrupting existing preferences.

**Validates: Requirements 3.3, 3.5**

Property 5: Preservation - Mid-Session Provider Switching

_For any_ active/ongoing conversation where the user changes the provider mid-session, the system SHALL continue to allow this switch without being affected by the new default-selection logic (which only applies at conversation creation time).

**Validates: Requirements 3.2**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/services/tui-lifecycle-service/resolver.ts` (host side)

**Function**: `bundledExecutableCandidates()`

**Specific Changes**:
1. **Robust base directory resolution**: Replace the `process.cwd()` fallback with `__dirname`-relative computation (or `import.meta.dir` for Bun). In dev mode, resolve relative to the file's actual location (`join(__dirname, "..", "..", "..")` to reach project root). In compiled mode, continue using `dirname(process.execPath)/..` but validate the path exists.
2. **Explicit dev-mode detection**: Instead of checking if `execPath` ends with "bun" or "node" (fragile — could be "bun-debug", "node18", etc.), use a more reliable signal like checking if `__dirname` contains a `src/` path segment or an env flag.
3. **Diagnostic logging**: When a candidate path doesn't exist, log the computed path and which strategy was used, so developers can diagnose resolution failures without debugging the resolver itself.
4. **Execute permission handling**: For bundled binaries that exist but lack `X_OK`, log a specific warning mentioning `chmod +x` rather than the generic "not found" message.

**File**: `clients/gui-app/src/stores/settings/settings-store.ts` (client side)

**Changes**:
1. **Add `defaultTerminalSelection` field** to `SettingsState` interface with type `HarnessModelSelection`.
2. **Add to `PersistedSettingsState`** so the new field is persisted.
3. **Add `setDefaultTerminalSelection` setter** using the existing `makeSetter` pattern.
4. **Set initial value** to `DEFAULT_SELECTION` (same as chat initially — user can then customize).
5. **Update `partializeSettingsState()`** to include `defaultTerminalSelection`.
6. **Update `merge()` function** to handle rehydration of the new field gracefully (fall back to `DEFAULT_SELECTION` if missing from persisted state).

**File**: `clients/gui-app/src/components/home/data/landing-options.ts` (client side)

**Changes**:
1. **Export `DEFAULT_TERMINAL_SELECTION`** constant (can initially equal `DEFAULT_SELECTION`; separate constant allows independent future changes).

**File**: `clients/gui-app/src/stores/composer/composer-harness-memory-store.ts` (client side) and/or the landing composer component

**Changes**:
1. **New conversation initialization**: When creating a new terminal conversation, read `defaultTerminalSelection` from settings store instead of `resolveHarnessSwitch()`. The memory store continues to record selections for mid-session switching but no longer overrides the configured default at session start.
2. **New chat conversation**: Similarly ensure new chats read `defaultSelection` from settings rather than the last-used memory (this may already be correct — verify).

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write unit tests that invoke `bundledExecutableCandidates()` and `defaultExecutableResolver()` with controlled `process.cwd()`, `process.execPath`, and `HUKUM_HOST_SOURCE_DIR` values, then assert the resolved paths. Run these on UNFIXED code to observe failures.

**Test Cases**:
1. **Dev mode with correct cwd**: Set `process.cwd()` to project root, verify resolution works (baseline — may pass on unfixed code for bundled providers)
2. **Dev mode with wrong cwd**: Set `process.cwd()` to a subdirectory, attempt to resolve `pi` — will fail on unfixed code
3. **Compiled mode path mismatch**: Set `process.execPath` to a path where `dirname(execPath)/..` does not contain `providers/` — will fail on unfixed code
4. **Gitignored provider missing**: Attempt to resolve `opencode` when `providers/opencode/` doesn't exist — will fail on unfixed code (expected, but should produce actionable error)
5. **Settings store terminal default**: Read `defaultTerminalSelection` from settings store — will be undefined on unfixed code

**Expected Counterexamples**:
- `bundledExecutableCandidates("pi")` returns paths that don't exist when `cwd()` is wrong
- `defaultExecutableResolver("gemini")` returns `null` in compiled mode due to wrong base directory
- `useSettingsStore.getState().defaultTerminalSelection` is `undefined`

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  IF input.action == "resolve" THEN
    result := bundledExecutableCandidates_fixed(input.harnessId)
    ASSERT result[0] points to a valid path under the actual providers/ directory
    ASSERT path computation does not depend on process.cwd()
  END IF
  IF input.action == "default" THEN
    result := settingsStore.getState().defaultTerminalSelection
    ASSERT result IS HarnessModelSelection
    ASSERT result != settingsStore.getState().defaultSelection OR both are the initial default
  END IF
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT defaultExecutableResolver_original(input) = defaultExecutableResolver_fixed(input)
  ASSERT settingsStore.defaultSelection is unchanged for chat conversations
  ASSERT composerHarnessMemoryStore behavior for mid-session switching is unchanged
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many combinations of runtime modes, harness IDs, and PATH configurations
- It catches edge cases in path resolution that manual tests might miss
- It provides strong guarantees that `claude` and `codex` resolution is byte-identical before and after

**Test Plan**: Observe behavior on UNFIXED code for claude/codex resolution across multiple `cwd` and `execPath` combinations, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Claude/Codex resolution preservation**: Verify `defaultExecutableResolver("claude")` and `defaultExecutableResolver("codex")` return the same paths before and after the fix across dev and compiled modes
2. **PATH fallback preservation**: Verify that when a binary is only on PATH (not bundled), the resolver finds it identically before and after
3. **Chat default preservation**: Verify `defaultSelection` in settings store is unchanged after adding `defaultTerminalSelection`
4. **Settings migration preservation**: Verify persisted state from before the fix (without `defaultTerminalSelection`) loads correctly and gets a sensible default

### Unit Tests

- Test `bundledExecutableCandidates()` with mocked `__dirname` / `import.meta.dir` in both dev and compiled modes
- Test `defaultExecutableResolver()` with controlled PATH and providers directory
- Test settings store `defaultTerminalSelection` getter/setter
- Test settings store `merge()` with persisted state lacking `defaultTerminalSelection`
- Test that new terminal conversation reads `defaultTerminalSelection`, not `defaultSelection`

### Property-Based Tests

- Generate random harness IDs and runtime mode combinations, verify resolver either finds the binary or produces an actionable error (never a misleading path)
- Generate random settings state shapes (simulating legacy persisted data), verify `merge()` always produces a valid `SettingsState` with both `defaultSelection` and `defaultTerminalSelection`
- Generate random sequences of conversation-create events with varying `composerMode`, verify the correct default is applied per surface

### Integration Tests

- End-to-end: set `defaultTerminalSelection` to "claude", create a new terminal conversation, verify it launches with claude
- End-to-end: set `defaultSelection` to "codex" for chat, verify new terminal conversations are unaffected
- End-to-end: launch `pi` terminal agent in dev mode, verify binary is found and process starts
- End-to-end: change provider mid-session, verify memory store records it but next NEW conversation still uses the configured default
