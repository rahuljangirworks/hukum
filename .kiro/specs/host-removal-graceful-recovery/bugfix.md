# Bugfix Requirements Document

## Introduction

After clicking "Remove Hukum" in Settings > Overview > Danger Zone, the desktop client enters a broken error-loop state. The uninstall succeeds (host binary removed from `~/.hukum/host/dev/install/`), but the client continues polling for host registry and directory data. In dev environments the auth server may no longer be running, causing `hostsApiUrl()` to construct a fetch against a blank or unreachable URL. The result is a repeating "host registry: GET failed after 6 attempts: fetch() URL must not be a blank string" error. On next launch the client shows "Downloading Hukum Host..." stuck at 0% with no way to recover.

The fix must stop host-related polling after uninstall, guard against blank/invalid auth URLs in the fetch layer, present a clean reinstall UI on next launch when the host was removed by the user, and prevent navigation away from the post-uninstall quit state.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the user completes "Remove Hukum" uninstall THEN the system continues polling `useRegisteredHosts()` and `useHostDirectoryList()`, generating repeated network errors because the host binary and potentially the local auth server are gone

1.2 WHEN `fetchRegisteredHostsViaHttp()` is called with a blank or empty `authnBaseUrl` THEN the system throws an unhandled "fetch() URL must not be a blank string" error instead of failing gracefully

1.3 WHEN the app is relaunched after the host was removed by the user THEN the system shows "Downloading Hukum Host..." at 0% progress and enters an error loop attempting to re-download via broken auth, with no way for the user to recover

1.4 WHEN the uninstall succeeds and the "Quit Hukum" button is shown THEN the system allows the user to navigate away from the post-uninstall state (e.g. switching Settings panels), re-entering the broken polling loop

### Expected Behavior (Correct)

2.1 WHEN the user completes "Remove Hukum" uninstall THEN the system SHALL immediately invalidate and disable all host-related queries (registered hosts, host directory, host RPC) so no further polling occurs for the remainder of the session

2.2 WHEN `fetchRegisteredHostsViaHttp()` is called with a blank, empty, or otherwise invalid `authnBaseUrl` THEN the system SHALL return a `{ kind: "network-error" }` result without attempting the fetch, preventing unhandled exceptions

2.3 WHEN the app is launched and detects a "removed-by-user" state (host previously uninstalled via the danger zone) THEN the system SHALL display a clean "Reinstall Hukum" UI that allows the user to reinstall or quit, without entering any download/polling loop

2.4 WHEN the uninstall succeeds and the post-uninstall confirmation is shown THEN the system SHALL prevent navigation away from the quit/restart state (disable sidebar navigation, panel switching) so the user must either quit or explicitly dismiss the state

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the host is running normally and the user has not triggered uninstall THEN the system SHALL CONTINUE TO poll registered hosts and host directory on their configured intervals (60s liveness, refetch on window focus)

3.2 WHEN `fetchRegisteredHostsViaHttp()` is called with a valid `authnBaseUrl` and valid bearer token THEN the system SHALL CONTINUE TO fetch and return the host registry response as before

3.3 WHEN the user installs or reinstalls the host successfully THEN the system SHALL CONTINUE TO resume normal polling, connect to the host, and show the host as online

3.4 WHEN the user uses "Remove from account" (the remote deregister verb for non-local hosts) THEN the system SHALL CONTINUE TO behave as it does today — this fix does not alter the remote removal flow

3.5 WHEN the user quits and relaunches the app without having removed the host THEN the system SHALL CONTINUE TO start normally, connect to the host, and show the standard UI
