import {
  queryOptions,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import type {
  IHukumCli,
  HukumEnvOverride,
} from "@hukum-clients/shared/platform/runner-host";
import { useRunnerHost } from "@/providers/use-runner-host";
import { runnerQueryKeys } from "@/lib/query-keys";

function hukumEnvOverrideListQueryOptions(hukumCli: IHukumCli | null) {
  return queryOptions<readonly HukumEnvOverride[]>({
    queryKey:
      hukumCli !== null
        ? runnerQueryKeys.hukumEnvOverrideList(hukumCli)
        : ["runner.hukum.envOverrideList", "disabled"],
    queryFn: () => {
      if (hukumCli === null) {
        throw new Error("hukumCli unavailable on this runner host");
      }
      return hukumCli.envOverrideList();
    },
    enabled: hukumCli !== null,
  });
}

/**
 * Reads all env overrides through `hukum config env list`. Powers the
 * env table in Settings → Shell & environment.
 */
export function useRunnerHukumEnvOverrideListQuery(): UseQueryResult<
  readonly HukumEnvOverride[]
> {
  const runnerHost = useRunnerHost();
  return useQuery(hukumEnvOverrideListQueryOptions(runnerHost.hukumCli));
}
