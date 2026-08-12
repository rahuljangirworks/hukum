/**
 * Brain RPC domain — contracts + registry entries.
 *
 * Self-contained: contracts are defined first, then the registry slice
 * references them. No "used before declaration" issues.
 */

import { z } from "zod";
import { defineRpcContract } from "@hukum/protocol/framework/index";

// ─── Contracts ────────────────────────────────────────────────────────────────

export const brainScaffoldV10 = defineRpcContract({
  method: "brain.scaffold",
  schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({
    parentDir: z.string(),
    vaultName: z.string(),
    template: z.string(),
  }),
  responseSchema: z.object({
    vaultPath: z.string(),
    createdDirs: z.array(z.string()),
    createdFiles: z.array(z.string()),
  }),
});

export const brainConnectV10 = defineRpcContract({
  method: "brain.connect",
  schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({
    vaultPath: z.string(),
  }),
  responseSchema: z.object({
    vaultPath: z.string(),
    noteCount: z.number(),
    hasObsidianConfig: z.boolean(),
  }),
});

export const brainGetRegistryV10 = defineRpcContract({
  method: "brain.getRegistry",
  schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({}),
  responseSchema: z.object({
    brains: z.array(z.object({
      id: z.string(),
      name: z.string(),
      vaultPath: z.string(),
      template: z.string(),
      createdAt: z.string(),
    })),
    activeBrainId: z.string().nullable(),
  }),
});

export const brainSwitchV10 = defineRpcContract({
  method: "brain.switch",
  schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({
    brainId: z.string(),
  }),
  responseSchema: z.object({
    ok: z.literal(true),
  }),
});

export const brainRemoveV10 = defineRpcContract({
  method: "brain.remove",
  schemaVersion: { major: 1, minor: 0 } as const,
  requestSchema: z.object({
    brainId: z.string(),
  }),
  responseSchema: z.object({
    ok: z.literal(true),
    remainingCount: z.number(),
  }),
});

// ─── Registry Slice ───────────────────────────────────────────────────────────

export const BRAIN_REGISTRY_ENTRIES = {
  "brain.scaffold": {
    degrade: { kind: "unsupported" },
    1: {
      latestMinor: 0,
      versions: {
        0: { contract: brainScaffoldV10, upgradeFromPreviousVersion: null },
      },
      downgradePathsFromLatest: {},
    },
  },
  "brain.connect": {
    degrade: { kind: "unsupported" },
    1: {
      latestMinor: 0,
      versions: {
        0: { contract: brainConnectV10, upgradeFromPreviousVersion: null },
      },
      downgradePathsFromLatest: {},
    },
  },
  "brain.getRegistry": {
    degrade: { kind: "unsupported" },
    1: {
      latestMinor: 0,
      versions: {
        0: { contract: brainGetRegistryV10, upgradeFromPreviousVersion: null },
      },
      downgradePathsFromLatest: {},
    },
  },
  "brain.switch": {
    degrade: { kind: "unsupported" },
    1: {
      latestMinor: 0,
      versions: {
        0: { contract: brainSwitchV10, upgradeFromPreviousVersion: null },
      },
      downgradePathsFromLatest: {},
    },
  },
  "brain.remove": {
    degrade: { kind: "unsupported" },
    1: {
      latestMinor: 0,
      versions: {
        0: { contract: brainRemoveV10, upgradeFromPreviousVersion: null },
      },
      downgradePathsFromLatest: {},
    },
  },
} as const;
