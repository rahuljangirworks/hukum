import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import type {
  DiskWorktreeEntry,
  WorktreeBranch,
  WorktreeFolderIntent,
  WorktreeWorkspaceSummary,
} from "@hukum/protocol/host/worktree-schemas";
import {
  applySeedIntentOverride,
  defaultFolderIntent,
  rememberedNeedsBranchValidation,
  resolveRememberedFolderIntent,
  seedEntryForFolder,
  type DefaultFolderInput,
  type SeedFolderContext,
} from "@/lib/worktree/worktree-intent-seeding";

function worktreeEntry(
  worktreePath: string,
  branch: string | null,
  isMain: boolean,
): DiskWorktreeEntry {
  return { worktreePath, branch, head: null, isMain, isLocked: false };
}

function summary(input: {
  workspacePath?: string;
  isGitRepo?: boolean;
  mainBranch?: string | null;
  worktrees?: DiskWorktreeEntry[];
}): WorktreeWorkspaceSummary {
  return {
    workspacePath: input.workspacePath ?? "/a",
    isGitRepo: input.isGitRepo ?? true,
    repoIdentifier: null,
    mainBranch: input.mainBranch ?? "main",
    worktrees: input.worktrees ?? [worktreeEntry("/a", "main", true)],
    scripts: null,
  };
}

function folderContext(
  overrides: Partial<SeedFolderContext>,
): SeedFolderContext {
  return {
    workspacePath: "/a",
    repoIdentifier: null,
    isPrimary: true,
    isGitRepo: true,
    currentBranch: "main",
    defaultNewBranchName: "hukum/swift-otter",
    summary: summary({}),
    ...overrides,
  };
}

function branch(name: string): WorktreeBranch {
  return { name, isCurrent: false, isRemoteOnly: false };
}

const rememberedLocal: WorktreeFolderIntent = {
  kind: "local",
  workspacePath: "/a",
  repoIdentifier: null,
  isPrimary: true,
};

function rememberedNew(source: string): WorktreeFolderIntent {
  return {
    kind: "worktree",
    scripts: null,
    workspacePath: "/a",
    repoIdentifier: null,
    isPrimary: true,
    branch: {
      type: "new",
      name: "feat/x",
      source,
      carryUncommittedChanges: false,
    },
  };
}

function rememberedExisting(name: string): WorktreeFolderIntent {
  return {
    kind: "worktree",
    scripts: null,
    workspacePath: "/a",
    repoIdentifier: null,
    isPrimary: true,
    branch: { type: "existing", name },
  };
}

function rememberedImport(worktreePath: string): WorktreeFolderIntent {
  return {
    kind: "import",
    workspacePath: "/a",
    repoIdentifier: null,
    isPrimary: true,
    worktreePath,
  };
}

beforeEach(() => {
  vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
    "00000000-0000-4000-8000-000000000000",
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Property-Based Test: Bug Condition Exploration
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirements 1.1, 1.2, 1.3**
 *
 * Property 1: Bug Condition — Default Intent Returns Local for Git Repos
 *
 * For all DefaultFolderInput where isGitRepo == true and currentBranch != null,
 * defaultFolderIntent(input).kind SHOULD be "local".
 *
 * On UNFIXED code, this test is EXPECTED TO FAIL because defaultFolderIntent()
 * currently returns kind: "worktree" for git repos with a non-null branch.
 */
describe("Bug Condition Exploration (Property 1)", () => {
  // Arbitrary for DefaultFolderInput scoped to the bug condition:
  // isGitRepo == true AND currentBranch != null
  const arbDefaultFolderInput: fc.Arbitrary<DefaultFolderInput> = fc.record({
    workspacePath: fc.stringMatching(/^\/[a-z][a-z0-9/\-_]{0,30}$/),
    repoIdentifier: fc.oneof(
      fc.constant(null),
      fc.record({
        owner: fc.stringMatching(/^[a-z][a-z0-9_-]{0,10}$/),
        repo: fc.stringMatching(/^[a-z][a-z0-9_-]{0,10}$/),
      }),
    ),
    isPrimary: fc.boolean(),
    isGitRepo: fc.constant(true), // scoped to git repos
    currentBranch: fc.stringMatching(/^[a-z][a-z0-9/\-_]{0,20}$/), // non-null strings
    defaultNewBranchName: fc.stringMatching(/^hukum\/[a-z][a-z0-9-]{0,15}$/),
  });

  it("defaultFolderIntent returns kind: 'local' for all git repos with a current branch", () => {
    fc.assert(
      fc.property(arbDefaultFolderInput, (input) => {
        const result = defaultFolderIntent(input);

        // The expected behavior: always return local for git repos
        expect(result.kind).toBe("local");
        expect(result.workspacePath).toBe(input.workspacePath);
        expect(result.repoIdentifier).toEqual(input.repoIdentifier);
        expect(result.isPrimary).toBe(input.isPrimary);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property-Based Tests: Preservation (Property 2)
// ---------------------------------------------------------------------------

/**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 *
 * Property 2: Preservation — Explicit Worktree Paths and Non-Git Defaults Unchanged
 *
 * These tests capture baseline behaviors that MUST remain unchanged after the fix:
 * - Non-git folders always get kind: "local" from defaultFolderIntent
 * - Detached HEAD git repos always get kind: "local" from defaultFolderIntent
 * - seedEntryForFolder returns seed verbatim when seedFolderIntent is non-null
 * - applySeedIntentOverride with "worktree-carry" produces worktree with carryUncommittedChanges
 */
describe("Preservation Property Tests (Property 2)", () => {
  // Arbitrary for non-git folder inputs
  const arbNonGitFolderInput: fc.Arbitrary<DefaultFolderInput> = fc.record({
    workspacePath: fc.stringMatching(/^\/[a-z][a-z0-9/\-_]{0,30}$/),
    repoIdentifier: fc.constant(null),
    isPrimary: fc.boolean(),
    isGitRepo: fc.constant(false),
    currentBranch: fc.constant(null),
    defaultNewBranchName: fc.stringMatching(/^hukum\/[a-z][a-z0-9-]{0,15}$/),
  });

  // Arbitrary for detached HEAD git repo inputs
  const arbDetachedHeadInput: fc.Arbitrary<DefaultFolderInput> = fc.record({
    workspacePath: fc.stringMatching(/^\/[a-z][a-z0-9/\-_]{0,30}$/),
    repoIdentifier: fc.oneof(
      fc.constant(null),
      fc.record({
        owner: fc.stringMatching(/^[a-z][a-z0-9_-]{0,10}$/),
        repo: fc.stringMatching(/^[a-z][a-z0-9_-]{0,10}$/),
      }),
    ),
    isPrimary: fc.boolean(),
    isGitRepo: fc.constant(true),
    currentBranch: fc.constant(null),
    defaultNewBranchName: fc.stringMatching(/^hukum\/[a-z][a-z0-9-]{0,15}$/),
  });

  // Arbitrary for a non-null WorktreeFolderIntent seed (local, import, or worktree kinds)
  const arbLocalIntent: fc.Arbitrary<WorktreeFolderIntent> = fc.record({
    kind: fc.constant("local" as const),
    workspacePath: fc.stringMatching(/^\/[a-z][a-z0-9/\-_]{0,20}$/),
    repoIdentifier: fc.constant(null),
    isPrimary: fc.boolean(),
  });

  const arbImportIntent: fc.Arbitrary<WorktreeFolderIntent> = fc.record({
    kind: fc.constant("import" as const),
    workspacePath: fc.stringMatching(/^\/[a-z][a-z0-9/\-_]{0,20}$/),
    repoIdentifier: fc.constant(null),
    isPrimary: fc.boolean(),
    worktreePath: fc.stringMatching(/^\/[a-z][a-z0-9/\-_]{0,30}$/),
  });

  const arbWorktreeNewIntent: fc.Arbitrary<WorktreeFolderIntent> = fc.record({
    kind: fc.constant("worktree" as const),
    scripts: fc.constant(null),
    workspacePath: fc.stringMatching(/^\/[a-z][a-z0-9/\-_]{0,20}$/),
    repoIdentifier: fc.constant(null),
    isPrimary: fc.boolean(),
    branch: fc.record({
      type: fc.constant("new" as const),
      name: fc.stringMatching(/^hukum\/[a-z][a-z0-9-]{0,15}$/),
      source: fc.stringMatching(/^[a-z][a-z0-9/\-_]{0,15}$/),
      carryUncommittedChanges: fc.boolean(),
      collision: fc.constant("random" as const),
      retryIdentity: fc.uuid(),
    }),
  });

  const arbNonNullSeedIntent: fc.Arbitrary<WorktreeFolderIntent> = fc.oneof(
    arbLocalIntent,
    arbImportIntent,
    arbWorktreeNewIntent,
  );

  // Arbitrary for DefaultFolderInput for git repos (used in applySeedIntentOverride)
  const arbGitFolderInput: fc.Arbitrary<DefaultFolderInput> = fc.record({
    workspacePath: fc.stringMatching(/^\/[a-z][a-z0-9/\-_]{0,30}$/),
    repoIdentifier: fc.oneof(
      fc.constant(null),
      fc.record({
        owner: fc.stringMatching(/^[a-z][a-z0-9_-]{0,10}$/),
        repo: fc.stringMatching(/^[a-z][a-z0-9_-]{0,10}$/),
      }),
    ),
    isPrimary: fc.boolean(),
    isGitRepo: fc.constant(true),
    currentBranch: fc.stringMatching(/^[a-z][a-z0-9/\-_]{0,20}$/), // non-null
    defaultNewBranchName: fc.stringMatching(/^hukum\/[a-z][a-z0-9-]{0,15}$/),
  });

  it("non-git folders always get kind: 'local' from defaultFolderIntent", () => {
    fc.assert(
      fc.property(arbNonGitFolderInput, (input) => {
        const result = defaultFolderIntent(input);
        expect(result.kind).toBe("local");
        expect(result.workspacePath).toBe(input.workspacePath);
        expect(result.repoIdentifier).toEqual(input.repoIdentifier);
        expect(result.isPrimary).toBe(input.isPrimary);
      }),
      { numRuns: 100 },
    );
  });

  it("detached HEAD git repos always get kind: 'local' from defaultFolderIntent", () => {
    fc.assert(
      fc.property(arbDetachedHeadInput, (input) => {
        const result = defaultFolderIntent(input);
        expect(result.kind).toBe("local");
        expect(result.workspacePath).toBe(input.workspacePath);
        expect(result.repoIdentifier).toEqual(input.repoIdentifier);
        expect(result.isPrimary).toBe(input.isPrimary);
      }),
      { numRuns: 100 },
    );
  });

  it("seedEntryForFolder returns seed verbatim when seedFolderIntent is non-null", () => {
    fc.assert(
      fc.property(arbNonNullSeedIntent, arbGitFolderInput, (seed, folder) => {
        const ctx: SeedFolderContext = {
          ...folder,
          summary: {
            workspacePath: folder.workspacePath,
            isGitRepo: folder.isGitRepo,
            repoIdentifier: folder.repoIdentifier,
            mainBranch: folder.currentBranch ?? "main",
            worktrees: [
              {
                worktreePath: folder.workspacePath,
                branch: folder.currentBranch,
                head: null,
                isMain: true,
                isLocked: false,
              },
            ],
            scripts: null,
          },
        };
        const result = seedEntryForFolder({
          seedFolderIntent: seed,
          epicIntentEntry: null,
          rememberedFolderIntent: null,
          branches: null,
          folder: ctx,
          alreadyStaged: false,
        });
        // Seed must be returned verbatim — it is the top precedence tier
        expect(result).toEqual(seed);
      }),
      { numRuns: 100 },
    );
  });

  it("applySeedIntentOverride with 'worktree-carry' on valid git repo produces worktree with carryUncommittedChanges", () => {
    fc.assert(
      fc.property(arbNonNullSeedIntent, arbGitFolderInput, (seedEntry, folder) => {
        const result = applySeedIntentOverride({
          override: "worktree-carry",
          seedEntry,
          folder,
        });
        // For a valid git repo with non-null currentBranch, result must be a worktree with carry
        expect(result).not.toBeNull();
        expect(result!.kind).toBe("worktree");
        if (result!.kind === "worktree") {
          expect(result!.branch.type).toBe("new");
          if (result!.branch.type === "new") {
            expect(result!.branch.carryUncommittedChanges).toBe(true);
            expect(result!.branch.source).toBe(folder.currentBranch);
            expect(result!.branch.name).toBe(folder.defaultNewBranchName);
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Existing unit tests (preserved from original file)
// ---------------------------------------------------------------------------

describe("defaultFolderIntent", () => {
  it("returns local for a git repo (worktree creation is opt-in)", () => {
    expect(
      defaultFolderIntent({
        workspacePath: "/a",
        repoIdentifier: null,
        isPrimary: true,
        isGitRepo: true,
        currentBranch: "main",
        defaultNewBranchName: "hukum/swift-otter",
      }),
    ).toEqual({
      kind: "local",
      workspacePath: "/a",
      repoIdentifier: null,
      isPrimary: true,
    });
  });

  it("degrades to local for a non-git folder", () => {
    expect(
      defaultFolderIntent({
        workspacePath: "/a",
        repoIdentifier: null,
        isPrimary: true,
        isGitRepo: false,
        currentBranch: null,
        defaultNewBranchName: "x",
      }).kind,
    ).toBe("local");
  });

  it("degrades a detached-HEAD git repo to local instead of an empty source", () => {
    expect(
      defaultFolderIntent({
        workspacePath: "/a",
        repoIdentifier: null,
        isPrimary: true,
        isGitRepo: true,
        currentBranch: null,
        defaultNewBranchName: "x",
      }).kind,
    ).toBe("local");
  });
});

describe("rememberedNeedsBranchValidation", () => {
  it("is false for null / local / import / new-off-working-tree", () => {
    expect(rememberedNeedsBranchValidation(null, "main")).toBe(false);
    expect(rememberedNeedsBranchValidation(rememberedLocal, "main")).toBe(
      false,
    );
    expect(
      rememberedNeedsBranchValidation(rememberedImport("/wt"), "main"),
    ).toBe(false);
    expect(rememberedNeedsBranchValidation(rememberedNew("main"), "main")).toBe(
      false,
    );
  });

  it("is true for an existing-branch checkout or a non-working-tree fork source", () => {
    expect(
      rememberedNeedsBranchValidation(rememberedExisting("feat/y"), "main"),
    ).toBe(true);
    expect(
      rememberedNeedsBranchValidation(rememberedNew("develop"), "main"),
    ).toBe(true);
  });
});

describe("resolveRememberedFolderIntent", () => {
  it("returns null when nothing is remembered", () => {
    expect(
      resolveRememberedFolderIntent({
        remembered: null,
        branches: [],
        folder: folderContext({}),
      }),
    ).toBeNull();
  });

  it("replays a remembered local choice", () => {
    expect(
      resolveRememberedFolderIntent({
        remembered: rememberedLocal,
        branches: [],
        folder: folderContext({ isPrimary: false }),
      }),
    ).toEqual({
      kind: "local",
      workspacePath: "/a",
      repoIdentifier: null,
      isPrimary: false,
    });
  });

  it("keeps an adopted worktree that still exists and drops one that is gone", () => {
    const live = summary({
      worktrees: [
        worktreeEntry("/a", "main", true),
        worktreeEntry("/wt/x", "feat/x", false),
      ],
    });
    expect(
      resolveRememberedFolderIntent({
        remembered: rememberedImport("/wt/x"),
        branches: null,
        folder: folderContext({ summary: live }),
      }),
    ).toEqual(rememberedImport("/wt/x"));
    expect(
      resolveRememberedFolderIntent({
        remembered: rememberedImport("/wt/gone"),
        branches: null,
        folder: folderContext({ summary: live }),
      }),
    ).toBeNull();
  });

  it("regenerates the branch name for a new-off-working-tree replay", () => {
    expect(
      resolveRememberedFolderIntent({
        remembered: rememberedNew("main"),
        branches: null,
        folder: folderContext({ defaultNewBranchName: "hukum/fresh-name" }),
      }),
    ).toEqual({
      kind: "worktree",
      scripts: null,
      workspacePath: "/a",
      repoIdentifier: null,
      isPrimary: true,
      branch: {
        type: "new",
        name: "hukum/fresh-name",
        source: "main",
        carryUncommittedChanges: false,
        collision: "random",
        retryIdentity: "00000000-0000-4000-8000-000000000000",
      },
    });
  });

  it("keeps a non-working-tree fork source only when the branch still exists", () => {
    expect(
      resolveRememberedFolderIntent({
        remembered: rememberedNew("develop"),
        branches: [branch("main"), branch("develop")],
        folder: folderContext({}),
      }),
    ).not.toBeNull();
    expect(
      resolveRememberedFolderIntent({
        remembered: rememberedNew("develop"),
        branches: [branch("main")],
        folder: folderContext({}),
      }),
    ).toBeNull();
  });

  it("keeps an existing-branch checkout only when present and checked out nowhere", () => {
    // Present and free -> valid.
    expect(
      resolveRememberedFolderIntent({
        remembered: rememberedExisting("feat/y"),
        branches: [branch("main"), branch("feat/y")],
        folder: folderContext({}),
      }),
    ).toEqual(rememberedExisting("feat/y"));
    // Branch gone -> null.
    expect(
      resolveRememberedFolderIntent({
        remembered: rememberedExisting("feat/y"),
        branches: [branch("main")],
        folder: folderContext({}),
      }),
    ).toBeNull();
    // Checked out in a worktree already -> null (no double checkout).
    const checkedOut = summary({
      worktrees: [
        worktreeEntry("/a", "main", true),
        worktreeEntry("/wt/y", "feat/y", false),
      ],
    });
    expect(
      resolveRememberedFolderIntent({
        remembered: rememberedExisting("feat/y"),
        branches: [branch("main"), branch("feat/y")],
        folder: folderContext({ summary: checkedOut }),
      }),
    ).toBeNull();
  });

  it("cannot validate an existing-branch checkout without the branch list", () => {
    expect(
      resolveRememberedFolderIntent({
        remembered: rememberedExisting("feat/y"),
        branches: null,
        folder: folderContext({}),
      }),
    ).toBeNull();
  });
});

describe("seedEntryForFolder", () => {
  it("stages the seed verbatim, beating per-epic memory, per-folder memory, and the default", () => {
    // The source conversation runs on an adopted worktree; that seed is the top
    // tier and must win over any remembered pick or the generic new-worktree
    // default - and it needs no branch list (staged verbatim, not disk-validated).
    const seed = rememberedImport("/a/.worktrees/feature");
    expect(
      seedEntryForFolder({
        seedFolderIntent: seed,
        epicIntentEntry: rememberedExisting("from-epic"),
        rememberedFolderIntent: rememberedLocal,
        branches: null,
        folder: folderContext({}),
        alreadyStaged: false,
      }),
    ).toEqual(seed);
  });

  it("never overwrites a folder the user already staged", () => {
    expect(
      seedEntryForFolder({
        seedFolderIntent: null,
        epicIntentEntry: null,
        rememberedFolderIntent: rememberedLocal,
        branches: [],
        folder: folderContext({}),
        alreadyStaged: true,
      }),
    ).toBeNull();
  });

  it("replays a valid per-epic entry, beating per-folder memory and the default", () => {
    const epicEntry = rememberedExisting("from-epic");
    const result = seedEntryForFolder({
      seedFolderIntent: null,
      epicIntentEntry: epicEntry,
      rememberedFolderIntent: rememberedLocal,
      // The existing branch still exists on disk, so the epic pick is valid.
      branches: [branch("from-epic")],
      folder: folderContext({}),
      alreadyStaged: false,
    });
    expect(result?.kind).toBe("worktree");
    if (result?.kind === "worktree" && result.branch.type === "existing") {
      expect(result.branch.name).toBe("from-epic");
    }
  });

  it("self-heals a stale per-epic entry to the default (local) instead of replaying a doomed pick", () => {
    // The epic remembered an existing-branch checkout that no longer exists; it
    // must fall back to defaultFolderIntent which now returns local (worktree
    // creation is opt-in) rather than stage a pick that fails at worktree.create.
    const entry = seedEntryForFolder({
      seedFolderIntent: null,
      epicIntentEntry: rememberedExisting("gone-from-epic"),
      rememberedFolderIntent: null,
      branches: [branch("main")],
      folder: folderContext({ defaultNewBranchName: "hukum/fallback" }),
      alreadyStaged: false,
    });
    expect(entry?.kind).toBe("local");
  });

  it("replays a valid per-folder memory over the default", () => {
    expect(
      seedEntryForFolder({
        seedFolderIntent: null,
        epicIntentEntry: null,
        rememberedFolderIntent: rememberedLocal,
        branches: [],
        folder: folderContext({}),
        alreadyStaged: false,
      })?.kind,
    ).toBe("local");
  });

  it("falls back to local when the memory is invalid (worktree creation is opt-in)", () => {
    // Remembered an existing-branch checkout that no longer exists.
    // The fallback is defaultFolderIntent which now always returns local.
    const entry = seedEntryForFolder({
      seedFolderIntent: null,
      epicIntentEntry: null,
      rememberedFolderIntent: rememberedExisting("gone"),
      branches: [branch("main")],
      folder: folderContext({ defaultNewBranchName: "hukum/fallback" }),
      alreadyStaged: false,
    });
    expect(entry?.kind).toBe("local");
  });

  it("defaults to local when nothing is remembered (worktree creation is opt-in)", () => {
    const entry = seedEntryForFolder({
      seedFolderIntent: null,
      epicIntentEntry: null,
      rememberedFolderIntent: null,
      branches: [],
      folder: folderContext({}),
      alreadyStaged: false,
    });
    expect(entry?.kind).toBe("local");
  });

  it("defaults a non-git folder to local", () => {
    expect(
      seedEntryForFolder({
        seedFolderIntent: null,
        epicIntentEntry: null,
        rememberedFolderIntent: null,
        branches: [],
        folder: folderContext({
          isGitRepo: false,
          currentBranch: null,
          summary: summary({ isGitRepo: false, worktrees: [] }),
        }),
        alreadyStaged: false,
      })?.kind,
    ).toBe("local");
  });
});
