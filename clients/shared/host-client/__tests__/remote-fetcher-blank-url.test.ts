import { afterEach, describe, expect, it, vi } from "vitest";
import type { HostListResponse } from "@hukum/protocol/host/host-status";
import { fetchRegisteredHostsViaHttp } from "../remote-fetcher";

/**
 * Bug Condition Exploration Test — Blank URL Guard
 *
 * **Validates: Requirements 1.2, 2.2**
 *
 * This test verifies that `fetchRegisteredHostsViaHttp` returns
 * `{ kind: "network-error" }` for blank/whitespace-only `authnBaseUrl`.
 *
 * Investigation findings:
 *   - `hostsApiUrl("")` calls `new URL("api/v3/hosts", "/")` which throws
 *     TypeError: "Invalid URL". However, this throw happens INSIDE the
 *     `try { response = await fetch(hostsApiUrl(authnBaseUrl), ...) }`
 *     block because `hostsApiUrl()` is evaluated as an argument expression
 *     within the try. The catch block catches it and returns
 *     `{ kind: "network-error" }`.
 *
 *   - The function itself is already graceful for blank URLs.
 *
 *   - The ACTUAL bug loop occurs at a higher layer:
 *     1. `performFetchRegisteredHosts` in auth-service.ts converts
 *        `{ kind: "network-error" }` into a THROW
 *     2. TanStack query catches the throw and retries on its interval
 *     3. The query stays enabled because `signedIn` remains true post-uninstall
 *     4. → Infinite error loop every 60s
 *
 *   - The fix for the error loop is in Task 4 (disable queries after uninstall),
 *     not in the fetch function itself. Task 3's URL guard adds an explicit
 *     early-return for clarity/intent, avoiding the wasteful URL construction
 *     + catch cycle, but is not strictly needed to prevent a crash.
 *
 * This test serves as a regression guard ensuring the blank-URL behavior
 * remains correct (returns network-error, never throws).
 */
describe("fetchRegisteredHostsViaHttp — blank URL guard (bug condition exploration)", () => {
  it("returns { kind: 'network-error' } for an empty authnBaseUrl", async () => {
    const result = await fetchRegisteredHostsViaHttp("", "some-bearer-token");
    expect(result).toEqual({ kind: "network-error" });
  });

  it("returns { kind: 'network-error' } for a whitespace-only authnBaseUrl", async () => {
    const result = await fetchRegisteredHostsViaHttp(
      "   ",
      "some-bearer-token",
    );
    expect(result).toEqual({ kind: "network-error" });
  });
});


/**
 * Preservation Property Tests — Normal Fetch Operation Unchanged
 *
 * **Validates: Requirements 3.1, 3.2**
 *
 * These tests verify that for valid, non-blank `authnBaseUrl` values,
 * `fetchRegisteredHostsViaHttp` continues to behave correctly:
 *  - 200 with valid body → `{ kind: "ok", response: ... }`
 *  - 401 → `{ kind: "unauthorized" }`
 *  - Network throw → `{ kind: "network-error" }`
 *
 * Written on UNFIXED code and expected to PASS, confirming the baseline
 * behavior that the URL guard fix must preserve.
 */

const VALID_AUTHN_BASE_URL = "https://auth.example.com";

function validHostListResponse(): HostListResponse {
  return {
    hosts: [
      {
        hostId: "host-abc",
        displayName: "my-devbox",
        platform: "Linux",
        kind: "personal",
        publicKey: "pk-abc",
        createdAt: "2026-01-15T10:00:00.000Z",
        status: {
          connectivity: "connectable",
          viewerReachability: "unknown",
          clientCloud: "ok",
          updateState: "current",
          appVersion: "2.0.0",
          lastSeenAt: "2026-01-15T12:00:00.000Z",
        },
        updatePolicy: "manual",
      },
    ],
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchRegisteredHostsViaHttp — preservation (normal operation unchanged)", () => {
  it("returns { kind: 'ok', response } for a valid non-blank authnBaseUrl with 200 response", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse(200, validHostListResponse()),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchRegisteredHostsViaHttp(
      VALID_AUTHN_BASE_URL,
      "valid-bearer-token",
    );

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.response.hosts).toHaveLength(1);
      expect(result.response.hosts[0].hostId).toBe("host-abc");
    }

    // Verify fetch was actually called (not short-circuited)
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://auth.example.com/api/v3/hosts");
    expect(init?.method).toBe("GET");
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      "Bearer valid-bearer-token",
    );
  });

  it("returns { kind: 'unauthorized' } for a valid non-blank authnBaseUrl with 401 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () => jsonResponse(401, {})),
    );

    const result = await fetchRegisteredHostsViaHttp(
      VALID_AUTHN_BASE_URL,
      "expired-token",
    );

    expect(result.kind).toBe("unauthorized");
  });

  it("returns { kind: 'network-error' } for a valid non-blank authnBaseUrl when fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>(async () => {
        throw new Error("net::ERR_CONNECTION_REFUSED");
      }),
    );

    const result = await fetchRegisteredHostsViaHttp(
      VALID_AUTHN_BASE_URL,
      "valid-bearer-token",
    );

    expect(result.kind).toBe("network-error");
  });
});
