/**
 * Brain setup mutation hooks — scaffold a new brain or connect an existing one.
 */

import { useHostScopedMutation } from "@/hooks/host/use-host-scoped-mutation";

/**
 * Scaffold a new brain vault from a template.
 */
export function useBrainScaffold() {
  return useHostScopedMutation<"brain.scaffold">({
    method: "brain.scaffold",
    mutationKey: ["brain", "scaffold"],
    errorMessage: "Failed to create brain vault",
    invalidateMethods: ["brain.getConfig", "brain.getRegistry", "brain.listFolder", "brain.getGraph"],
  });
}

/**
 * Connect an existing vault as a brain.
 */
export function useBrainConnect() {
  return useHostScopedMutation<"brain.connect">({
    method: "brain.connect",
    mutationKey: ["brain", "connect"],
    errorMessage: "Failed to connect brain vault",
    invalidateMethods: ["brain.getConfig", "brain.getRegistry", "brain.listFolder", "brain.getGraph"],
  });
}

/**
 * Switch the active brain in a multi-brain registry.
 * Closes all open workspace-file tabs belonging to the current brain vault
 * before sending the switch RPC.
 */
export function useBrainSwitch() {
  return useHostScopedMutation<"brain.switch">({
    method: "brain.switch",
    mutationKey: ["brain", "switch"],
    errorMessage: "Failed to switch brain",
    invalidateMethods: ["brain.getConfig", "brain.getRegistry", "brain.listFolder", "brain.search", "brain.getGraph", "brain.listSkills"],
  });
}

/**
 * Remove a brain from the registry (does not delete vault files).
 */
export function useBrainRemove() {
  return useHostScopedMutation<"brain.remove">({
    method: "brain.remove",
    mutationKey: ["brain", "remove"],
    errorMessage: "Failed to remove brain",
    invalidateMethods: ["brain.getConfig", "brain.getRegistry"],
  });
}

/**
 * Force-rebuild the brain index.
 */
export function useBrainRebuildIndex() {
  return useHostScopedMutation<"brain.rebuildIndex">({
    method: "brain.rebuildIndex",
    mutationKey: ["brain", "rebuildIndex"],
    errorMessage: "Failed to rebuild brain index",
    invalidateMethods: ["brain.search", "brain.getGraph"],
  });
}
