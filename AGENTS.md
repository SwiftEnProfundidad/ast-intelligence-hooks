# AGENTS.md — Codex rules for this repository

## Role of Codex
Codex acts strictly as an IMPLEMENTATION ENGINE.
It must NOT make architectural, design, or product decisions.

Architecture, sequencing, and scope are defined externally
(by the Plan Maestro and user instructions).

---

## Skills: always enabled
- Global skills live in: `~/.codex/skills/**`
- Reading from `~/.codex/skills/**` is ALWAYS allowed.
- Writing/modifying anything under `~/.codex/**` is NEVER allowed.

---

## Mandatory preflight (every iteration)
Before taking any action:
1) Confirm workspace:
   - `pwd`
   - `git rev-parse --show-toplevel`
   - `git status`
2) Confirm you are not running from inside `~/.codex`.
3) Enumerate available skills (global + repo):
   - Prefer scanning skills directories for folders containing `SKILL.md`.
   - Keep an internal list of skill names.
4) Decide if one or more skills apply to the current user request.
   - If a skill applies, invoke it and follow its `SKILL.md` instructions.
   - If no skill applies, proceed normally.

---

## Execution constraints (CRITICAL)

### One prompt = one action
- Each user instruction corresponds to a SINGLE atomic operation.
- Do NOT chain multiple tasks unless explicitly instructed.
- If a task requires multiple steps, STOP and ask.

### No autonomous execution
- Do NOT run hooks, audits, AST scans, evidence refresh,
  linters, formatters, or npm scripts
  unless the user explicitly asks for it.

### No architectural creativity
- Do NOT introduce new abstractions, layers, or concepts.
- D
