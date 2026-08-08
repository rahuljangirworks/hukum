---
title: "Project Windsurf Rules"
scope: personal
tool: windsurf
updated: 2026-08-08
tags:
  - tool-context
  - personal-project
---

# Windsurf Operating Context

You are executing within a RahulOS project workspace. Follow these rules to ensure perfect coordination and automated discovery.

### 1. Boot Order
1. Read `AGENTS.md` and `.agent/BOOTSTRAP.md` immediately to load roles, rules, and platforms.
2. Read `CLAUDE.md` and `README-AI.md` to map the workspace directories and commands.
3. Read `PROJECT-STATE.md` as canonical state. `ACTIVE_TASK.md` and
   `STATE.json` are compatibility pointers only.
4. Run `.agent/workflows/WF-00-project-execution-loop.md`.

### 2. State & Handoff Maintenance
- `PROJECT-STATE.md` is the canonical stage, next action, blocker, and work
  claim truth.
- Do not duplicate those fields in `ACTIVE_TASK.md` or `STATE.json`.

### 3. Project Packet Approval Pack
- Project scope, PRD, POC, boss summary, client scope, and approval readiness are defined in `.agent/plan/PROJECT-PACKET.md`.
- Project phases, tasks, gates, and roadmap data are defined in `.agent/plan/PHASES.md`.
- Keep PROJECT-PACKET and PHASES clean and parseable for the central approval portal.
- Storing approval evidence belongs in `.agent/approvals/`. Never directly mutate `PROJECT-STATE.md` to fake stakeholder sign-off.
