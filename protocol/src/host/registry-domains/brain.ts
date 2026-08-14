/** Brain RPC domain: the only source of Brain contracts and registry entries. */

import { z } from "zod";
import { defineRpcContract } from "@hukum/protocol/framework/index";

const okSchema = z.object({ ok: z.literal(true) });
const brainEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  vaultPath: z.string(),
  template: z.string(),
  createdAt: z.string(),
});
const brainSkillSchema = z.object({
  name: z.string(),
  path: z.string(),
  scope: z.string(),
  lineCount: z.number(),
  enabled: z.boolean(),
  updatedAt: z.string(),
  overLimit: z.boolean(),
});
const brainAdapterSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  kind: z.literal("skill-directory"),
  mountPath: z.string(),
  entryFile: z.literal("SKILL.md"),
  updatedAt: z.string(),
  format: z.enum(["package", "legacy-flat"]),
});
const brainMountWorkspaceSchema = z.object({
  id: z.string(),
  rootPath: z.string(),
  adapterId: z.string(),
  skillIds: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});
const brainMountRecordSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  adapterId: z.string(),
  skillId: z.string(),
  sourcePath: z.string(),
  linkPath: z.string(),
  createdAt: z.string(),
  verifiedAt: z.string(),
});
const brainMountInspectionSchema = brainMountRecordSchema.extend({
  status: z.enum(["healthy", "missing", "drifted", "source-missing", "conflict"]),
  reason: z.string().optional(),
});
const brainEvidenceSchema = z.object({
  id: z.string(),
  subjectType: z.enum(["skill", "memory", "meta-memory", "adapter", "policy"]),
  subjectId: z.string(),
  sessionId: z.string(),
  outcome: z.enum(["success", "failure", "user-correction", "contradiction"]),
  validated: z.boolean(),
  validationCoverage: z.number(),
  similarity: z.number(),
  summary: z.string(),
  createdAt: z.string(),
});
const brainEvidenceSummarySchema = z.object({
  successes: z.number(),
  failures: z.number(),
  userCorrections: z.number(),
  validationCoverage: z.number(),
  similarity: z.number(),
  recency: z.number(),
  contradictions: z.number(),
});
const brainEvolutionStageSchema = z.enum([
  "observation", "candidate", "validated", "promoted", "quarantined", "deprecated",
]);
const brainSkillCandidateSchema = z.object({
  id: z.string(),
  skillId: z.string(),
  content: z.string(),
  evidenceIds: z.array(z.string()),
  sourceSessionIds: z.array(z.string()),
  stage: brainEvolutionStageSchema,
  confidence: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  promotedRevisionId: z.string().nullable(),
});
const brainDistilledEpisodeSchema = z.object({
  version: z.literal(1),
  sessionId: z.string(),
  patternId: z.string().nullable(),
  intentSummary: z.string(),
  actionSequence: z.array(z.string()),
  failedActions: z.array(z.string()),
  outcome: z.enum(["success", "failure"]),
  validated: z.boolean(),
  validationCoverage: z.number(),
  createdAt: z.string(),
});
const brainLearnedImprovementSchema = z.object({
  id: z.string(),
  kind: z.enum(["memory-saved", "user-correction", "repeated-failure", "candidate-created", "skill-promoted", "skill-quarantined"]),
  status: z.enum(["learned", "needs-review", "candidate", "validated", "promoted", "quarantined"]),
  title: z.string(),
  summary: z.string(),
  confidence: z.number().nullable(),
  sourceSessionCount: z.number().int().min(1),
  createdAt: z.string(),
});
const brainGraphNodeSchema = z.object({
  id: z.string(),
  path: z.string(),
  title: z.string(),
  folder: z.string(),
  modifiedAt: z.number(),
  incomingCount: z.number().int().nonnegative(),
  outgoingCount: z.number().int().nonnegative(),
  isRoot: z.boolean(),
});
const brainGraphEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  isEmbed: z.boolean(),
});

export const brainScaffoldV10 = defineRpcContract({
  method: "brain.scaffold", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({ parentDir: z.string(), vaultName: z.string(), template: z.string() }),
  responseSchema: z.object({ vaultPath: z.string(), createdDirs: z.array(z.string()), createdFiles: z.array(z.string()) }),
});
export const brainConnectV10 = defineRpcContract({
  method: "brain.connect", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({ vaultPath: z.string() }),
  responseSchema: z.object({ vaultPath: z.string(), noteCount: z.number(), hasObsidianConfig: z.boolean() }),
});
export const brainGetRegistryV10 = defineRpcContract({
  method: "brain.getRegistry", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({}), responseSchema: z.object({ brains: z.array(brainEntrySchema), activeBrainId: z.string().nullable() }),
});
export const brainSwitchV10 = defineRpcContract({
  method: "brain.switch", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({ brainId: z.string() }), responseSchema: okSchema,
});
export const brainRemoveV10 = defineRpcContract({
  method: "brain.remove", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({ brainId: z.string() }), responseSchema: okSchema.extend({ remainingCount: z.number() }),
});
export const brainGetConfigV10 = defineRpcContract({
  method: "brain.getConfig", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({}),
  responseSchema: z.object({ config: z.object({
    vaultPath: z.string(), template: z.string(), createdAt: z.string(), agentContextFiles: z.array(z.string()),
    contextTokenBudget: z.number(), watchEnabled: z.boolean(), sync: z.unknown().nullable(),
  }).nullable() }),
});
export const brainListTemplatesV10 = defineRpcContract({
  method: "brain.listTemplates", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({}), responseSchema: z.object({ templates: z.array(z.object({
    id: z.string(), label: z.string(), description: z.string(), bestFor: z.string(), directories: z.array(z.string()), preview: z.string(),
  })) }),
});
export const brainSearchV10 = defineRpcContract({
  method: "brain.search", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({ query: z.string(), maxResults: z.number().optional() }),
  responseSchema: z.object({ results: z.array(z.object({ path: z.string(), title: z.string(), snippet: z.string(), relevance: z.number() })) }),
});
export const brainGetGraphV10 = defineRpcContract({
  method: "brain.getGraph", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({
    rootPath: z.string().min(1).optional(),
    depth: z.union([z.literal(1), z.literal(2)]).optional(),
    folder: z.string().optional(),
    query: z.string().optional(),
    includeOrphans: z.boolean().optional(),
    maxNodes: z.number().int().min(25).max(500).optional(),
  }),
  responseSchema: z.object({
    brainId: z.string(),
    revision: z.number().int().nonnegative(),
    truncated: z.boolean(),
    nodes: z.array(brainGraphNodeSchema),
    edges: z.array(brainGraphEdgeSchema),
  }),
});
export const brainReadNoteV10 = defineRpcContract({
  method: "brain.readNote", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({ path: z.string() }), responseSchema: z.object({
    content: z.string(), frontmatter: z.record(z.string(), z.unknown()), title: z.string(),
    backlinks: z.array(z.object({ path: z.string(), title: z.string() })),
  }),
});
export const brainWriteNoteV10 = defineRpcContract({
  method: "brain.writeNote", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({ path: z.string(), content: z.string() }), responseSchema: okSchema,
});
export const brainListFolderV10 = defineRpcContract({
  method: "brain.listFolder", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({ path: z.string().optional() }), responseSchema: z.object({ entries: z.array(z.object({
    path: z.string(), name: z.string(), isDir: z.boolean(), title: z.string().optional(),
  })) }),
});
export const brainRebuildIndexV10 = defineRpcContract({
  method: "brain.rebuildIndex", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({}), responseSchema: z.object({ indexed: z.number(), durationMs: z.number() }),
});
export const brainListSkillsV10 = defineRpcContract({
  method: "brain.listSkills", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({}), responseSchema: z.object({ skills: z.array(brainSkillSchema) }),
});
export const brainCreateSkillV10 = defineRpcContract({
  method: "brain.createSkill", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({ name: z.string(), content: z.string().optional() }), responseSchema: z.object({ skill: brainSkillSchema }),
});
export const brainUpdateSkillV10 = defineRpcContract({
  method: "brain.updateSkill", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({ name: z.string(), content: z.string() }), responseSchema: okSchema,
});
export const brainSetSkillEnabledV10 = defineRpcContract({
  method: "brain.setSkillEnabled", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({ name: z.string(), enabled: z.boolean() }), responseSchema: okSchema,
});

export const brainAdaptersListV10 = defineRpcContract({
  method: "brain.adapters.list", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({}), responseSchema: z.object({ adapters: z.array(brainAdapterSchema) }),
});
export const brainAdaptersCreateV10 = defineRpcContract({
  method: "brain.adapters.create", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({ name: z.string(), mountPath: z.string(), description: z.string().optional() }),
  responseSchema: z.object({ adapter: brainAdapterSchema }),
});
export const brainMountsGetRegistryV10 = defineRpcContract({
  method: "brain.mounts.getRegistry", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({}), responseSchema: z.object({
    registry: z.object({ version: z.literal(1), workspaces: z.array(brainMountWorkspaceSchema), mounts: z.array(brainMountRecordSchema) }),
  }),
});
export const brainMountsRegisterWorkspaceV10 = defineRpcContract({
  method: "brain.mounts.registerWorkspace", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({ rootPath: z.string(), adapterId: z.string() }), responseSchema: z.object({ workspace: brainMountWorkspaceSchema }),
});
export const brainMountsAttachSkillV10 = defineRpcContract({
  method: "brain.mounts.attachSkill", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({ workspaceId: z.string(), skillId: z.string() }), responseSchema: z.object({
    status: z.enum(["healthy", "conflict"]), mount: brainMountRecordSchema.nullable(), sourcePath: z.string(), linkPath: z.string(), reason: z.string().optional(),
  }),
});
export const brainMountsInspectV10 = defineRpcContract({
  method: "brain.mounts.inspect", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({}), responseSchema: z.object({ mounts: z.array(brainMountInspectionSchema) }),
});
export const brainMountsReconcileV10 = defineRpcContract({
  method: "brain.mounts.reconcile", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({ repairMissing: z.boolean().optional() }), responseSchema: z.object({ mounts: z.array(brainMountInspectionSchema) }),
});
export const brainMountsDetachSkillV10 = defineRpcContract({
  method: "brain.mounts.detachSkill", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({ mountId: z.string() }), responseSchema: z.object({ mount: brainMountInspectionSchema }),
});
export const brainEvolutionGetEvidenceV10 = defineRpcContract({
  method: "brain.evolution.getEvidence", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({ subjectType: z.enum(["skill", "memory", "meta-memory", "adapter", "policy"]), subjectId: z.string() }),
  responseSchema: z.object({ evidence: z.array(brainEvidenceSchema), summary: brainEvidenceSummarySchema, confidence: z.number(), stage: brainEvolutionStageSchema }),
});
export const brainEvolutionListCandidatesV10 = defineRpcContract({
  method: "brain.evolution.listCandidates", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({}), responseSchema: z.object({ candidates: z.array(brainSkillCandidateSchema) }),
});
export const brainEvolutionListEpisodesV10 = defineRpcContract({
  method: "brain.evolution.listEpisodes", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({ limit: z.number().int().min(1).max(200).optional() }),
  responseSchema: z.object({ episodes: z.array(brainDistilledEpisodeSchema) }),
});
export const brainEvolutionListImprovementsV10 = defineRpcContract({
  method: "brain.evolution.listImprovements", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({ limit: z.number().int().min(1).max(200).optional() }),
  responseSchema: z.object({ improvements: z.array(brainLearnedImprovementSchema) }),
});
export const brainEvolutionProposeSkillV10 = defineRpcContract({
  method: "brain.evolution.proposeSkill", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({ skillId: z.string(), content: z.string(), evidenceIds: z.array(z.string()).optional(), sourceSessionIds: z.array(z.string()).optional() }),
  responseSchema: z.object({ candidate: brainSkillCandidateSchema }),
});
export const brainEvolutionPromoteSkillV10 = defineRpcContract({
  method: "brain.evolution.promoteSkill", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({ skillId: z.string(), approvedByUser: z.boolean().optional() }), responseSchema: z.object({
    promoted: z.boolean(), candidate: brainSkillCandidateSchema, revisionId: z.string().nullable(), reason: z.string(),
  }),
});
export const brainEvolutionRollbackSkillV10 = defineRpcContract({
  method: "brain.evolution.rollbackSkill", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({ skillId: z.string(), revisionId: z.string() }), responseSchema: okSchema,
});
export const brainPolicyDecideActionV10 = defineRpcContract({
  method: "brain.policy.decideAction", schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({
    confidence: z.number(),
    risk: z.enum(["local-reversible", "code-project", "message", "calendar", "destructive", "financial", "secrets", "production", "deployment", "public-publishing"]),
    validationsPassed: z.boolean().optional(), rollbackReady: z.boolean().optional(), configuredRuleMatched: z.boolean().optional(),
  }),
  responseSchema: z.object({ decision: z.enum(["auto", "ask", "gather-evidence"]), reason: z.string() }),
});

function entry<T>(contract: T) {
  return {
    degrade: { kind: "unsupported" as const },
    1: { latestMinor: 0 as const, versions: { 0: { contract, upgradeFromPreviousVersion: null } }, downgradePathsFromLatest: {} },
  };
}

export const BRAIN_REGISTRY_ENTRIES = {
  "brain.scaffold": entry(brainScaffoldV10),
  "brain.connect": entry(brainConnectV10),
  "brain.getRegistry": entry(brainGetRegistryV10),
  "brain.switch": entry(brainSwitchV10),
  "brain.remove": entry(brainRemoveV10),
  "brain.getConfig": entry(brainGetConfigV10),
  "brain.listTemplates": entry(brainListTemplatesV10),
  "brain.search": entry(brainSearchV10),
  "brain.getGraph": entry(brainGetGraphV10),
  "brain.readNote": entry(brainReadNoteV10),
  "brain.writeNote": entry(brainWriteNoteV10),
  "brain.listFolder": entry(brainListFolderV10),
  "brain.rebuildIndex": entry(brainRebuildIndexV10),
  "brain.listSkills": entry(brainListSkillsV10),
  "brain.createSkill": entry(brainCreateSkillV10),
  "brain.updateSkill": entry(brainUpdateSkillV10),
  "brain.setSkillEnabled": entry(brainSetSkillEnabledV10),
  "brain.adapters.list": entry(brainAdaptersListV10),
  "brain.adapters.create": entry(brainAdaptersCreateV10),
  "brain.mounts.getRegistry": entry(brainMountsGetRegistryV10),
  "brain.mounts.registerWorkspace": entry(brainMountsRegisterWorkspaceV10),
  "brain.mounts.attachSkill": entry(brainMountsAttachSkillV10),
  "brain.mounts.inspect": entry(brainMountsInspectV10),
  "brain.mounts.reconcile": entry(brainMountsReconcileV10),
  "brain.mounts.detachSkill": entry(brainMountsDetachSkillV10),
  "brain.evolution.getEvidence": entry(brainEvolutionGetEvidenceV10),
  "brain.evolution.listCandidates": entry(brainEvolutionListCandidatesV10),
  "brain.evolution.listEpisodes": entry(brainEvolutionListEpisodesV10),
  "brain.evolution.listImprovements": entry(brainEvolutionListImprovementsV10),
  "brain.evolution.proposeSkill": entry(brainEvolutionProposeSkillV10),
  "brain.evolution.promoteSkill": entry(brainEvolutionPromoteSkillV10),
  "brain.evolution.rollbackSkill": entry(brainEvolutionRollbackSkillV10),
  "brain.policy.decideAction": entry(brainPolicyDecideActionV10),
} as const;
