import {
  queryOptions,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import type {
  IHukumCli,
  HukumDetectedShell,
} from "@hukum-clients/shared/platform/runner-host";
import { useRunnerHost } from "@/providers/use-runner-host";
import { runnerQueryKeys } from "@/lib/query-keys";

function hukumShellListQueryOptions(hukumCli: IHukumCli | null) {
  return queryOptions<readonly HukumDetectedShell[]>({
    queryKey:
      hukumCli !== null
        ? runnerQueryKeys.hukumShellList(hukumCli)
        : ["runner.hukum.shellList", "disabled"],
    queryFn: () => {
      if (hukumCli === null) {
        throw new Error("hukumCli unavailable on this runner host");
      }
      return hukumCli.shellListDetected();
    },
    enabled: hukumCli !== null,
    // Installed shells change rarely; cache for the session. The combobox
    // always accepts a typed custom path, so a stale or empty list is benign.
    staleTime: Number.POSITIVE_INFINITY,
  });
}

/**
 * Lists shells detected on this machine (`hukum config shell list`) to
 * populate the Settings → Shell quick-picks. Disabled when
 * `hukumCli === null` (mobile/web hosts).
 */
export function useRunnerHukumShellListQuery(): UseQueryResult<
  readonly HukumDetectedShell[]
> {
  const runnerHost = useRunnerHost();
  return useQuery(hukumShellListQueryOptions(runnerHost.hukumCli));
}
