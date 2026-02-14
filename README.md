# Pumuki AST Intelligence Framework

[![Version](https://img.shields.io/badge/version-6.3.6-1d4ed8)](package.json)
[![License](https://img.shields.io/badge/license-MIT-16a34a)](LICENSE)
[![Build](https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/workflows/ci.yml/badge.svg)](https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/node-%3E%3D18-0ea5e9)](package.json)
[![Evidence](https://img.shields.io/badge/evidence-v2.1-7c3aed)](docs/evidence-v2.1.md)

**Enterprise governance for AI-assisted code delivery**.

Pumuki convierte cambios de código en decisiones trazables y reproducibles:

`Facts -> Rules -> Gate -> ai_evidence v2.1`

Con esto, equipos enterprise obtienen una única fuente de verdad para decidir qué se bloquea, qué se advierte y por qué, en local y CI.

## Tabla de contenidos

- [Por qué Pumuki](#por-qué-pumuki)
- [Quick Start](#quick-start)
- [Automático vs manual (sin ambigüedades)](#automático-vs-manual-sin-ambigüedades)
- [Ciclo de vida del software](#ciclo-de-vida-del-software)
- [Referencia de comandos y uso](#referencia-de-comandos-y-uso)
- [MCP: instalación y configuración JSON](#mcp-instalación-y-configuración-json)
- [Arquitectura y filosofía](#arquitectura-y-filosofía)
- [Contribución y soporte](#contribución-y-soporte)
- [Referencias](#referencias)

## Por qué Pumuki

### Problema real en equipos grandes

- Reglas inconsistentes entre local y CI.
- Dificultad para auditar decisiones técnicas.
- Drift de configuración entre plataformas.
- Incidencias operativas sin trazabilidad reproducible.

### Qué resuelve Pumuki

- Políticas de gate por etapa (`PRE_COMMIT`, `PRE_PUSH`, `CI`).
- Reglas versionadas y bloqueadas (`skills.lock.json`).
- Evidencia determinística (`.ai_evidence.json`).
- Operación guiada por runbooks para triage, closure y handoff.

### Dónde encaja mejor

- Repos multiplaforma (`ios`, `backend`, `frontend`, `android`).
- Equipos con requisitos de compliance y auditoría.
- Entornos con alta frecuencia de cambios y uso de IA.

## Quick Start

### Prerrequisitos

- `Node.js >= 18.0.0`
- `npm >= 9.0.0`
- `git`

### Instalación

```bash
git clone https://github.com/SwiftEnProfundidad/ast-intelligence-hooks.git
cd ast-intelligence-hooks
npm ci
```

### Verificación mínima

```bash
npm run typecheck
npm run test:deterministic
npm run validation:package-manifest
```

### Primera ejecución

```bash
npm run framework:menu
```

## Automático vs manual (sin ambigüedades)

### Automático

El flujo principal está automatizado:

- extracción de facts,
- evaluación de rules,
- aplicación de gate,
- generación de `ai_evidence v2.1`,
- ejecución en workflows CI.

### Manual

Los comandos `validation:*` son operativos y se ejecutan cuando hay runbooks de diagnóstico/cierre/handoff.

Ejemplos:

- `validation:consumer-startup-triage`
- `validation:phase5-execution-closure`
- `validation:phase8:*`
- `validation:adapter-*`

Regla práctica:

- Desarrollo normal: pipeline automático + tests.
- Incidente/rollout: comandos manuales del runbook.

## Ciclo de vida del software

### Instalación (fresh setup)

```bash
npm ci
npm run typecheck
npm run test:deterministic
npm run skills:lock:check
```

### Upgrade

```bash
git pull
npm ci
npm run skills:lock:check
npm run validation:docs-hygiene
npm run test:deterministic
```

### Uninstall (limpieza local)

```bash
rm -rf node_modules
rm -rf .audit-reports
```

Si tenías guardias legacy activos:

```bash
npm run ast:guard:stop
```

### Conflictos de dependencias

| Síntoma | Causa habitual | Acción recomendada |
| --- | --- | --- |
| local != CI | lock de skills desalineado | `npm run skills:lock:check` |
| TSX no arranca | Node incompatible | actualizar a Node `>=18` |
| fallos tras upgrade | lockfile/node_modules inconsistentes | `rm -rf node_modules package-lock.json && npm install` |
| ruido en docs/artefactos | residuos en `.audit-reports` | `npm run validation:clean-artifacts -- --dry-run` |

## Referencia de comandos y uso

Nota de uso de flags en npm scripts:

```bash
npm run <script> -- <flags>
```

### Core, CLI y framework

| Comando | Descripción | Ejemplo |
| --- | --- | --- |
| `npm run install-hooks` | instala hooks/binarios del framework | `npm run install-hooks` |
| `npm run check-version` | verifica versión runtime | `npm run check-version` |
| `npm run audit` | ejecuta CLI AST | `npm run audit -- --help` |
| `npm run ast` | alias CLI AST | `npm run ast -- --help` |
| `npm run framework:menu` | menú operativo interactivo | `npm run framework:menu` |
| `npm run mcp:evidence` | inicia servidor MCP read-only de evidencia | `npm run mcp:evidence` |
| `npm run violations` | CLI de violaciones | `npm run violations -- --help` |
| `npm run violations:list` | lista violaciones | `npm run violations:list` |
| `npm run violations:show` | muestra una violación | `npm run violations:show -- <id>` |
| `npm run violations:summary` | resumen agregado | `npm run violations:summary` |
| `npm run violations:top` | top de violaciones | `npm run violations:top` |

### Calidad y pruebas

| Comando | Descripción | Ejemplo |
| --- | --- | --- |
| `npm run typecheck` | typecheck TS sin emitir | `npm run typecheck` |
| `npm run test` | suite Jest general | `npm run test` |
| `npm run test:evidence` | tests de evidencia | `npm run test:evidence` |
| `npm run test:mcp` | tests de MCP | `npm run test:mcp` |
| `npm run test:heuristics` | tests de heurísticas AST | `npm run test:heuristics` |
| `npm run test:stage-gates` | tests de políticas/stages | `npm run test:stage-gates` |
| `npm run test:deterministic` | baseline determinístico recomendado | `npm run test:deterministic` |
| `npm run validation:package-manifest` | valida manifest de paquete | `npm run validation:package-manifest` |
| `npm run validation:package-smoke` | smoke install bloqueante | `npm run validation:package-smoke` |
| `npm run validation:package-smoke:minimal` | smoke install mínimo | `npm run validation:package-smoke:minimal` |
| `npm run validation:docs-hygiene` | guardrail de docs | `npm run validation:docs-hygiene` |
| `npm run validation:clean-artifacts -- --dry-run` | limpieza simulada de artefactos | `npm run validation:clean-artifacts -- --dry-run` |
| `npm run skills:compile` | compila lock de skills | `npm run skills:compile` |
| `npm run skills:lock:check` | verifica lock de skills | `npm run skills:lock:check` |

### Consumer diagnostics y soporte

| Comando | Flags principales | Ejemplo |
| --- | --- | --- |
| `validation:consumer-ci-artifacts` | `--repo --limit --out` | `npm run validation:consumer-ci-artifacts -- --repo <owner>/<repo> --limit 20 --out .audit-reports/consumer-triage/consumer-ci-artifacts-report.md` |
| `validation:consumer-ci-auth-check` | `--repo --out` | `npm run validation:consumer-ci-auth-check -- --repo <owner>/<repo> --out .audit-reports/consumer-triage/consumer-ci-auth-check.md` |
| `validation:consumer-workflow-lint` | `--repo-path --actionlint-bin --out` | `npm run validation:consumer-workflow-lint -- --repo-path /path/repo --actionlint-bin /tmp/actionlint --out .audit-reports/consumer-triage/consumer-workflow-lint-report.md` |
| `validation:consumer-support-bundle` | `--repo --limit --out` | `npm run validation:consumer-support-bundle -- --repo <owner>/<repo> --limit 20 --out .audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md` |
| `validation:consumer-support-ticket-draft` | `--repo --support-bundle --auth-report --out` | `npm run validation:consumer-support-ticket-draft -- --repo <owner>/<repo> --support-bundle .audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md --auth-report .audit-reports/consumer-triage/consumer-ci-auth-check.md --out .audit-reports/consumer-triage/consumer-support-ticket-draft.md` |
| `validation:consumer-startup-unblock-status` | `--repo --support-bundle --auth-report --workflow-lint-report --out` | `npm run validation:consumer-startup-unblock-status -- --repo <owner>/<repo> --support-bundle .audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md --auth-report .audit-reports/consumer-triage/consumer-ci-auth-check.md --workflow-lint-report .audit-reports/consumer-triage/consumer-workflow-lint-report.md --out .audit-reports/consumer-triage/consumer-startup-unblock-status.md` |
| `validation:consumer-startup-triage` | `--repo --out-dir [--skip-workflow-lint]` | `npm run validation:consumer-startup-triage -- --repo SwiftEnProfundidad/pumuki-actions-healthcheck-temp --out-dir .audit-reports/consumer-triage-temp --skip-workflow-lint` |

### Phase 5 (closure/handoff)

| Comando | Flags principales | Ejemplo |
| --- | --- | --- |
| `validation:phase5-blockers-readiness` | `--consumer-triage-report --out [--require-adapter-report --adapter-report]` | `npm run validation:phase5-blockers-readiness -- --consumer-triage-report .audit-reports/consumer-triage/consumer-startup-triage-report.md --out .audit-reports/phase5/phase5-blockers-readiness.md` |
| `validation:phase5-execution-closure-status` | `--phase5-blockers-report --consumer-unblock-report --out` | `npm run validation:phase5-execution-closure-status -- --phase5-blockers-report .audit-reports/phase5/phase5-blockers-readiness.md --consumer-unblock-report .audit-reports/consumer-triage/consumer-startup-unblock-status.md --out .audit-reports/phase5/phase5-execution-closure-status.md` |
| `validation:phase5-execution-closure` | `--repo --out-dir [--mock-consumer] [--skip-workflow-lint] [--skip-auth-preflight]` | `npm run validation:phase5-execution-closure -- --repo SwiftEnProfundidad/pumuki-actions-healthcheck-temp --out-dir .audit-reports/phase5 --mock-consumer` |
| `validation:phase5-external-handoff` | `--repo [--require-mock-ab-report] [--require-artifact-urls] [--artifact-url] [--out]` | `npm run validation:phase5-external-handoff -- --repo SwiftEnProfundidad/pumuki-actions-healthcheck-temp --require-mock-ab-report` |
| `validation:phase5-latest:refresh` | (script shell) | `npm run validation:phase5-latest:refresh` |
| `validation:phase5-latest:sync-docs` | (script shell) | `npm run validation:phase5-latest:sync-docs` |
| `validation:phase5-latest:ready-check` | (script shell) | `npm run validation:phase5-latest:ready-check` |
| `validation:phase5-post-support:refresh` | (script shell) | `npm run validation:phase5-post-support:refresh` |

### Phase 8 (operations, anti-loop, status)

| Comando | Flags principales | Ejemplo |
| --- | --- | --- |
| `validation:phase8:resume-after-billing` | (script shell) | `npm run validation:phase8:resume-after-billing` |
| `validation:phase8:next-step` | (script shell) | `npm run validation:phase8:next-step` |
| `validation:phase8:doctor` | (script shell) | `npm run validation:phase8:doctor` |
| `validation:phase8:autopilot` | (script shell) | `npm run validation:phase8:autopilot` |
| `validation:phase8:status-pack` | (script shell) | `npm run validation:phase8:status-pack` |
| `validation:phase8:tick` | (script shell) | `npm run validation:phase8:tick` |
| `validation:phase8:loop-guard` | (script shell) | `npm run validation:phase8:loop-guard` |
| `validation:phase8:loop-guard-coverage` | (script shell) | `npm run validation:phase8:loop-guard-coverage` |
| `validation:phase8:mark-followup-state` | `<ticket_id> <posted_by> <POSTED_WAITING_REPLY\|SUPPORT_REPLIED> [posted_at] [reply_at] [summary]` | `npm run validation:phase8:mark-followup-state -- 4077449 juancarlosmerlosalbarracin POSTED_WAITING_REPLY` |
| `validation:phase8:mark-followup-posted-now` | `<posted_by> [ticket_id] [posted_at]` | `npm run validation:phase8:mark-followup-posted-now -- juancarlosmerlosalbarracin 4077449` |
| `validation:phase8:mark-followup-replied-now` | `<posted_by> <summary> [ticket_id] [posted_at] [reply_at]` | `npm run validation:phase8:mark-followup-replied-now -- juancarlosmerlosalbarracin "support replied" 4077449` |
| `validation:phase8:ready-handoff` | (script shell) | `npm run validation:phase8:ready-handoff` |
| `validation:phase8:close-ready` | (script shell) | `npm run validation:phase8:close-ready` |

### Adapter readiness y legacy compatibility

| Comando | Descripción |
| --- | --- |
| `validation:adapter-session-status` | status de sesión adapter |
| `validation:adapter-real-session-report` | reporte de sesión real |
| `validation:adapter-readiness` | readiness final del adapter |
| `validate:adapter-hooks-local` | validación local legacy |
| `print:adapter-hooks-config` | imprime config legacy |
| `install:adapter-hooks-config` | instala config legacy |
| `verify:adapter-hooks-runtime` | verifica runtime legacy |
| `assess:adapter-hooks-session` | evalúa sesión legacy |
| `assess:adapter-hooks-session:any` | evalúa sesión legacy con simuladas |

## MCP: instalación y configuración JSON

### ¿Es obligatorio MCP para usar Pumuki?

No.

- El core de Pumuki no requiere registrar MCP en JSON.
- MCP es una capacidad adicional para clientes/agentes externos.

### Arrancar MCP local

```bash
npm run mcp:evidence
```

### Configuración JSON (cuando tu cliente lo pida)

```json
{
  "mcpServers": {
    "pumuki-evidence": {
      "command": "npm",
      "args": ["run", "mcp:evidence"],
      "cwd": "/absolute/path/to/ast-intelligence-hooks"
    }
  }
}
```

### Endpoints disponibles

- `GET /health`
- `GET /status`
- `GET /ai-evidence`
- `GET /ai-evidence?includeSuppressed=false`
- `GET /ai-evidence?view=compact`
- `GET /ai-evidence?view=full`

## Arquitectura y filosofía

### Principios

- Determinismo primero.
- Separación de capas estricta (`core` vs `integrations`).
- Trazabilidad de reglas y evidencias.
- Operación basada en runbooks, no en improvisación.

### Estructura técnica

- `core/facts/*`: facts AST/semánticos.
- `core/rules/*`: reglas y heurísticas.
- `core/gate/*`: decisión final de política.
- `integrations/git/*`: runners por stage/scope.
- `integrations/gate/stagePolicies.ts`: umbrales por etapa.
- `integrations/evidence/*`: evidencia determinística.
- `integrations/platform/*`: detección de plataformas.
- `integrations/mcp/*`: API de evidencia read-only.

### Política por etapa

- `PRE_COMMIT`: block `CRITICAL`, warn `ERROR`.
- `PRE_PUSH`: block `ERROR`, warn `WARN`.
- `CI`: block `ERROR`, warn `WARN`.

### Workflows CI

- `.github/workflows/ci.yml`
- `.github/workflows/pumuki-ios.yml`
- `.github/workflows/pumuki-backend.yml`
- `.github/workflows/pumuki-frontend.yml`
- `.github/workflows/pumuki-android.yml`
- `.github/workflows/pumuki-gate-template.yml`
- `.github/workflows/pumuki-evidence-tests.yml`
- `.github/workflows/pumuki-heuristics-tests.yml`
- `.github/workflows/pumuki-package-smoke.yml`
- `.github/workflows/pumuki-phase5-mock.yml`

## Contribución y soporte

### Contribución

Checklist recomendado antes de PR:

```bash
npm ci
npm run typecheck
npm run test:deterministic
npm run validation:docs-hygiene
npm run skills:lock:check
```

Reglas:

- No romper determinismo de `.ai_evidence.json`.
- Mantener paridad local/CI.
- Añadir test cuando cambia comportamiento.
- Actualizar documentación si añades/modificas comandos.

### Soporte y documentación

- `docs/README.md`
- `docs/validation/README.md`
- `docs/evidence-v2.1.md`
- `docs/MCP_EVIDENCE_CONTEXT_SERVER.md`
- `docs/TODO.md`
- `docs/REFRACTOR_PROGRESS.md`

## Referencias

- Guía didáctica profunda: `PUMUKI.md`
- Rule packs: `docs/rule-packs/README.md`
- Release notes: `docs/RELEASE_NOTES.md`
- Changelog: `CHANGELOG.md`

<!-- BEGIN CODEX SKILLS README -->
## Codex Skills

- Fuente portable: `docs/codex-skills/*.md`
- Fallback local: `~/.codex/skills/**`

Sync:

```bash
./scripts/sync-codex-skills.sh
```

<!-- END CODEX SKILLS README -->
