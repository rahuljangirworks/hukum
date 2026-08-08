import {
  queryOptions,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import type {
  IHukumCli,
  HukumShellConfig,
} from "@hukum-clients/shared/platform/runner-host";
import { useRunnerHost } from "@/providers/use-runner-host";
import { runnerQueryKeys } from "@/lib/query-keys";

function hukumShellConfigQueryOptions(hukumCli: IHukumCli | null) {
  return queryOptions<HukumShellConfig>({
    queryKey:
      hukumCli !== null
        ? runnerQueryKeys.hukumShellConfig(hukumCli)
        : ["runner.hukum.shellConfig", "disabled"],
    queryFn: () => {
      if (hukumCli === null) {
        throw new Error("hukumCli unavailable on this runner host");
      }
      return hukumCli.shellConfigGet();
    },
    enabled: hukumCli !== null,
  });
}

/**
 * Reads the effective shell config (path + args + synthesised flag) through
 * `hukum config shell get`. Drives the Settings → Shell & environment form
 * and the bootstrap-failure card's "shell that was attempted" line.
 *
 * Disabled when `hukumCli === null`.
 */
export function useRunnerHukumShellConfigQuery(): UseQueryResult<HukumShellConfig> {
  const runnerHost = useRunnerHost();
  return useQuery(hukumShellConfigQueryOptions(runnerHost.hukumCli));
}
