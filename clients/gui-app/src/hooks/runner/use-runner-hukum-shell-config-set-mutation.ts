import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import type { HukumShellConfigSetInput } from "@hukum-clients/shared/platform/runner-host";
import { useRunnerHost } from "@/providers/use-runner-host";
import { runnerMutationKeys, runnerQueryKeys } from "@/lib/query-keys";
import { toastFromRunnerError } from "@/lib/runner-error-toast";

/**
 * Updates the stored shell config. Either field may be `null` to preserve
 * the existing stored value (or fall back to the synthesised default). On
 * success, invalidates `hukumShellConfig` so the form reflects the
 * new value; the new host process picks it up on its next start.
 */
export function useRunnerHukumShellConfigSetMutation(): UseMutationResult<
  void,
  Error,
  HukumShellConfigSetInput
> {
  const runnerHost = useRunnerHost();
  const queryClient = useQueryClient();
  const hukumCli = runnerHost.hukumCli;
  return useMutation<void, Error, HukumShellConfigSetInput>({
    mutationKey: runnerMutationKeys.hukumShellConfigSet(),
    mutationFn: (input) => {
      if (hukumCli === null) {
        return Promise.reject(
          new Error("hukumCli unavailable on this runner host"),
        );
      }
      return hukumCli.shellConfigSet(input);
    },
    onSuccess: () => {
      if (hukumCli === null) return;
      void queryClient.invalidateQueries({
        queryKey: runnerQueryKeys.hukumShellConfig(hukumCli),
      });
    },
    onError: (error) => {
      toastFromRunnerError(error, "Failed to update shell config");
    },
  });
}
