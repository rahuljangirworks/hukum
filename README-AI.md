---
title: "hukum Agentic Developer Experience"
project: "hukum"
scope: personal
status: active
updated: 2026-08-08
tags:
  - agentic-dev
  - personal-project
---

# Agentic Developer Experience (README-AI.md)

Welcome agent. This project is configured with the RahulOS multi-agent workspace standards.

## Project Blueprint
- **Entry Point**: Read `AGENTS.md` and `.agent/BOOTSTRAP.md` to load rules, roles, and platform conventions.
- **Project Packet**: Read `.agent/plan/PROJECT-PACKET.md` for the combined PM plan, PRD, POC, boss summary, and client scope.
- **Phases, Tasks & Roadmap**: Read `.agent/plan/PHASES.md` for phases, tasks, gates, roadmap data, and exit criteria.
- **Current State**: Read `PROJECT-STATE.md` for current phase, next action, blockers, approval state, and work claim.
- **Rules & Controls**: Read `PROJECT-CONTROLS.md` for tool access scopes and guardrails.

## State & Handoff Protocol
- **Canonical State**: Stage, next action, blockers, and work claim live only in
  `PROJECT-STATE.md`.
- **Compatibility Files**: `ACTIVE_TASK.md` and `STATE.json` point tools to the
  canonical state; they are not independent trackers.
- **Execution Loop**: Use
  `.agent/workflows/WF-00-project-execution-loop.md`.

## Build & Verification
Refer to `CLAUDE.md` for commands to compile, test, typecheck, and verify the repository code.
