# Bugfix Requirements Document

## Introduction

Two related issues prevent the terminal (TUI) surface from being fully functional:

1. **Terminal providers not launching** — Several TUI harnesses (`opencode`, `kiro`, `kilocode`, `pi`, `gemini`) report `available: false` in `listTuiHarnesses()` because the executable resolver cannot find their binaries. For `opencode`, `kiro`, and `kilocode`, the provider directories (`providers/opencode/`, `providers/kiro/`, `providers/kilocode/`) are gitignored and the compiled artifacts must be built locally before they exist at runtime. For `pi`, `antigravity`, and `gemini`, the binaries exist in the repo but may lack execute permission or the resolver's `baseDirectory` computation may not point to the correct providers path at runtime.

2. **No separate default provider per surface** — The client uses a single `defaultSelection: HarnessModelSelection` for both chat and terminal modes. There is no way to independently configure a default provider for the terminal surface. Additionally, new conversations currently inherit the last-used provider rather than always applying the configured default.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user attempts to launch a terminal agent with harness `opencode`, `kiro`, or `kilocode` THEN the system reports `available: false` because the gitignored compiled artifacts do not exist in the `providers/` directory unless manually built.

1.2 WHEN a user attempts to launch a terminal agent with harness `pi`, `gemini`, or `antigravity` AND the `baseDirectory` computed by the resolver does not match the actual source/project root at runtime (e.g. due to how `process.execPath` or `process.cwd()` resolves in compiled vs dev mode) THEN the system cannot find the bundled executables and reports `available: false`.

1.3 WHEN a user wants to set a default provider specifically for terminal mode (independent from chat) THEN the system provides no such setting — only a single global `defaultSelection` exists.

1.4 WHEN a user starts a new conversation (chat or terminal) THEN the system uses the last-used provider selection from the previous session instead of always applying the configured default for that surface.

### Expected Behavior (Correct)

2.1 WHEN a user attempts to launch a terminal agent with harness `opencode`, `kiro`, or `kilocode` AND the compiled artifact is not present in the `providers/` directory THEN the system SHALL clearly indicate the binary is missing and provide actionable guidance (e.g. "run build" or "binary not found at expected path"), and SHALL still allow launch if the executable is found on system PATH.

2.2 WHEN a user attempts to launch a terminal agent with harness `pi`, `gemini`, or `antigravity` THEN the system SHALL correctly resolve the bundled executable path regardless of whether the host is running in compiled mode or dev mode, by using a reliable base directory resolution strategy.

2.3 WHEN a user configures default providers THEN the system SHALL support independent `defaultSelection` for chat and `defaultTerminalSelection` for terminal mode, both configurable from the Settings panel and the landing composer.

2.4 WHEN a user starts a new conversation (new chat or new terminal agent) THEN the system SHALL always apply the configured default provider for that surface rather than remembering the last-used provider from a previous session.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user launches terminal harness `claude` or `codex` (which have working executables bundled and are not gitignored) THEN the system SHALL CONTINUE TO resolve and launch them successfully.

3.2 WHEN a user is in an active/ongoing conversation and changes the provider mid-session THEN the system SHALL CONTINUE TO allow switching providers within a running session as it does today.

3.3 WHEN the `defaultSelection` for chat is set to a provider THEN the system SHALL CONTINUE TO use it for new chat conversations (chat surface behavior is preserved).

3.4 WHEN a terminal harness executable is found on the system PATH (not bundled) THEN the system SHALL CONTINUE TO fall back to PATH resolution as a secondary lookup.

3.5 WHEN persisted settings are loaded from storage THEN the system SHALL CONTINUE TO migrate/merge them correctly without losing existing preferences.
