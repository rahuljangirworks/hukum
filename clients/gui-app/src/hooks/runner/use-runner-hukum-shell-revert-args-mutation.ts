import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import type { IHukumCli } from "@hukum-clients/shared/platform/runner-host";
import { useRunnerHost } from "@/providers/use-runner-host";
import { runnerMutationKeys, runnerQueryKeys } from "@/lib/query-keys";
import { toastFromRunnerError } from "@/lib/runner-error-toast";

/**
 * Restores a remembered shell's flags to its family default
 * (`hukum config shell revert-args`) by clearing its stored deviation while
 * keeping the shell remembered. On success, invalidates both the shell config
 * (the selected shell's flags re-materialise to the default) and the shell list
 * (the row is retained but its state may have changed).
 */
export function useRunnerHukumShellRevertArgsMutation(): UseMutationResult<
  void,
  Error,
  { readonly path: string },
  { readonly hukumCli: IHukumCli | null }
> {
  const runnerHost = useRunnerHost();
  const queryClient = useQueryClient();
  const hukumCli = runnerHost.hukumCli;
  return useMutation<
    void,
    Error,
    { readonly path: string },
    { readonly hukumCli: IHukumCli | null }
  >({
    mutationKey: runnerMutationKeys.hukumShellRevertArgs(),
    mutationFn: (input) => {
      if (hukumCli === null) {
        return Promise.reject(
          new Error("hukumCli unavailable on this runner host"),
        );
      }
      return hukumCli.shellRevertArgs(input);
    },
    onMutate: () => ({ hukumCli }),
    onSuccess: (_data, _variables, mutationContext) => {
      const mutationClient = mutationContext.hukumCli;
      if (mutationClient === null) return;
      void queryClient.invalidateQueries({
        queryKey: runnerQueryKeys.hukumShellConfig(mutationClient),
      });
      void queryClient.invalidateQueries({
        queryKey: runnerQueryKeys.hukumShellList(mutationClient),
      });
    },
    onError: (error) => {
      toastFromRunnerError(error, "Failed to restore default flags");
    },
  });
}
