// @ts-nocheck — epicRecordV300 / epicDowngradeV300ToV200 / epicUpgradeV200ToV300
// have not been implemented yet in the persistence registry. This test is
// pre-written for the upcoming v3.0 epic record contract. Re-enable once those
// exports land in persistence/registry.ts.
import { describe, expect, it } from "vitest";
import {
  epicDowngradeV300ToV200,
  epicRecordV200,
  epicRecordV300,
  epicUpgradeV200ToV300,
} from "@hukum/protocol/persistence/registry";

function epic(tuiAgents: Record<string, unknown> = {}) {
  return {
    id: "epic-1",
    title: "Versioned epic",
    isTitleEditedByUser: false,
    createdAt: 1,
    updatedAt: 2,
    chats: {},
    artifacts: {},
    deletedArtifacts: {},
    tuiAgents,
    roleClaims: {},
  };
}

function piAgent() {
  return {
    harnessId: "pi",
    id: "agent-pi",
    parentId: null,
    title: "",
    isTitleEditedByUser: false,
    createdAt: 1,
    updatedAt: 2,
    hostId: "host-1",
    userId: "user-1",
    workspaceFolders: ["/repo"],
    model: null,
    reasoningEffort: null,
    agentMode: "regular",
    terminalAgentArgs: null,
    terminalShellCommand: null,
    terminalShellArgs: null,
    profileId: null,
    harnessSessionId: "session-pi",
  };
}

describe("epic persistence v3 terminal-provider boundary", () => {
  it("upgrades every v2 epic losslessly", () => {
    const before = epicRecordV200.schema.parse(epic());
    expect(epicUpgradeV200ToV300.upgradeRecord(before)).toEqual(before);
  });

  it("accepts Pi on v3 and refuses a lossy downgrade to v2", () => {
    const current = epicRecordV300.schema.parse(epic({ "agent-pi": piAgent() }));
    expect(epicDowngradeV300ToV200.downgradeRecord(current)).toEqual({
      ok: false,
      error: {
        code: "DOWNGRADE_UNSUPPORTED",
        message: "epic contains a pi terminal agent that persistence v2 cannot represent",
      },
    });
  });

  it("downgrades a v3 epic when it contains only v2-compatible agents", () => {
    const current = epicRecordV300.schema.parse(epic());
    const result = epicDowngradeV300ToV200.downgradeRecord(current);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.id).toBe("epic-1");
  });
});
