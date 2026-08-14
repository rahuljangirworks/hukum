import type { UseQueryResult } from "@tanstack/react-query";
import type {
  HostRpcError,
  ResponseOfMethod,
} from "@hukum-clients/shared/host-transport/host-messenger";
import { useHostClient, type HostRpcRegistry } from "@/lib/host";
import { useHostQuery } from "@/hooks/host/use-host-query";
import { useHostScopedMutation } from "@/hooks/host/use-host-scoped-mutation";

export function useBrainAdapters(): UseQueryResult<
  ResponseOfMethod<HostRpcRegistry, "brain.adapters.list">,
  HostRpcError
> {
  const client = useHostClient();
  return useHostQuery<HostRpcRegistry, "brain.adapters.list">({
    client,
    method: "brain.adapters.list",
    params: {},
    cacheKeyIdentity: undefined,
    options: null,
  });
}

export function useBrainMountRegistry(): UseQueryResult<
  ResponseOfMethod<HostRpcRegistry, "brain.mounts.getRegistry">,
  HostRpcError
> {
  const client = useHostClient();
  return useHostQuery<HostRpcRegistry, "brain.mounts.getRegistry">({
    client,
    method: "brain.mounts.getRegistry",
    params: {},
    cacheKeyIdentity: undefined,
    options: null,
  });
}

export function useBrainMountInspections(): UseQueryResult<
  ResponseOfMethod<HostRpcRegistry, "brain.mounts.inspect">,
  HostRpcError
> {
  const client = useHostClient();
  return useHostQuery<HostRpcRegistry, "brain.mounts.inspect">({
    client,
    method: "brain.mounts.inspect",
    params: {},
    cacheKeyIdentity: undefined,
    options: null,
  });
}

export function useBrainCreateAdapter() {
  return useHostScopedMutation<"brain.adapters.create">({
    method: "brain.adapters.create",
    mutationKey: ["brain", "adapters", "create"],
    errorMessage: "Failed to create Brain adapter",
    invalidateMethods: ["brain.adapters.list"],
  });
}

export function useBrainRegisterWorkspace() {
  return useHostScopedMutation<"brain.mounts.registerWorkspace">({
    method: "brain.mounts.registerWorkspace",
    mutationKey: ["brain", "mounts", "registerWorkspace"],
    errorMessage: "Failed to register Brain folder",
    invalidateMethods: ["brain.mounts.getRegistry", "brain.mounts.inspect"],
  });
}

export function useBrainAttachSkill() {
  return useHostScopedMutation<"brain.mounts.attachSkill">({
    method: "brain.mounts.attachSkill",
    mutationKey: ["brain", "mounts", "attachSkill"],
    errorMessage: "Failed to attach Brain skill",
    invalidateMethods: ["brain.mounts.getRegistry", "brain.mounts.inspect"],
  });
}

export function useBrainReconcileMounts() {
  return useHostScopedMutation<"brain.mounts.reconcile">({
    method: "brain.mounts.reconcile",
    mutationKey: ["brain", "mounts", "reconcile"],
    errorMessage: "Failed to reconcile Brain links",
    invalidateMethods: ["brain.mounts.getRegistry", "brain.mounts.inspect"],
  });
}

export function useBrainDetachSkill() {
  return useHostScopedMutation<"brain.mounts.detachSkill">({
    method: "brain.mounts.detachSkill",
    mutationKey: ["brain", "mounts", "detachSkill"],
    errorMessage: "Failed to detach Brain skill",
    invalidateMethods: ["brain.mounts.getRegistry", "brain.mounts.inspect"],
  });
}

export function useBrainEvidence(skillId: string) {
  const client = useHostClient();
  return useHostQuery<HostRpcRegistry, "brain.evolution.getEvidence">({
    client,
    method: "brain.evolution.getEvidence",
    params: { subjectType: "skill", subjectId: skillId },
    cacheKeyIdentity: undefined,
    options: { enabled: skillId.trim().length > 0 },
  });
}

export function useBrainSkillCandidates(): UseQueryResult<
  ResponseOfMethod<HostRpcRegistry, "brain.evolution.listCandidates">,
  HostRpcError
> {
  const client = useHostClient();
  return useHostQuery<HostRpcRegistry, "brain.evolution.listCandidates">({
    client,
    method: "brain.evolution.listCandidates",
    params: {},
    cacheKeyIdentity: undefined,
    options: null,
  });
}

export function useBrainDistilledEpisodes(): UseQueryResult<
  ResponseOfMethod<HostRpcRegistry, "brain.evolution.listEpisodes">,
  HostRpcError
> {
  const client = useHostClient();
  return useHostQuery<HostRpcRegistry, "brain.evolution.listEpisodes">({
    client,
    method: "brain.evolution.listEpisodes",
    params: { limit: 50 },
    cacheKeyIdentity: undefined,
    options: null,
  });
}

export function useBrainLearnedImprovements(): UseQueryResult<
  ResponseOfMethod<HostRpcRegistry, "brain.evolution.listImprovements">,
  HostRpcError
> {
  const client = useHostClient();
  return useHostQuery<HostRpcRegistry, "brain.evolution.listImprovements">({
    client,
    method: "brain.evolution.listImprovements",
    params: { limit: 50 },
    cacheKeyIdentity: undefined,
    options: null,
  });
}

export function useBrainProposeSkill() {
  return useHostScopedMutation<"brain.evolution.proposeSkill">({
    method: "brain.evolution.proposeSkill",
    mutationKey: ["brain", "evolution", "proposeSkill"],
    errorMessage: "Failed to save Brain skill candidate",
    invalidateMethods: ["brain.evolution.getEvidence", "brain.evolution.listCandidates"],
  });
}

export function useBrainPromoteSkill() {
  return useHostScopedMutation<"brain.evolution.promoteSkill">({
    method: "brain.evolution.promoteSkill",
    mutationKey: ["brain", "evolution", "promoteSkill"],
    errorMessage: "Failed to promote Brain skill",
    invalidateMethods: ["brain.listSkills", "brain.evolution.getEvidence", "brain.evolution.listCandidates", "brain.mounts.inspect"],
  });
}

export function useBrainRollbackSkill() {
  return useHostScopedMutation<"brain.evolution.rollbackSkill">({
    method: "brain.evolution.rollbackSkill",
    mutationKey: ["brain", "evolution", "rollbackSkill"],
    errorMessage: "Failed to roll back Brain skill",
    invalidateMethods: ["brain.listSkills", "brain.evolution.getEvidence", "brain.evolution.listCandidates", "brain.mounts.inspect"],
  });
}

export function useBrainPolicyDecision() {
  return useHostScopedMutation<"brain.policy.decideAction">({
    method: "brain.policy.decideAction",
    mutationKey: ["brain", "policy", "decideAction"],
    errorMessage: "Failed to evaluate Brain action policy",
    invalidateMethods: [],
  });
}
