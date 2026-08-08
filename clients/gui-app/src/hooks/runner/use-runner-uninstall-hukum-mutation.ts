import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import type { HukumUninstallResult } from "@hukum-clients/shared/platform/runner-host";
import { useRunnerHost } from "@/providers/use-runner-host";
import { runnerMutationKeys } from "@/lib/query-keys";
import { toastFromRunnerError } from "@/lib/runner-error-toast";

/**
 * In-app "Remove Hukum" (Settings → General → Danger Zone). Stops + removes
 * the host service, host install, and (on macOS) the SMAppService login item,
 * and marks the device removed-by-user so the host is not auto-reinstalled
 * when it goes unreachable. All `~/.hukum` user data is preserved.
 *
 * Returns the raw mutation result so the Danger Zone can drive `isPending`
 * and switch to its success/quit state from `isSuccess`.
 */
export function useRunnerUninstallHukum(): UseMutationResult<
  HukumUninstallResult,
  Error,
  void
> {
  const { hostManagement } = useRunnerHost();
  return useMutation<HukumUninstallResult>({
    mutationKey: runnerMutationKeys.uninstallHukum(),
    mutationFn: () => {
      if (hostManagement === null) {
        return Promise.reject(
          new Error("Removing Hukum is not available on this platform."),
        );
      }
      return hostManagement.uninstallHukum();
    },
    onError: (error) =>
      toastFromRunnerError(error, "Couldn't remove Hukum's components."),
  });
}
