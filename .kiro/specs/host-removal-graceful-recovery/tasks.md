# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Post-Uninstall Query Silence and Blank URL Guard
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases:
    - `fetchRegisteredHostsViaHttp("", token)` throws instead of returning `{ kind: "network-error" }`
    - `fetchRegisteredHostsViaHttp("   ", token)` throws instead of returning `{ kind: "network-error" }`
    - After uninstall success, `useRegisteredHosts` query remains enabled and refires on interval
    - After uninstall success, sidebar navigation remains interactive (user can leave quit state)
  - Test that `fetchRegisteredHostsViaHttp("", token)` returns `{ kind: "network-error" }` (from Expected Behavior 2.2)
  - Test that `fetchRegisteredHostsViaHttp("   ", token)` returns `{ kind: "network-error" }` (whitespace-only)
  - Test that after uninstall success, registered-hosts query `enabled` becomes `false` (from Expected Behavior 2.1)
  - Test that after uninstall success, navigation is locked (from Expected Behavior 2.4)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found:
    - `fetchRegisteredHostsViaHttp("")` throws TypeError: "Failed to construct 'URL'" or "fetch() URL must not be a blank string"
    - TanStack query remains enabled post-uninstall, generating repeated network errors
    - Sidebar navigation allows re-entry into host-scoped panels after uninstall
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.4, 2.1, 2.2, 2.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Normal Operation Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - **Step 1 — Observe on UNFIXED code:**
    - Observe: `fetchRegisteredHostsViaHttp("https://auth.example.com", "valid-token")` fetches and parses host registry response
    - Observe: `useRegisteredHosts` with `signedIn: true` and no uninstall state → query enabled, polls at 60s
    - Observe: `useHostDirectoryList` with active host → subscribed to directory changes
    - Observe: Sidebar navigation fully interactive when no uninstall has occurred
    - Observe: App launch without removed-by-user marker → enters normal boot/download flow
  - **Step 2 — Write property-based tests capturing observed behavior:**
    - For all non-blank `authnBaseUrl` strings (valid URL scheme), verify `fetchRegisteredHostsViaHttp` makes the fetch call and returns the parsed result (not short-circuited)
    - For all app states where `removedInSession == false` and `signedIn == true`, verify registered-hosts query remains enabled
    - For all app states where uninstall has NOT succeeded, verify sidebar navigation is interactive
    - For app launch with `installedRecord() → null` and NO removed-by-user marker, verify normal install/download flow starts (fresh install behavior unchanged)
  - **Step 3 — Verify tests pass on UNFIXED code**
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix: URL guard in fetchRegisteredHostsViaHttp

  - [x] 3.1 Implement the URL guard
    - In `clients/shared/host-client/remote-fetcher.ts`, add early-return at top of `fetchRegisteredHostsViaHttp`
    - If `authnBaseUrl` is falsy or `authnBaseUrl.trim() === ""`, return `{ kind: "network-error" }` immediately
    - Do not construct URL or call `fetch` for blank/whitespace-only inputs
    - _Bug_Condition: isBugCondition(input) where input.authnBaseUrl.trim() == "" AND input.fetchAttempted == true_
    - _Expected_Behavior: result.kind == "network-error" for blank authnBaseUrl_
    - _Preservation: Non-blank authnBaseUrl calls proceed to fetch as before_
    - _Requirements: 1.2, 2.2, 3.2_

  - [x] 3.2 Verify bug condition exploration test (blank URL cases) now passes
    - **Property 1: Expected Behavior** - Blank URL Guard
    - **IMPORTANT**: Re-run the SAME test from task 1 (blank URL assertions only) - do NOT write a new test
    - The test from task 1 encodes the expected behavior for blank URL inputs
    - When this portion passes, it confirms the URL guard fix is correct
    - **EXPECTED OUTCOME**: Blank URL assertions PASS (confirms guard works)
    - _Requirements: 2.2_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Fetch Semantics Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Confirm valid-URL fetch behavior is unchanged by the guard
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions in fetch layer)

- [x] 4. Fix: Zustand host-removal store and query disabling

  - [x] 4.1 Create the Zustand store
    - Create new file `clients/gui-app/src/stores/host/host-removal-store.ts`
    - Export `useHostRemovalStore` with state: `{ removedInSession: boolean }`
    - Export action: `markRemovedInSession()` that sets `removedInSession` to `true`
    - Store is session-scoped (vanilla Zustand, no persist middleware)
    - _Bug_Condition: isBugCondition(input) where input.removedInSession == true AND input.hostQueriesDisabled == false_
    - _Expected_Behavior: After markRemovedInSession(), all host queries disable_
    - _Requirements: 2.1_

  - [x] 4.2 Wire the store into the uninstall mutation
    - In `clients/gui-app/src/hooks/runner/use-runner-uninstall-hukum-mutation.ts`
    - In `onSuccess` callback, call `useHostRemovalStore.getState().markRemovedInSession()`
    - Also call `queryClient.cancelQueries()` for registered-hosts and host-directory query keys
    - _Requirements: 2.1_

  - [x] 4.3 Gate useRegisteredHosts with removedInSession
    - In `clients/gui-app/src/hooks/auth/use-registered-hosts-query.ts`
    - Read `removedInSession` from `useHostRemovalStore`
    - Update enabled computation: `enabled: signedIn && !removedInSession`
    - Apply to both `useRegisteredHosts` and `useRegisteredHostsPollLiveness`
    - _Bug_Condition: After uninstall, queries must not refire_
    - _Expected_Behavior: registeredHostsQuery.enabled == false when removedInSession == true_
    - _Preservation: When removedInSession == false, enabled == signedIn (unchanged)_
    - _Requirements: 1.1, 2.1, 3.1_

  - [x] 4.4 Gate useHostDirectoryList with removedInSession
    - In `clients/gui-app/src/hooks/host/use-host-directory-list-query.ts`
    - When `removedInSession` is `true`, skip `directory.onChange` subscription
    - Pass null `directoryId` to `useHostPickerList` so it resolves with no data
    - _Requirements: 1.1, 2.1, 3.1_

  - [x] 4.5 Verify bug condition exploration test (post-uninstall query) now passes
    - **Property 1: Expected Behavior** - Post-Uninstall Query Silence
    - **IMPORTANT**: Re-run the SAME test from task 1 (query-disabling assertions) - do NOT write a new test
    - When this portion passes, it confirms queries are disabled after uninstall
    - **EXPECTED OUTCOME**: Query-disable assertions PASS
    - _Requirements: 2.1_

  - [x] 4.6 Verify preservation tests still pass
    - **Property 2: Preservation** - Normal Polling Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Confirm normal polling is unaffected when removedInSession is false
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions in query behavior)

- [x] 5. Fix: Removed-by-user marker and relaunch detection

  - [x] 5.1 Persist removed-by-user marker on uninstall
    - In `clients/desktop/src/electron-main/ipc/host-management-ipc.ts`
    - After host binary removal succeeds, write a marker file (e.g., `~/.hukum/host/dev/.removed-by-user`) or add `removedByUser: true` field to the install-record JSON
    - Expose `removedByUser: boolean` in the `installedRecord()` IPC response
    - _Bug_Condition: isBugCondition(input) where input.appJustLaunched AND input.removedByUserDetected == false (despite prior removal)_
    - _Expected_Behavior: installedRecord() response includes removedByUser flag_
    - _Requirements: 1.3, 2.3_

  - [x] 5.2 Implement relaunch detection in app boot
    - On app start, when `installedRecord()` returns `null` but `removedByUser` marker exists, route to "Reinstall Hukum" view
    - Do NOT enter the download/bootstrap flow
    - Reinstall action clears the marker and enters normal install
    - _Expected_Behavior: ui.shows("Reinstall Hukum") AND NOT ui.shows("Downloading Hukum Host...")_
    - _Preservation: Fresh install (no marker) enters download flow as before_
    - _Requirements: 1.3, 2.3, 3.5_

  - [x] 5.3 Verify relaunch scenario works correctly
    - Manually test or write integration test: simulate app launch with marker present
    - Confirm "Reinstall Hukum" UI appears, not "Downloading Hukum Host..."
    - Confirm reinstall action clears marker and proceeds to normal install
    - _Requirements: 2.3_

- [x] 6. Fix: Navigation lock after uninstall

  - [x] 6.1 Implement navigation lock in sidebar/settings layout
    - In `clients/gui-app/src/components/settings/host-scope/host-danger-zone.tsx` and sidebar layout
    - When `useHostRemovalStore((s) => s.removedInSession)` is `true`:
      - Disable sidebar links (`pointer-events: none` + `opacity` dimming)
      - Guard settings panel router to short-circuit to "Quit Hukum" view
    - Lock is session-scoped — quitting the app is the only exit
    - _Bug_Condition: isBugCondition(input) where input.uninstallSucceeded AND input.navigationAllowed == true_
    - _Expected_Behavior: sidebarNavigation.disabled == true after uninstall success_
    - _Preservation: Navigation fully interactive when removedInSession == false_
    - _Requirements: 1.4, 2.4, 3.1_

  - [x] 6.2 Verify bug condition exploration test (navigation lock) now passes
    - **Property 1: Expected Behavior** - Navigation Lock
    - **IMPORTANT**: Re-run the SAME test from task 1 (navigation assertions) - do NOT write a new test
    - When this portion passes, it confirms navigation is locked after uninstall
    - **EXPECTED OUTCOME**: Navigation lock assertions PASS
    - _Requirements: 2.4_

  - [x] 6.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Navigation Unchanged in Normal State
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Confirm sidebar navigation remains interactive when no uninstall has occurred
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions in navigation)

- [x] 7. Checkpoint - Ensure all tests pass
  - Run the full test suite
  - Verify Property 1 (bug condition exploration test) PASSES on fixed code
  - Verify Property 2 (preservation tests) PASSES on fixed code
  - Verify no other tests have regressed
  - Ensure all tests pass, ask the user if questions arise.
