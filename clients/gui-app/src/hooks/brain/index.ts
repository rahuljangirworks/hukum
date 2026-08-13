/**
 * Brain hooks — React Query wrappers for all brain.* RPC methods.
 */

export { useBrainConfig, useBrainRegistry, useBrainTemplates } from "./use-brain-config";
export { useBrainSearch } from "./use-brain-search";
export { useBrainNote, useBrainWriteNote } from "./use-brain-note";
export { useBrainFolder } from "./use-brain-folder";
export { useBrainSkills, useBrainCreateSkill, useBrainUpdateSkill, useBrainSetSkillEnabled } from "./use-brain-skills";
export { useBrainScaffold, useBrainConnect, useBrainSwitch, useBrainRemove, useBrainRebuildIndex } from "./use-brain-scaffold";
