import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { useRunnerHost } from "@/providers/use-runner-host";
import { runnerMutationKeys, runnerQueryKeys } from "@/lib/query-keys";
import { toastFromRunnerError } from "@/lib/runner-error-toast";

/**
 * Forgets a previously-added shell (`hukum config shell remove`). The backend
 * falls back to the OS default when the removed shell was the current
 * selection, so on success this invalidates both the shell config and the shell
 * list; the picker stays open and refreshes in place.
 */
export function useRunnerHukumShellConfigRemoveMutation(): UseMutationResult<
  void,
  Error,
  { readonly path: string }
> {
  const runnerHost = useRunnerHost();
  const queryClient = useQueryClient();
  const hukumCli = runnerHost.hukumCli;
  return useMutation<void, Error, { readonly path: string }>({
    mutationKey: runnerMutationKeys.hukumShellConfigRemove(),
    mutationFn: (input) => {
      if (hukumCli === null) {
        return Promise.reject(
          new Error("hukumCli unavailable on this runner host"),
        );
      }
      return hukumCli.shellConfigRemove(input);
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
      toastFromRunnerError(error, "Failed to remove shell");
    },
  });
}
