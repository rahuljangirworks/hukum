# Design Document: Upstream Sync Workflow

## Overview

The upstream sync workflow is a sequential pipeline with decision gates that brings the Hukum fork up-to-date with the upstream traycer repository. It is not a runtime code feature — it is a repeatable operational procedure composed of discrete, executable steps orchestrated by shell commands, git operations, and utility scripts.

The pipeline consists of 8 phases executed in order:

```
Inventory → Fetch → Overlap Review → Strategy Selection → Conflict Resolution → Rebrand → Verification → Delta Update
```

Each phase either completes and advances, or halts the pipeline with diagnostic output.

## Architecture

### Pipeline Model

The workflow is a **linear state machine** where each state represents a pipeline phase. Transitions occur on phase success; any failure causes a halt with rollback where applicable.

```
┌──────────────┐     ┌──────────┐     ┌─────────────────┐     ┌───────────────────┐
│ 1. Inventory │────▶│ 2. Fetch │────▶│ 3. Overlap      │────▶│ 4. Strategy       │
│    Update    │     │          │     │    Review        │     │    Selection      │
└──────────────┘     └──────────┘     └─────────────────┘     └───────────────────┘
                                                                        │
       ┌────────────────────────────────────────────────────────────────┘
       ▼
┌──────────────────┐     ┌──────────┐     ┌──────────────────┐     ┌──────────────┐
│ 5. Conflict      │────▶│ 6. Re-   │────▶│ 7. Verification  │────▶│ 8. Delta     │
│    Resolution    │     │    brand  │     │                  │     │    Update    │
└──────────────────┘     └──────────┘     └──────────────────┘     └──────────────┘
```

### Decision Gates

Two decision gates interrupt the pipeline for human confirmation:

1. **Strategy Gate** (Phase 4): After dry-run merge, present conflict count and recommended strategy. Proceed only on maintainer confirmation.
2. **Manual Resolution Gate** (Phase 5): When Shared Configuration conflicts require human judgment.

### Execution Context

- **Working Directory:** `/home/rahul/work/personal-projacts/traycer`
- **Shell:** Bash commands executed sequentially
- **Git remotes:** `origin` (rahuljangirworks/traycer), `upstream` (traycerai/traycer)
- **Branch:** `dev`
- **Runtime:** Bun 1.3.12, Node >= 24, Python 3 (for rebrand.py), Nx (build orchestrator)

## Components

### 1. Inventory Manager

Responsible for scanning the repository and maintaining UPSTREAM-DELTA.md Section 1.

**Inputs:** Repository file tree, current UPSTREAM-DELTA.md content  
**Outputs:** Updated UPSTREAM-DELTA.md with categorized file entries

**Categorization Rules:**

| Category | Criteria |
|----------|----------|
| Rahul-Owned Files | Files under `.agent/`, `.kiro/`, `.hukum/`, `clients/hukum-cli/`, Brain protocol files, scratch scripts |
| Shared Configuration | Root config files modified by fork: `package.json`, `nx.json`, `.gitignore`, ESLint configs |
| Protected Patches | Files that exist upstream but contain fork-specific patches: provider defaults, terminal configs |

**File Discovery:**

```typescript
interface InventoryEntry {
  path: string;
  category: "rahul-owned" | "shared-config" | "protected-patch";
  riskLevel: "low" | "medium" | "high";
  description: string;
}

function categorizeFile(path: string): InventoryEntry["category"] {
  if (isRahulOwned(path)) return "rahul-owned";
  if (isSharedConfig(path)) return "shared-config";
  if (isProtectedPatch(path)) return "protected-patch";
  // Files not matching any category are not fork-specific
  throw new Error(`File ${path} is not fork-specific`);
}

function assessRisk(path: string, category: InventoryEntry["category"]): InventoryEntry["riskLevel"] {
  if (category === "rahul-owned") return "low"; // always keep fork version
  if (category === "protected-patch") return "high"; // requires careful merge
  return "medium"; // shared config needs review
}
```

### 2. Fetch & Summary Generator

Fetches upstream and produces a structured commit summary.

**Commands:**
```bash
git fetch upstream
git log --oneline --name-only ${FORK_BASE}..upstream/main
```

**Output Structure:**

```typescript
interface CommitSummary {
  commitCount: number;
  commits: Array<{
    hash: string;
    message: string;
    files: string[];
  }>;
  affectedPaths: string[]; // deduplicated
  flaggedCommits: Array<{
    hash: string;
    message: string;
    overlappingFiles: string[];
  }>;
}

function flagCommits(commits: CommitSummary["commits"], inventory: InventoryEntry[]): CommitSummary["flaggedCommits"] {
  const inventoryPaths = new Set(inventory.map(e => e.path));
  return commits
    .filter(c => c.files.some(f => inventoryPaths.has(f)))
    .map(c => ({
      hash: c.hash,
      message: c.message,
      overlappingFiles: c.files.filter(f => inventoryPaths.has(f)),
    }));
}
```

### 3. Overlap Reviewer

Compares upstream branch diffs against fork-owned file sets.

**Conflict Classification:**

```typescript
type ConflictClass = "identical" | "compatible" | "incompatible";

interface OverlapResult {
  file: string;
  classification: ConflictClass;
  upstreamDiff: string;
  forkDiff: string;
}

interface OverlapSummary {
  branch: string;
  fileCount: number;
  conflicts: Record<ConflictClass, number>;
  recommendation: string;
}

function classifyConflict(upstreamDiff: string, forkDiff: string): ConflictClass {
  if (upstreamDiff === forkDiff) return "identical";
  if (!hasOverlappingHunks(upstreamDiff, forkDiff)) return "compatible";
  return "incompatible";
}
```

### 4. Strategy Selector

Decides between merge and rebase based on conflict count from a dry-run.

**Command:**
```bash
git merge --no-commit --no-ff upstream/main 2>&1 | grep "CONFLICT" | wc -l
git merge --abort
```

**Decision Logic:**

```typescript
type Strategy = "rebase" | "merge";

function selectStrategy(conflictCount: number): Strategy {
  return conflictCount < 5 ? "rebase" : "merge";
}
```

**Execution:**
```bash
# If rebase:
git rebase upstream/main

# If merge:
git merge upstream/main
```

### 5. Conflict Resolver

Applies resolution rules based on UPSTREAM-DELTA.md ownership categories.

```typescript
type ResolutionAction = "keep-fork" | "keep-upstream" | "manual" | "patch-preserve";

function resolveConflict(
  file: string,
  inventory: InventoryEntry[],
): ResolutionAction {
  const entry = inventory.find(e => e.path === file);
  if (!entry) return "keep-upstream";

  switch (entry.category) {
    case "rahul-owned": return "keep-fork";
    case "shared-config": return "manual";
    case "protected-patch": return "patch-preserve";
  }
}
```

**Git resolution commands:**
```bash
# keep-fork:
git checkout --ours <file>
git add <file>

# keep-upstream:
git checkout --theirs <file>
git add <file>

# manual: pause pipeline, present diff, wait for user

# patch-preserve: attempt three-way merge preserving fork hunks
git merge-file --ours <file>.ours <file>.base <file>.theirs
```

### 6. Rebrand Executor

Runs `rebrand.py` and commits the result.

```bash
python3 rebrand.py
git add -A
git commit -m "chore: reapply Hukum rebrand after upstream sync"
```

**Error handling:** If `rebrand.py` exits non-zero, capture stderr and present to maintainer with proceed/abort choice.

### 7. Verification Runner

Executes the verification suite in strict order.

```typescript
interface VerificationResult {
  step: "compile" | "lint" | "test";
  success: boolean;
  output: string;
  failingFiles?: string[];
}

const VERIFICATION_STEPS = [
  { step: "compile", command: "bun run compile" },
  { step: "lint", command: "bun run lint" },
  { step: "test", command: "bun run test" },
] as const;
```

Each step runs only if the previous succeeded. On failure, report step name, error output, and affected files.

### 8. Delta Document Updater

Updates UPSTREAM-DELTA.md with sync results.

```typescript
interface DeltaLogRow {
  date: string;          // ISO date
  area: string;          // "upstream sync"
  commitRange: string;   // e.g., "6c45acda..4fc70b36"
  ownership: string;     // "Rahul"
  riskAssessment: string;
  verificationResult: string;
  commitMessage: string;
  mergeNotes: string;
}

function formatCommitMessage(shortHash: string): string {
  return `docs: update UPSTREAM-DELTA.md after upstream sync to ${shortHash}`;
}
```

## Data Models

### UPSTREAM-DELTA.md Structure

```markdown
---
updated: 2025-01-15
fork-base: abc1234
---

## Section 1: Rahul-Owned Files
| Path | Category | Risk | Description |
|------|----------|------|-------------|
| ...  | ...      | ...  | ...         |

## Section 2: Shared Configuration
| Path | Category | Risk | Description |
|------|----------|------|-------------|
| ...  | ...      | ...  | ...         |

## Section 3: Protected Patches
| Path | Category | Risk | Description |
|------|----------|------|-------------|
| ...  | ...      | ...  | ...         |

## Delta Log
| Date | Area | Commit Range | Ownership | Risk | Verification | Commit | Notes |
|------|------|--------------|-----------|------|--------------|--------|-------|
| ...  | ...  | ...          | ...       | ...  | ...          | ...    | ...   |
```

### Workflow State

```typescript
interface WorkflowState {
  phase: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  forkBase: string;       // current fork base commit
  upstreamHead: string;   // upstream/main HEAD after fetch
  strategy?: Strategy;
  conflictCount?: number;
  rebrandFileCount?: number;
  verificationPassed?: boolean;
  newForkBase?: string;   // merge/rebase result commit
}
```

## Error Handling

| Phase | Error Condition | Behavior |
|-------|----------------|----------|
| 2 | Fetch fails (network/auth) | Report error, halt pipeline |
| 4 | Dry-run merge fails | Report, halt pipeline |
| 4-5 | Unresolvable conflicts | `git merge --abort` or `git rebase --abort`, restore pre-merge state |
| 6 | `rebrand.py` errors | Report stderr, offer proceed/abort |
| 7 | Compile/lint/test failure | Report failing step + output, halt pipeline |

All halts are non-destructive — the working tree returns to its pre-workflow state via git abort commands.

## Interfaces

### CLI Interface

The workflow is invoked as a sequence of shell commands (not a compiled binary). Each phase produces stdout output and exits 0 on success, non-zero on failure.

### Human Decision Points

```
Phase 4 prompt:
  "Dry-run found N conflicting files. Recommended strategy: {rebase|merge}. Proceed? [y/n]"

Phase 5 prompt (Shared Config conflicts):
  "Conflict in {file}: [show diff]. Resolve manually, then continue."

Phase 6 prompt (rebrand error):
  "rebrand.py failed: {error}. Proceed without rebrand or abort? [proceed/abort]"
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Inventory entry validity and categorization

*For any* file path that is identified as fork-specific, the inventory entry produced by the Inventory Manager SHALL contain a non-empty path, exactly one category from {rahul-owned, shared-config, protected-patch}, and a risk level from {low, medium, high}.

**Validates: Requirements 1.2, 1.3**

### Property 2: Commit log summary correctness

*For any* set of git commits between two refs, the summary generator SHALL produce a commit count equal to the number of commits, an affected paths list containing every unique file touched by those commits, and a message list containing every commit message.

**Validates: Requirements 2.2**

### Property 3: Fork inventory file flagging

*For any* set of commits with associated file paths and any fork inventory, the set of flagged commits SHALL be exactly those commits that have at least one file path present in the fork inventory — no more, no less.

**Validates: Requirements 2.3**

### Property 4: Conflict classification exhaustiveness

*For any* two diffs touching the same file, the conflict classifier SHALL return exactly one of {identical, compatible, incompatible}. If both diffs are textually equal, the classification SHALL be "identical".

**Validates: Requirements 3.3**

### Property 5: Overlap summary report completeness

*For any* overlap review result containing a list of file comparisons, the summary report SHALL include: the total file count, a conflict count for each classification category (identical, compatible, incompatible), and a non-empty resolution recommendation string.

**Validates: Requirements 3.4**

### Property 6: Strategy threshold correctness

*For any* non-negative integer conflict count, the strategy selector SHALL return "rebase" if and only if the count is less than 5, and "merge" if and only if the count is greater than or equal to 5.

**Validates: Requirements 4.2, 4.3**

### Property 7: Ownership-based conflict resolution

*For any* conflicting file during merge, if the file is categorized as "rahul-owned" in the fork inventory then the resolver SHALL select the fork version entirely; if the file is not present in the fork inventory then the resolver SHALL select the upstream version entirely.

**Validates: Requirements 5.1, 5.4**

### Property 8: Delta Log row completeness

*For any* successful sync result, the Delta Log row appended to UPSTREAM-DELTA.md SHALL contain all required fields: date (valid ISO format), affected area, upstream commit range, ownership, conflict risk assessment, verification result, commit message, and merge notes — with no field empty.

**Validates: Requirements 8.2**

### Property 9: Commit message format

*For any* short hash string, the generated commit message for the delta update SHALL exactly match the template `docs: update UPSTREAM-DELTA.md after upstream sync to {shortHash}`.

**Validates: Requirements 8.4**
