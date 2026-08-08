import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { useRunnerHost } from "@/providers/use-runner-host";
import { runnerMutationKeys, runnerQueryKeys } from "@/lib/query-keys";
import { toastFromRunnerError } from "@/lib/runner-error-toast";

/**
 * Returns to the system default by clearing only the selection; remembered
 * shells and their flags are kept (the login shell's entry is inherited). Only
 * the shell config changes, so just that query is invalidated.
 */
export function useRunnerHukumShellConfigResetMutation(): UseMutationResult<
  void,
  Error,
  void
> {
  const runnerHost = useRunnerHost();
  const queryClient = useQueryClient();
  const hukumCli = runnerHost.hukumCli;
  return useMutation<void>({
    mutationKey: runnerMutationKeys.hukumShellConfigReset(),
    mutationFn: () => {
      if (hukumCli === null) {
        return Promise.reject(
          new Error("hukumCli unavailable on this runner host"),
        );
      }
      return hukumCli.shellConfigReset();
    },
    onSuccess: () => {
      if (hukumCli === null) return;
      void queryClient.invalidateQueries({
        queryKey: runnerQueryKeys.hukumShellConfig(hukumCli),
      });
    },
    onError: (error) => {
      toastFromRunnerError(error, "Failed to reset shell config");
    },
  });
}
