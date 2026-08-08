import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { useRunnerHost } from "@/providers/use-runner-host";
import { runnerMutationKeys, runnerQueryKeys } from "@/lib/query-keys";
import { toastFromRunnerError } from "@/lib/runner-error-toast";

interface DeleteEnvOverrideInput {
  readonly key: string;
}

/**
 * Removes a single env override row. The next host bootstrap will no
 * longer set that variable (and so the user's shell-resolved value, if
 * any, takes effect again).
 */
export function useRunnerHukumEnvOverrideDeleteMutation(): UseMutationResult<
  void,
  Error,
  DeleteEnvOverrideInput
> {
  const runnerHost = useRunnerHost();
  const queryClient = useQueryClient();
  const hukumCli = runnerHost.hukumCli;
  return useMutation<void, Error, DeleteEnvOverrideInput>({
    mutationKey: runnerMutationKeys.hukumEnvOverrideDelete(),
    mutationFn: (input) => {
      if (hukumCli === null) {
        return Promise.reject(
          new Error("hukumCli unavailable on this runner host"),
        );
      }
      return hukumCli.envOverrideDelete(input);
    },
    onSuccess: () => {
      if (hukumCli === null) return;
      void queryClient.invalidateQueries({
        queryKey: runnerQueryKeys.hukumEnvOverrideList(hukumCli),
      });
    },
    onError: (error) => {
      toastFromRunnerError(error, "Failed to delete env override");
    },
  });
}
