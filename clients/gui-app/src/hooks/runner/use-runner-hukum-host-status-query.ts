import {
  queryOptions,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import type {
  IHukumCli,
  HukumHostStatusSnapshot,
} from "@hukum-clients/shared/platform/runner-host";
import { useRunnerHost } from "@/providers/use-runner-host";
import { runnerQueryKeys } from "@/lib/query-keys";

export interface UseRunnerHukumHostStatusQueryOptions {
  /**
   * Refetch interval in ms while the query is mounted. `null` disables
   * polling (default - used by the failure card so it doesn't keep
   * re-fetching while the user reads it). The loading screen passes a
   * short interval so the bootstrap.log tail stays fresh while the
   * host is starting up.
   */
  readonly pollIntervalMs: number | null;
}

function hukumHostStatusQueryOptions(
  hukumCli: IHukumCli | null,
  pollIntervalMs: number | null,
) {
  return queryOptions<HukumHostStatusSnapshot>({
    queryKey:
      hukumCli !== null
        ? runnerQueryKeys.hukumHostStatus(hukumCli)
        : ["runner.hukum.hostStatus", "disabled"],
    queryFn: () => {
      if (hukumCli === null) {
        throw new Error("hukumCli unavailable on this runner host");
      }
      return hukumCli.hostStatus();
    },
    enabled: hukumCli !== null,
    // Bootstrap state changes only on host (re)spawn or as bootstrap.log
    // gets new lines. With pollIntervalMs set, refetchInterval drives
    // freshness. Without it, callers get the cached value until next
    // explicit invalidate.
    staleTime: pollIntervalMs !== null ? 0 : 30_000,
    refetchInterval: pollIntervalMs ?? false,
  });
}

/**
 * Reads `hukum host status` through the runner-host CLI bridge. Host-
 * independent: works whether the host is up, starting, or wedged.
 * Consumers:
 *   - `LocalHostLoadingContent` - polls while the host-ready gate is in
 *     `loading` / `slow` so the live bootstrap.log tail and recent markers
 *     stay fresh.
 *   - `LocalHostUnavailable` (failure card) - single read; the renderer
 *     stops driving updates while the user reads the diagnostics.
 *
 * Disabled on shells without a CLI (mobile, web) - `hukumCli === null`.
 */
export function useRunnerHukumHostStatusQuery(
  opts: UseRunnerHukumHostStatusQueryOptions,
): UseQueryResult<HukumHostStatusSnapshot> {
  const runnerHost = useRunnerHost();
  return useQuery(
    hukumHostStatusQueryOptions(runnerHost.hukumCli, opts.pollIntervalMs),
  );
}
