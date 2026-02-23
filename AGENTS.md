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

<!-- BEGIN CODEX SKILLS -->
## Codex Skills (local + vendorizado)

- Precedencia: `AGENTS.md > codex skills > prompts de fase`
- Regla operativa:
  - Al inicio de cualquier fase, usar primero los archivos vendorizados en `docs/codex-skills/*.md` si existen.
  - Si no existen, intentar leer las rutas locales.
  - Aplicar reglas de las skills siempre que no contradigan `AGENTS.md`.

- Skills sincronizadas:
  - `windsurf-rules-android`:
    - Local: `/Users/juancarlosmerlosalbarracin/.codex/skills/public/windsurf-rules-android/SKILL.md`
    - Vendorizada: `docs/codex-skills/windsurf-rules-android.md`
  - `windsurf-rules-backend`:
    - Local: `/Users/juancarlosmerlosalbarracin/.codex/skills/public/windsurf-rules-backend/SKILL.md`
    - Vendorizada: `docs/codex-skills/windsurf-rules-backend.md`
  - `windsurf-rules-frontend`:
    - Local: `/Users/juancarlosmerlosalbarracin/.codex/skills/public/windsurf-rules-frontend/SKILL.md`
    - Vendorizada: `docs/codex-skills/windsurf-rules-frontend.md`
  - `windsurf-rules-ios`:
    - Local: `/Users/juancarlosmerlosalbarracin/.codex/skills/public/windsurf-rules-ios/SKILL.md`
    - Vendorizada: `docs/codex-skills/windsurf-rules-ios.md`
  - `swift-concurrency`:
    - Local: `/Users/juancarlosmerlosalbarracin/.codex/skills/swift-concurrency/SKILL.md`
    - Vendorizada: `docs/codex-skills/swift-concurrency.md`
  - `swiftui-expert-skill`:
    - Local: `/Users/juancarlosmerlosalbarracin/.codex/skills/swiftui-expert-skill/SKILL.md`
    - Vendorizada: `docs/codex-skills/swiftui-expert-skill.md`

- Sync: `./scripts/sync-codex-skills.sh`
<!-- END CODEX SKILLS -->
