/**
 * Brain hooks — React Query wrappers for all brain.* RPC methods.
 */

export { useBrainConfig, useBrainRegistry, useBrainTemplates } from "./use-brain-config";
export { useBrainSearch } from "./use-brain-search";
export { useBrainGraph } from "./use-brain-graph";
export { useBrainNote, useBrainWriteNote } from "./use-brain-note";
export { useBrainFolder } from "./use-brain-folder";
export { useBrainSkills, useBrainCreateSkill, useBrainUpdateSkill, useBrainSetSkillEnabled } from "./use-brain-skills";
export { useBrainScaffold, useBrainConnect, useBrainSwitch, useBrainRemove, useBrainRebuildIndex } from "./use-brain-scaffold";
export {
  useBrainAdapters,
  useBrainMountRegistry,
  useBrainMountInspections,
  useBrainCreateAdapter,
  useBrainRegisterWorkspace,
  useBrainAttachSkill,
  useBrainReconcileMounts,
  useBrainDetachSkill,
  useBrainEvidence,
  useBrainSkillCandidates,
  useBrainDistilledEpisodes,
  useBrainLearnedImprovements,
  useBrainProposeSkill,
  useBrainPromoteSkill,
  useBrainRollbackSkill,
  useBrainPolicyDecision,
} from "./use-brain-capabilities";
