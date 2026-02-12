# CLAUDE.md — High-Level Agent Guide

## Core Sources of Truth

- `project-state.yaml` — overall snapshot of the current project state
- `tasks.yaml` — backlog & task metadata
- `PRD.md` — requirements & architecture decisions
- Session logs (`logs/sessions/...`) — orchestrator reads outcomes

> Use these files as context. They are **read-only sources of truth** unless instructed otherwise.

## Agent Responsibilities

**✅ Agents may:**

- Read context from YAML, PRD, and existing code/tests
- Modify source and test files
- Fill out pre-created session results
- Write bug/failure reports
- Execute environment-specific commands for building/testing/linting

**❌ Agents must never:**

- Run Git commands or touch state YAMLs
- Move/delete logs

**Rule of thumb:** Agents are **stateless executors**. Orchestrator handles Git, YAML, retries, and archiving.

## Ambiguity & Blockers

1. Check PRD → SKILL.md → code patterns → acceptance criteria
2. Still unclear? → write `ACTIVE_FAILURE.md` (logs\failures\FAILURE_REPORT_TEMPLATE.md), `outcome: FAILURE`, exit
3. Encounter blocking bug outside task? → write `ACTIVE_BUG.md` (logs\bugs\BUG_REPORT_TEMPLATE.md), `outcome: BUG`, exit

> Never guess architectural or business logic decisions.

## Session Results

- The orchestrator **pre-creates** your session summary file and provides its path in the activation prompt.
- Fill out the frontmatter fields and markdown sections — do **not** create the file yourself.

**Outcomes:** `SUCCESS` | `FAILURE` | `BUG` | `EPIC_COMPLETE`

> The orchestrator reads frontmatter to decide next steps — **not stdout or return codes**.

## Quick Navigation Flow

1. **CLAUDE.md** — high-level rules & sources of truth
2. **PRD.md** — product requirements & design guidance
3. **Knowledge Base** (/docs/kb/) — architecture, patterns, lessons learned

**Remember:**

- Agents read context, write code/reports, report outcomes
- Orchestrator manages Git, state, archiving, retries
- Exit cleanly with proper session result
- Never run dev servers or modify orchestration-controlled files
