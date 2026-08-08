# Implementation Plan: Upstream Sync Workflow

## Overview

A sequential pipeline of shell/git operations that syncs the Hukum fork (`dev` branch) with upstream traycer. Each task is a concrete, executable step an agent can perform using git, python3, and bun. The first task addresses the immediate need: populating UPSTREAM-DELTA.md with the complete fork inventory.

## Tasks

- [ ] 1. Update UPSTREAM-DELTA.md with complete fork inventory
  - [ ] 1.1 Scan repository and write Section 1 (Rahul-Owned Files)
    - Read the current UPSTREAM-DELTA.md at `/home/rahul/work/.work/04-personal-projacts/traycer/_agent/rules/UPSTREAM-DELTA.md`
    - Scan the repository for all fork-specific files using `git diff --name-only 6c45acda..HEAD` and directory listings
    - Populate Section 1 table with agent instruction files: `CLAUDE.md`, `AGENTS.md`, `.clinerules/`, `.cursor/`, `.cursorrules`, `.gemini/`, `.geminiignore`, `.windsurf/`, `.windsurfrules`, `.kilocode/`, `.kiro/`, `.hukum/`, `.hermes.md`, `.tanstack/`, `KILO.md`, `GEMINI.md`, `OPENCODE.md`, `QWEN.md`
    - Include state files: `ACTIVE_TASK.md`, `STATE.json`
    - Include scratch scripts: `check_db.js`, `fix_db.js`, `fix_exports.ts`, `fix_policy.ts`, `get_diff.js`, `patch_gui.ts`, `patch_registry.ts`, `query_daemon.js`, `query_db.js`, `rebrand.py`, `rename.py`, `test-*.ts/.js`, `test_*.ts/.js`
    - Each entry must have: path, category (`rahul-owned`), risk level (`low`), description
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 1.2 Write Section 2 (Shared Configuration) and Section 3 (Protected Patches)
    - Populate Section 2 with shared config files modified by the fork: `package.json`, `README.md`, `README-AI.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `nx.json`, `.gitignore`, ESLint configs
    - Each entry: path, category (`shared-config`), risk level (`medium`), description noting branding changes
    - Populate Section 3 with protected patches: `settings-store.ts` (defaultTerminalSelection), `landing-options.ts` (DEFAULT_TERMINAL_SELECTION), `composer-harness-memory-store.ts`, protocol TUI harness definitions, Brain protocol/stores/components
    - Each entry: path, category (`protected-patch`), risk level (`high`), description of fork-specific patch
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 1.3 Update UPSTREAM-DELTA.md frontmatter and Delta Log
    - Set `updated` field to today's date
    - Set `fork-base` to `6c45acda`
    - Append a Delta Log row recording the inventory update: date, area ("inventory update"), commit range (N/A), ownership (Rahul), risk (low), verification (N/A), commit message, notes
    - _Requirements: 1.4, 8.2, 8.3_

- [ ] 2. Checkpoint - Verify inventory completeness
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Fetch upstream and generate commit summary
  - [ ] 3.1 Fetch upstream remote
    - Execute `git fetch upstream`
    - If fetch fails, report error message and halt
    - _Requirements: 2.1, 2.4_

  - [ ] 3.2 Generate commit log summary
    - Run `git log --oneline --name-only 6c45acda..upstream/main` to get all commits since fork base
    - Parse output to extract: commit count, affected file paths (deduplicated), commit messages
    - Write a structured summary (markdown or inline) showing: total commits, files changed, commits touching fork inventory files flagged as potential conflicts
    - _Requirements: 2.2, 2.3_

- [ ] 4. Review upstream branches for overlap
  - [ ] 4.1 Review `upstream/traycer/provider-defaults` for overlap
    - Run `git diff upstream/main...upstream/traycer/provider-defaults --name-only` to get branch-specific changes
    - Compare against fork inventory files (especially protected patches: `settings-store.ts`, `landing-options.ts`)
    - Classify each overlap as: identical, compatible, or incompatible
    - Produce summary: file count, conflict count per classification, recommended resolution
    - _Requirements: 3.1, 3.3, 3.4_

  - [ ] 4.2 Review `upstream/feat/model-providers-protocol` for overlap
    - Run `git diff upstream/main...upstream/feat/model-providers-protocol --name-only` to get branch-specific changes
    - Compare against fork provider architecture files and Brain protocol files
    - Classify each overlap as: identical, compatible, or incompatible
    - Produce summary: file count, conflict count per classification, recommended resolution
    - _Requirements: 3.2, 3.3, 3.4_

- [ ] 5. Dry-run merge and select strategy
  - [ ] 5.1 Perform dry-run merge
    - Execute `git merge --no-commit --no-ff upstream/main` to attempt merge without committing
    - Count conflicting files from output (grep "CONFLICT" lines)
    - Execute `git merge --abort` to restore clean state
    - _Requirements: 4.1_

  - [ ] 5.2 Present strategy recommendation and await confirmation
    - If conflict count < 5: recommend rebase strategy
    - If conflict count >= 5: recommend merge strategy
    - Present conflict count, list of conflicting files, and recommended strategy to user
    - Wait for user confirmation before proceeding (decision gate)
    - _Requirements: 4.2, 4.3_

- [ ] 6. Execute merge/rebase
  - [ ] 6.1 Execute chosen strategy
    - If rebase confirmed: execute `git rebase upstream/main`
    - If merge confirmed: execute `git merge upstream/main`
    - If unresolvable conflicts arise: abort (`git merge --abort` or `git rebase --abort`), report conflicting files, and halt
    - _Requirements: 4.4, 4.5_

- [ ] 7. Resolve conflicts per ownership rules
  - [ ] 7.1 Auto-resolve conflicts using UPSTREAM-DELTA.md categories
    - For files in Section 1 (Rahul-Owned): `git checkout --ours <file> && git add <file>`
    - For files NOT in UPSTREAM-DELTA.md: `git checkout --theirs <file> && git add <file>`
    - For files in Section 3 (Protected Patches): attempt `git merge-file` preserving fork hunks, add result
    - For files in Section 2 (Shared Configuration): present both versions side-by-side, pause for manual resolution
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 7.2 Complete merge/rebase after resolution
    - If merge: `git commit` (with auto-generated merge message)
    - If rebase: `git rebase --continue` after each conflict resolution step
    - Verify clean working tree with `git status`
    - _Requirements: 4.4_

- [ ] 8. Checkpoint - Confirm merge completed cleanly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Reapply rebrand via rebrand.py
  - [ ] 9.1 Execute rebrand script
    - Run `python3 rebrand.py`
    - If exit code is non-zero: report stderr, present proceed/abort choice to user
    - On success: report count of files modified (from git status or script output)
    - _Requirements: 6.1, 6.2, 6.4_

  - [ ] 9.2 Commit rebrand changes
    - Stage all changes: `git add -A`
    - Commit with message: `chore: reapply Hukum rebrand after upstream sync`
    - _Requirements: 6.3_

- [ ] 10. Run verification suite
  - [ ] 10.1 Execute compile step
    - Run `bun run compile`
    - If fails: report error output and failing files, halt pipeline
    - _Requirements: 7.1, 7.4_

  - [ ] 10.2 Execute lint step
    - Run `bun run lint`
    - If fails: report error output and failing files, halt pipeline
    - _Requirements: 7.2, 7.4_

  - [ ] 10.3 Execute test step
    - Run `bun run test`
    - If fails: report error output and failing files, halt pipeline
    - On success: report successful sync status with summary of commits integrated and files modified
    - _Requirements: 7.3, 7.4, 7.5_

- [ ] 11. Update UPSTREAM-DELTA.md sync status and commit
  - [ ] 11.1 Update UPSTREAM-DELTA.md with sync results
    - Update frontmatter: set `updated` to today's date, set `fork-base` to new merge/rebase result commit hash
    - Append Delta Log row: date, area ("upstream sync"), commit range (`6c45acda..<new-upstream-head-short>`), ownership (Rahul), risk assessment, verification result (pass/fail), commit message, merge notes
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 11.2 Commit the UPSTREAM-DELTA.md update
    - Stage UPSTREAM-DELTA.md: `git add <path-to-UPSTREAM-DELTA.md>`
    - Commit with message: `docs: update UPSTREAM-DELTA.md after upstream sync to <short-hash>`
    - _Requirements: 8.4_

- [ ] 12. Final checkpoint - Confirm workflow complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- This is an operational workflow, not a compiled application. Each task is a sequence of shell/git commands.
- Decision gates at tasks 5.2 (strategy selection) and 7.1 (manual resolution for shared config) require user input.
- All merge/rebase operations are non-destructive — failures trigger abort commands that restore the pre-workflow state.
- The fork base commit `6c45acda` and upstream HEAD `4fc70b36` are current values; tasks use these as starting points.
- `rebrand.py` must be run AFTER merge/rebase to re-apply branding over newly-merged upstream code.
- Verification steps run in strict order: compile → lint → test. Each step depends on the previous passing.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["3.1"] },
    { "id": 4, "tasks": ["3.2", "4.1", "4.2"] },
    { "id": 5, "tasks": ["5.1"] },
    { "id": 6, "tasks": ["5.2"] },
    { "id": 7, "tasks": ["6.1"] },
    { "id": 8, "tasks": ["7.1"] },
    { "id": 9, "tasks": ["7.2"] },
    { "id": 10, "tasks": ["9.1"] },
    { "id": 11, "tasks": ["9.2"] },
    { "id": 12, "tasks": ["10.1"] },
    { "id": 13, "tasks": ["10.2"] },
    { "id": 14, "tasks": ["10.3"] },
    { "id": 15, "tasks": ["11.1"] },
    { "id": 16, "tasks": ["11.2"] }
  ]
}
```
