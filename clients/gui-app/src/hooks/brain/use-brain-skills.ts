/**
 * Brain skill hooks — list, create, update, and toggle skills.
 */

import type { UseQueryResult } from "@tanstack/react-query";
import type {
  HostRpcError,
  ResponseOfMethod,
} from "@hukum-clients/shared/host-transport/host-messenger";
import { useHostClient, type HostRpcRegistry } from "@/lib/host";
import { useHostQuery } from "@/hooks/host/use-host-query";
import { useHostScopedMutation } from "@/hooks/host/use-host-scoped-mutation";

/**
 * List all brain skills (enabled and disabled).
 */
export function useBrainSkills(): UseQueryResult<
  ResponseOfMethod<HostRpcRegistry, "brain.listSkills">,
  HostRpcError
> {
  const client = useHostClient();
  return useHostQuery<HostRpcRegistry, "brain.listSkills">({
    client,
    method: "brain.listSkills",
    params: {},
    cacheKeyIdentity: undefined,
    options: null,
  });
}

/**
 * Create a new brain skill.
 */
export function useBrainCreateSkill() {
  return useHostScopedMutation<"brain.createSkill">({
    method: "brain.createSkill",
    mutationKey: ["brain", "createSkill"],
    errorMessage: "Failed to create skill",
    invalidateMethods: ["brain.listSkills"],
  });
}

/**
 * Update an existing brain skill's content.
 */
export function useBrainUpdateSkill() {
  return useHostScopedMutation<"brain.updateSkill">({
    method: "brain.updateSkill",
    mutationKey: ["brain", "updateSkill"],
    errorMessage: "Failed to update skill",
    invalidateMethods: ["brain.listSkills"],
  });
}

/**
 * Enable or disable a brain skill.
 */
export function useBrainSetSkillEnabled() {
  return useHostScopedMutation<"brain.setSkillEnabled">({
    method: "brain.setSkillEnabled",
    mutationKey: ["brain", "setSkillEnabled"],
    errorMessage: "Failed to toggle skill",
    invalidateMethods: ["brain.listSkills"],
  });
}
