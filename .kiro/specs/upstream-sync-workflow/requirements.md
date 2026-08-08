# Requirements Document

## Introduction

This specification defines a repeatable upstream sync workflow for the Hukum fork of traycer. The workflow covers fetching upstream changes, reviewing branch overlaps, resolving conflicts, preserving fork-specific customizations (rebrand, Brain system, provider integrations), and verifying the merged state. It is designed to be re-executed each time the upstream repository advances beyond the current fork base.

## Glossary

- **Sync_Workflow**: The automated sequence of steps that brings the Hukum fork up to date with upstream traycer changes while preserving fork-specific modifications.
- **UPSTREAM-DELTA**: The markdown document that inventories all fork-specific files, patches, and architectural decisions, located at `.agent/rules/UPSTREAM-DELTA.md`.
- **Fork_Inventory**: The complete catalog of files and modifications owned by the Hukum fork that do not exist upstream or diverge from upstream.
- **Upstream_Remote**: The git remote pointing to the original traycer repository (`upstream`), tracking `upstream/main`.
- **Dev_Branch**: The primary development branch of the Hukum fork (`dev`), where upstream changes are integrated.
- **Fork_Base**: The commit hash at which the fork diverged from upstream (currently `6c45acda`).
- **Rebrand_Patch**: The set of changes that replace all Traycer branding with Hukum branding, re-applicable via `rebrand.py`.
- **Overlap_Review**: The process of comparing an upstream branch against fork-owned modifications to identify conflicting changes in the same code areas.
- **Conflict_Strategy**: The decision (merge or rebase) made at runtime based on the severity and count of merge conflicts.
- **Verification_Suite**: The combination of typecheck, lint, and focused test commands that confirm a successful merge.

## Requirements

### Requirement 1: Fork Inventory Update

**User Story:** As a fork maintainer, I want the UPSTREAM-DELTA.md to contain a complete inventory of all fork-specific assets, so that I can track what needs protection during any upstream sync.

#### Acceptance Criteria

1. WHEN the Sync_Workflow is initiated, THE Sync_Workflow SHALL update UPSTREAM-DELTA.md Section 1 (Rahul-Owned Files) with all fork-specific files including agent instruction files, Kiro spec directories, Brain protocol mirror files, provider integration files, terminal default configurations, scratch scripts, and Brain graph UI components.
2. WHEN a new fork-specific file is added to the repository, THE Sync_Workflow SHALL append an entry to the Fork_Inventory in UPSTREAM-DELTA.md with file path, ownership category, and conflict risk level.
3. THE Sync_Workflow SHALL categorize each Fork_Inventory entry into one of: Rahul-Owned Files, Shared Configuration, or Protected Patches.
4. WHEN the Fork_Inventory update is complete, THE Sync_Workflow SHALL record the update timestamp in the Delta Log table.

### Requirement 2: Upstream Fetch and Review

**User Story:** As a fork maintainer, I want to fetch and review all upstream changes since the last sync, so that I can understand what is incoming before attempting a merge.

#### Acceptance Criteria

1. WHEN the Sync_Workflow begins the fetch phase, THE Sync_Workflow SHALL execute `git fetch upstream` to retrieve the latest state of Upstream_Remote.
2. WHEN the fetch completes, THE Sync_Workflow SHALL generate a commit log summary between the Fork_Base and `upstream/main` showing commit count, affected file paths, and commit messages.
3. WHEN the commit log is generated, THE Sync_Workflow SHALL identify commits that touch files listed in the Fork_Inventory and flag them as potential conflict sources.
4. IF the fetch from Upstream_Remote fails due to network or authentication errors, THEN THE Sync_Workflow SHALL report the failure with the error message and halt the workflow.

### Requirement 3: Branch Overlap Review

**User Story:** As a fork maintainer, I want to review specific upstream feature branches for overlap with my completed fork work, so that I can anticipate and plan conflict resolution.

#### Acceptance Criteria

1. WHEN a branch overlap review is requested for `upstream/traycer/provider-defaults`, THE Sync_Workflow SHALL compare the branch diff against files modified by the terminal-provider-fix-and-defaults spec and report overlapping file paths.
2. WHEN a branch overlap review is requested for `upstream/feat/model-providers-protocol`, THE Sync_Workflow SHALL compare the branch diff against the fork provider architecture files and report overlapping file paths and function signatures.
3. WHEN an Overlap_Review identifies conflicting changes, THE Sync_Workflow SHALL classify each conflict as: identical (upstream implemented same change), compatible (changes in non-overlapping sections), or incompatible (changes in overlapping sections with different intent).
4. THE Sync_Workflow SHALL produce a summary report for each reviewed branch listing file count, conflict count per classification, and a recommended resolution approach.

### Requirement 4: Merge Strategy Selection

**User Story:** As a fork maintainer, I want the workflow to support both merge and rebase strategies with runtime selection, so that I can choose the approach that best fits the current conflict situation.

#### Acceptance Criteria

1. WHEN the Sync_Workflow reaches the integration phase, THE Sync_Workflow SHALL perform a dry-run merge of `upstream/main` into Dev_Branch to count conflicting files without modifying the working tree.
2. WHEN the dry-run reveals fewer than 5 conflicting files, THE Sync_Workflow SHALL recommend the rebase strategy and present the recommendation for confirmation.
3. WHEN the dry-run reveals 5 or more conflicting files, THE Sync_Workflow SHALL recommend the merge strategy and present the recommendation for confirmation.
4. WHEN the maintainer confirms the Conflict_Strategy, THE Sync_Workflow SHALL execute the chosen strategy (merge or rebase) against `upstream/main`.
5. IF the chosen strategy results in unresolvable conflicts during execution, THEN THE Sync_Workflow SHALL abort the operation, restore Dev_Branch to its pre-merge state, and report the conflicting files.

### Requirement 5: Conflict Resolution

**User Story:** As a fork maintainer, I want automated guidance for resolving merge conflicts, so that fork-specific changes are preserved while incorporating upstream improvements.

#### Acceptance Criteria

1. WHEN a merge conflict occurs in a file listed in UPSTREAM-DELTA.md Section 1 (Rahul-Owned Files), THE Sync_Workflow SHALL resolve the conflict by keeping the fork version entirely.
2. WHEN a merge conflict occurs in a file listed in UPSTREAM-DELTA.md Section 2 (Shared Configuration), THE Sync_Workflow SHALL present both versions side-by-side with the fork-specific modifications highlighted for manual resolution.
3. WHEN a merge conflict occurs in a file listed in UPSTREAM-DELTA.md Section 3 (Protected Patches), THE Sync_Workflow SHALL attempt to preserve the fork patch while accepting upstream structural changes around the patched sections.
4. WHEN a merge conflict occurs in a file not listed in UPSTREAM-DELTA.md, THE Sync_Workflow SHALL accept the upstream version.

### Requirement 6: Rebrand Patch Reapplication

**User Story:** As a fork maintainer, I want the rebrand patch automatically reapplied after an upstream merge, so that all Traycer references are replaced with Hukum branding.

#### Acceptance Criteria

1. WHEN the merge or rebase completes successfully, THE Sync_Workflow SHALL execute `rebrand.py` to reapply the Hukum branding across the codebase.
2. WHEN `rebrand.py` execution completes, THE Sync_Workflow SHALL report the count of files modified by the rebrand.
3. WHEN `rebrand.py` modifies files, THE Sync_Workflow SHALL create a dedicated commit with the message `chore: reapply Hukum rebrand after upstream sync`.
4. IF `rebrand.py` encounters errors during execution, THEN THE Sync_Workflow SHALL report the errors and allow the maintainer to proceed or abort.

### Requirement 7: Post-Merge Verification

**User Story:** As a fork maintainer, I want automated verification that the merged codebase compiles, passes lint, and tests succeed, so that I can confirm the sync did not introduce regressions.

#### Acceptance Criteria

1. WHEN the rebrand commit is created, THE Sync_Workflow SHALL execute the TypeScript type checker across all workspace packages using `bun run compile`.
2. WHEN the typecheck passes, THE Sync_Workflow SHALL execute the linter across all workspace packages using `bun run lint`.
3. WHEN the lint passes, THE Sync_Workflow SHALL execute the test suite using `bun run test`.
4. IF any verification step fails, THEN THE Sync_Workflow SHALL report the failing step, the error output, and the list of files involved in the failure.
5. WHEN all verification steps pass, THE Sync_Workflow SHALL report a successful sync status with a summary of commits integrated and files modified.

### Requirement 8: Delta Document Sync Status Update

**User Story:** As a fork maintainer, I want UPSTREAM-DELTA.md updated with the final sync status, so that future syncs have an accurate record of the last successful integration point.

#### Acceptance Criteria

1. WHEN all verification steps pass, THE Sync_Workflow SHALL update UPSTREAM-DELTA.md with the new Fork_Base commit hash (the merge/rebase result commit).
2. WHEN the sync completes, THE Sync_Workflow SHALL append a row to the Delta Log table recording: date, affected area (upstream sync), upstream commit range integrated, ownership (Rahul), conflict risk assessment for next sync, verification result, commit message, and merge notes.
3. THE Sync_Workflow SHALL update the `updated` field in the UPSTREAM-DELTA.md frontmatter to the current date.
4. WHEN the UPSTREAM-DELTA.md update is committed, THE Sync_Workflow SHALL use the commit message `docs: update UPSTREAM-DELTA.md after upstream sync to <short-hash>`.
