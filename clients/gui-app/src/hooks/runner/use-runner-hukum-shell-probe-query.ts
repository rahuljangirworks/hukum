import {
  queryOptions,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import type {
  IHukumCli,
  HukumShellProbeResult,
} from "@hukum-clients/shared/platform/runner-host";
import { useRunnerHost } from "@/providers/use-runner-host";
import { runnerQueryKeys } from "@/lib/query-keys";

export function hukumShellProbeQueryOptions(
  hukumCli: IHukumCli | null,
  path: string,
  enabled: boolean,
) {
  return queryOptions<HukumShellProbeResult>({
    queryKey:
      hukumCli !== null
        ? runnerQueryKeys.hukumShellProbe(hukumCli, path)
        : ["runner.hukum.shellProbe", "disabled", path],
    queryFn: () => {
      if (hukumCli === null) {
        throw new Error("hukumCli unavailable on this runner host");
      }
      return hukumCli.shellProbe({ path });
    },
    enabled: enabled && hukumCli !== null,
    // A given path's existence/executability doesn't change under the user's
    // feet mid-session, so cache the answer and never refetch on focus.
    staleTime: Number.POSITIVE_INFINITY,
  });
}

/**
 * Probes whether `path` exists and is executable, backing the picker's live
 * "Add a shell" validation. The caller passes the already-debounced path and an
 * `enabled` gate (only absolute, non-empty paths are worth probing). Disabled
 * when `hukumCli === null` (mobile/web hosts).
 */
export function useRunnerHukumShellProbeQuery(input: {
  readonly path: string;
  readonly enabled: boolean;
}): UseQueryResult<HukumShellProbeResult> {
  const runnerHost = useRunnerHost();
  return useQuery(
    hukumShellProbeQueryOptions(
      runnerHost.hukumCli,
      input.path,
      input.enabled,
    ),
  );
}
