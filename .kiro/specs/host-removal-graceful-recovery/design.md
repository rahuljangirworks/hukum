# Host Removal Graceful Recovery — Bugfix Design

## Overview

After "Remove Hukum" completes, the desktop client enters a broken error-loop because host-related TanStack queries keep polling against a now-dead (or blank-URL) auth server. On relaunch the client attempts to re-bootstrap the host with no way to recover. The fix introduces four coordinated guards: a URL pre-check in the fetch layer, a Zustand-driven query-disable mechanism, a "removed-by-user" detection path on app launch, and a navigation lock that confines the UI to the quit state once uninstall succeeds.

## Glossary

- **Bug_Condition (C)**: The post-uninstall state — the user has completed "Remove Hukum" and the host binary is gone, yet the client session or next launch still attempts host-related network activity or navigation.
- **Property (P)**: After uninstall completes, no host-related network request fires, the UI shows only "Quit" or "Reinstall", and navigation is blocked.
- **Preservation**: All behaviour when the host has NOT been removed — normal polling cadence, fetch semantics, sidebar navigation, and reinstall flow — remains unchanged.
- **`fetchRegisteredHostsViaHttp`**: The pure HTTP helper in `clients/shared/host-client/remote-fetcher.ts` that calls `GET /api/v3/hosts`.
- **`hostsApiUrl(authnBaseUrl)`**: URL constructor inside the same file that builds the endpoint from the auth base.
- **`registeredHostsQueryOptions`**: TanStack query factory in `use-registered-hosts-query.ts` that governs polling cadence and enabled state.
- **`useHostDirectoryList`**: Hook in `use-host-directory-list-query.ts` that subscribes to directory changes.
- **`hostManagement.installedRecord()`**: IPC call that reads the on-disk install record to distinguish "stopped" from "not installed".
- **`useRunnerUninstallHukum`**: Mutation hook that drives the danger-zone uninstall flow.

## Bug Details

### Bug Condition

The bug manifests when the user completes "Remove Hukum" and the host binary is removed from disk, but the GUI session (or a subsequent app launch) continues to fire host-related queries. In dev environments the auth server may be gone too, causing `hostsApiUrl()` to receive a blank string and `fetch()` to throw an unhandled error.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type AppState
  OUTPUT: boolean

  LET hostRemoved := input.hostBinaryExists == false
                     AND input.removalInitiatedByUser == true

  // In-session: uninstall completed but queries still enabled
  LET inSessionBug := hostRemoved
                      AND input.sessionActive == true
                      AND input.hostQueriesDisabled == false

  // Fetch layer: blank URL passed to fetch
  LET blankUrlBug := input.authnBaseUrl.trim() == ""
                     AND input.fetchAttempted == true

  // Relaunch: removed-by-user not detected, bootstrap loop starts
  LET relaunchBug := hostRemoved
                     AND input.appJustLaunched == true
                     AND input.removedByUserDetected == false

  // Navigation: user can leave quit state
  LET navBug := hostRemoved
                AND input.uninstallSucceeded == true
                AND input.navigationAllowed == true

  RETURN inSessionBug OR blankUrlBug OR relaunchBug OR navBug
END FUNCTION
```

### Examples

- User clicks "Remove Hukum" → uninstall succeeds → `useRegisteredHosts` refires on its 60s interval → `fetchRegisteredHostsViaHttp("")` throws "fetch() URL must not be a blank string" → toast error loop.
- User clicks "Remove Hukum" → uninstall succeeds → user clicks a sidebar panel → re-mounts host-scoped hooks → errors cascade again.
- User quits after uninstall → relaunches → `hostManagement.installedRecord()` returns `null` → client enters "Downloading Hukum Host..." at 0% with no escape.
- `fetchRegisteredHostsViaHttp("", token)` is called (auth server gone in dev) → `new URL("api/v3/hosts", "")` throws → unhandled exception propagates to the query error boundary.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Normal 60s liveness polling via `useRegisteredHostsPollLiveness` must continue when the host is running.
- `fetchRegisteredHostsViaHttp` with a valid `authnBaseUrl` + valid bearer must continue to fetch and parse the host registry response.
- Successful host reinstall must resume polling, connect to the host, and show it online.
- "Remove from account" (the remote deregister verb for non-local hosts) is unaffected.
- Quit-and-relaunch without prior uninstall starts the app normally.
- Sidebar navigation works as today when no uninstall is in progress.

**Scope:**
All inputs where `removalInitiatedByUser == false` (or the host binary still exists and is running) should be completely unaffected by this fix. This includes:
- All authenticated fetch calls with valid, non-blank `authnBaseUrl`
- All TanStack host queries while the host is operational
- All navigation actions while the app is in normal state
- All "Remove from account" flows for remote hosts

## Hypothesized Root Cause

Based on the bug description, the most likely issues are:

1. **Missing URL guard in `fetchRegisteredHostsViaHttp`**: The function calls `hostsApiUrl(authnBaseUrl)` which runs `new URL("api/v3/hosts", "")` when `authnBaseUrl` is blank. `new URL` with an empty base throws a TypeError (or `fetch("")` throws "URL must not be blank"). There is no early-return check for empty/whitespace-only input.

2. **No post-uninstall query disabling**: `registeredHostsQueryOptions` passes `enabled: signedIn` — it has no knowledge of whether the host was just removed. After uninstall the user is still signed in, so the query remains enabled and its next refetch (interval or window focus) fires against a dead/blank endpoint. Same for `useHostDirectoryList` which invalidates on directory change events.

3. **No "removed-by-user" detection on app launch**: When the app starts after a prior uninstall, `hostManagement.installedRecord()` returns `null` (no install record on disk). The boot sequence treats this the same as a fresh install, entering the "Downloading Hukum Host..." flow. There is no persistent flag that distinguishes "never installed" from "user deliberately removed it".

4. **No navigation lock after uninstall**: The `RemoveHukumRow` component shows a "Quit Hukum" button on success, but the sidebar and other navigation elements remain fully interactive. Clicking them re-mounts host-scoped hooks that try to poll, recreating the error loop.

## Correctness Properties

Property 1: Bug Condition — Post-Uninstall Query Silence

_For any_ app state where the bug condition holds (host has been removed by the user in this session OR `authnBaseUrl` is blank/empty), the fixed system SHALL produce no outbound `GET /api/v3/hosts` requests and no directory polling, returning `{ kind: "network-error" }` immediately for any blank-URL fetch attempt, and preventing re-entry into polling loops.

**Validates: Requirements 2.1, 2.2**

Property 2: Bug Condition — Relaunch Recovery UI

_For any_ app launch where the host was previously removed by the user (install record absent AND removed-by-user flag is set), the fixed system SHALL display a "Reinstall Hukum" UI and SHALL NOT enter the download/bootstrap loop.

**Validates: Requirements 2.3**

Property 3: Bug Condition — Navigation Lock

_For any_ app state where uninstall has succeeded in the current session, the fixed system SHALL prevent sidebar navigation and panel switching, confining the user to the quit/restart state.

**Validates: Requirements 2.4**

Property 4: Preservation — Normal Operation Unchanged

_For any_ input where the bug condition does NOT hold (host is running, no uninstall has occurred, `authnBaseUrl` is valid and non-blank), the fixed system SHALL produce the same polling behavior, fetch results, navigation capabilities, and UI as the original system.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `clients/shared/host-client/remote-fetcher.ts`

**Function**: `fetchRegisteredHostsViaHttp`

**Specific Changes**:
1. **URL guard**: Add an early-return check at the top of `fetchRegisteredHostsViaHttp`. If `authnBaseUrl` is falsy or contains only whitespace, return `{ kind: "network-error" }` immediately without constructing the URL or calling `fetch`.

---

**File**: New store — `clients/gui-app/src/stores/host/host-removal-store.ts`

**Specific Changes**:
2. **Zustand uninstall-state store**: Create a Zustand store `useHostRemovalStore` with:
   - `removedInSession: boolean` — set to `true` by the uninstall mutation's `onSuccess`.
   - `markRemovedInSession()` — action to flip the flag.
   - The store is session-scoped (not persisted) — it resets on app quit/relaunch. Relaunch detection uses the disk-based mechanism below.

---

**File**: `clients/gui-app/src/hooks/auth/use-registered-hosts-query.ts`

**Function**: `registeredHostsQueryOptions`

**Specific Changes**:
3. **Query enabled guard**: Read `removedInSession` from `useHostRemovalStore` in `useRegisteredHosts` and `useRegisteredHostsPollLiveness`. Pass it as part of the `enabled` computation: `enabled: signedIn && !removedInSession`. When the flag flips, TanStack disables the query, cancels any in-flight refetch, and stops the interval.

---

**File**: `clients/gui-app/src/hooks/host/use-host-directory-list-query.ts`

**Function**: `useHostDirectoryList`

**Specific Changes**:
4. **Directory query guard**: Similarly gate the directory subscription. When `removedInSession` is `true`, skip the `directory.onChange` subscription and pass the underlying `useHostPickerList` a null `directoryId` so it resolves with no data and no polling.

---

**File**: `clients/gui-app/src/hooks/runner/use-runner-uninstall-hukum-mutation.ts`

**Function**: `useRunnerUninstallHukum`

**Specific Changes**:
5. **Wire the store**: In `onSuccess`, call `useHostRemovalStore.getState().markRemovedInSession()`. Also call `queryClient.cancelQueries()` for the registered-hosts and host-directory query keys to immediately abort any in-flight requests (belt-and-suspenders alongside the `enabled: false` propagation).

---

**File**: `clients/desktop/src/electron-main/ipc/host-management-ipc.ts` (and protocol type)

**Specific Changes**:
6. **Persist "removed-by-user" flag on uninstall**: After removing the host binary, write a marker file (e.g., `~/.hukum/host/dev/.removed-by-user`) or set a field in the install-record JSON. On next `installedRecord()` call (app boot), expose a `removedByUser: boolean` field so the GUI can distinguish "never installed" from "user removed".

---

**File**: Boot/startup path (GUI app entry or host-settings init)

**Specific Changes**:
7. **Relaunch detection**: On app start, when `installedRecord()` returns `null` but the `removedByUser` marker exists, route to a "Reinstall Hukum" view instead of the download/bootstrap flow. The reinstall action clears the marker and enters normal install.

---

**File**: `clients/gui-app/src/components/settings/host-scope/host-danger-zone.tsx` (and sidebar/layout)

**Specific Changes**:
8. **Navigation lock**: When `useHostRemovalStore((s) => s.removedInSession)` is `true`, disable sidebar links and panel-switch controls. This can be implemented as:
   - A CSS `pointer-events: none` + `opacity` dimming on the sidebar nav container.
   - A guard in the settings panel router that short-circuits to the "Quit Hukum" view regardless of the requested route.
   - The lock is session-scoped; quitting the app is the only exit.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write unit tests that call `fetchRegisteredHostsViaHttp("")` and observe the thrown exception. Mount `useRegisteredHosts` in a test harness after simulating a successful uninstall and observe that refetches fire. Simulate relaunch with `installedRecord() → null` and observe the bootstrap loop entry.

**Test Cases**:
1. **Blank URL Fetch Test**: Call `fetchRegisteredHostsViaHttp("", "token")` — expect unhandled throw on unfixed code (TypeError from `new URL`).
2. **Post-Uninstall Polling Test**: Mount `useRegisteredHosts` with `signedIn: true`, trigger uninstall success, advance timers by 60s — expect refetch attempt on unfixed code.
3. **Relaunch Without Marker Test**: Simulate app boot with `installedRecord() → null` and no `removedByUser` flag — expect entry into download flow on unfixed code.
4. **Navigation After Uninstall Test**: Render danger-zone, complete uninstall, attempt sidebar navigation — expect navigation succeeds on unfixed code (the bug).

**Expected Counterexamples**:
- `fetchRegisteredHostsViaHttp("")` throws TypeError: "Failed to construct 'URL'"
- TanStack query refires POST-uninstall, generating network errors
- App boot enters download loop despite user having explicitly removed

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  IF input.authnBaseUrl.trim() == "" THEN
    result := fetchRegisteredHostsViaHttp_fixed(input.authnBaseUrl, input.token)
    ASSERT result.kind == "network-error"
  END IF

  IF input.removedInSession == true THEN
    ASSERT registeredHostsQuery.enabled == false
    ASSERT hostDirectoryQuery.subscribed == false
    ASSERT sidebarNavigation.disabled == true
  END IF

  IF input.appJustLaunched AND input.removedByUserMarker == true THEN
    ASSERT ui.shows("Reinstall Hukum")
    ASSERT NOT ui.shows("Downloading Hukum Host...")
  END IF
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT fetchRegisteredHostsViaHttp_fixed(input.authnBaseUrl, input.token)
         == fetchRegisteredHostsViaHttp_original(input.authnBaseUrl, input.token)

  ASSERT registeredHostsQuery_fixed.enabled
         == registeredHostsQuery_original.enabled

  ASSERT hostDirectoryQuery_fixed.subscribed
         == hostDirectoryQuery_original.subscribed

  ASSERT sidebarNavigation_fixed.enabled == true
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many valid `authnBaseUrl` strings and token combinations to confirm fetch behavior is unchanged.
- It generates many app states (host running, signed in, various polling cadences) to confirm queries stay enabled.
- It catches edge cases where the URL guard might false-positive (e.g., URLs with unusual schemes, whitespace in path but not base).

**Test Plan**: Observe behavior on UNFIXED code first for valid-URL fetches, normal polling states, and navigation, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Valid URL Fetch Preservation**: For all non-blank `authnBaseUrl` values, verify `fetchRegisteredHostsViaHttp` behaves identically before and after the fix.
2. **Normal Polling Preservation**: For all states where `removedInSession == false`, verify queries remain enabled with original cadence.
3. **Navigation Preservation**: For all states where uninstall has NOT succeeded, verify sidebar navigation is fully interactive.
4. **Reinstall Flow Preservation**: After a successful reinstall (marker cleared), verify polling resumes and host connects normally.

### Unit Tests

- Test `fetchRegisteredHostsViaHttp` with blank, whitespace-only, null-ish `authnBaseUrl` → returns `{ kind: "network-error" }`.
- Test `fetchRegisteredHostsViaHttp` with valid URLs → unchanged behavior.
- Test `useHostRemovalStore` state transitions: initial `false`, after `markRemovedInSession()` → `true`.
- Test `registeredHostsQueryOptions` with `removedInSession: true` → query disabled.
- Test `registeredHostsQueryOptions` with `removedInSession: false` + `signedIn: true` → query enabled (preservation).
- Test navigation lock component renders disabled state when `removedInSession: true`.
- Test relaunch detection: `installedRecord → null` + marker exists → routes to reinstall UI.
- Test relaunch detection: `installedRecord → null` + no marker → routes to install (unchanged behavior for fresh installs).

### Property-Based Tests

- Generate random non-empty URL strings (with valid scheme) and random bearer tokens → verify `fetchRegisteredHostsViaHttp` produces the same result as the original (preservation of fetch semantics).
- Generate random app states with `removedInSession: false` → verify all queries remain enabled and polling cadences match originals.
- Generate random app states with `removedInSession: true` → verify zero outbound host-related requests fire within any simulated time window.
- Generate random `authnBaseUrl` strings including edge cases (whitespace-padded, scheme-only, fragment-only) → verify the guard correctly classifies blank vs. usable.

### Integration Tests

- Full uninstall flow: click "Remove Hukum" → confirm → observe no network errors in console → "Quit Hukum" button visible → sidebar disabled.
- Quit-and-relaunch after uninstall: observe "Reinstall Hukum" UI → click reinstall → host downloads → normal state resumes.
- Normal operation flow: mount app with running host → verify 60s polling → verify sidebar navigation → verify host-scoped panels load (unchanged).
- "Remove from account" flow for a remote host: verify it still works identically, no accidental query disabling.
