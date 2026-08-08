import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { useRunnerHost } from "@/providers/use-runner-host";
import { runnerMutationKeys, runnerQueryKeys } from "@/lib/query-keys";
import { toastFromRunnerError } from "@/lib/runner-error-toast";

/**
 * Remembers a program in the shell picker's list and selects it
 * (`hukum config shell add`). The backend re-validates the path is absolute
 * and executable, so callers should gate on the probe first. On success,
 * invalidates both the shell config (the new selection) and the shell list (the
 * newly-remembered row).
 */
export function useRunnerHukumShellConfigAddMutation(): UseMutationResult<
  void,
  Error,
  { readonly path: string }
> {
  const runnerHost = useRunnerHost();
  const queryClient = useQueryClient();
  const hukumCli = runnerHost.hukumCli;
  return useMutation<void, Error, { readonly path: string }>({
    mutationKey: runnerMutationKeys.hukumShellConfigAdd(),
    mutationFn: (input) => {
      if (hukumCli === null) {
        return Promise.reject(
          new Error("hukumCli unavailable on this runner host"),
        );
      }
      return hukumCli.shellConfigAdd(input);
    },
    onSuccess: () => {
      if (hukumCli === null) return;
      void queryClient.invalidateQueries({
        queryKey: runnerQueryKeys.hukumShellConfig(hukumCli),
      });
      void queryClient.invalidateQueries({
        queryKey: runnerQueryKeys.hukumShellList(hukumCli),
      });
    },
    onError: (error) => {
      toastFromRunnerError(error, "Failed to add shell");
    },
  });
}
