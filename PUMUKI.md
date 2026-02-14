# PUMUKI Playbook — Enterprise Governance made Practical

Este documento es la guía completa (didáctica + operativa) para entender y operar Pumuki sin ambigüedades.

Objetivo: que un perfil junior pueda ejecutar el framework con criterio de producción.

## 1) Qué es Pumuki (en una frase)

Pumuki es un framework de gobernanza determinística que convierte cambios de código en decisiones auditables de calidad y riesgo.

Pipeline:

`Facts -> Rules -> Gate -> ai_evidence v2.1`

## 2) Qué problema soluciona

En equipos enterprise, el problema no es solo detectar errores, sino tener una decisión consistente entre:

- local,
- hooks,
- CI,
- y operación externa.

Pumuki resuelve eso con:

- reglas versionadas y bloqueadas,
- políticas por etapa,
- evidencia determinística,
- runbooks para incidentes y handoff.

## 3) Qué está automatizado vs qué es manual

### Automatizado

- Extracción de facts.
- Evaluación de rules.
- Gate por etapa (`PRE_COMMIT`, `PRE_PUSH`, `CI`).
- Emisión de `.ai_evidence.json`.
- Ejecución CI en workflows del repo.

### Manual (intencional)

Los comandos `validation:*` son para operación dirigida:

- triage,
- closure,
- handoff,
- diagnósticos de adapter,
- controles de rollout.

Regla de oro:

- desarrollo normal -> automático,
- incidente/rollout -> manual por runbook.

## 4) MCP: cuándo hace falta y cuándo no

### No hace falta MCP JSON para usar el core

Puedes usar Pumuki completo sin registrar servidores MCP en ningún JSON.

### Sí hace falta MCP JSON si quieres integración con clientes externos

Si vas a consumir evidencia desde cliente MCP/agentic, registra servidor:

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

Arranque local:

```bash
npm run mcp:evidence
```

## 5) Arquitectura de referencia

- `core/facts/*`: hechos AST/semánticos.
- `core/rules/*`: reglas y heurísticas.
- `core/gate/*`: decisión final.
- `integrations/git/*`: scopes y runners de stage.
- `integrations/gate/stagePolicies.ts`: umbrales por etapa.
- `integrations/evidence/*`: evidencia determinística.
- `integrations/platform/*`: detección de plataforma.
- `integrations/mcp/*`: servidor read-only de evidencia.

## 6) Ciclo de vida operativo paso a paso

1. Cambias código.
2. Pumuki extrae facts.
3. Evalúa rules/packs versionados.
4. Aplica gate según etapa.
5. Emite evidencia.
6. Si hay bloqueo operativo, ejecutas comandos `validation:*` del runbook.
7. Documentas salida en artefactos `.audit-reports/*`.

## 7) Runbook mínimo para junior

### Setup

```bash
npm ci
npm run typecheck
npm run test:deterministic
npm run skills:lock:check
```

### Caso práctico A — Startup triage mock

```bash
npm run validation:consumer-startup-triage -- \
  --repo SwiftEnProfundidad/pumuki-actions-healthcheck-temp \
  --out-dir .audit-reports/consumer-triage-temp \
  --skip-workflow-lint
```

### Caso práctico B — Execution closure mock (Phase5)

```bash
npm run validation:phase5-execution-closure -- \
  --repo SwiftEnProfundidad/pumuki-actions-healthcheck-temp \
  --out-dir .audit-reports/phase5 \
  --mock-consumer
```

### Caso práctico C — Handoff externo

```bash
npm run validation:phase5-external-handoff -- \
  --repo SwiftEnProfundidad/pumuki-actions-healthcheck-temp \
  --require-mock-ab-report
```

### Caso práctico D — Diagnóstico de estado externo (Phase8)

```bash
npm run validation:phase8:doctor
npm run validation:phase8:status-pack
```

### Caso práctico E — Adapter readiness

```bash
npm run validation:adapter-session-status -- --out .audit-reports/adapter/adapter-session-status.md
npm run validation:adapter-real-session-report -- --status-report .audit-reports/adapter/adapter-session-status.md --out .audit-reports/adapter/adapter-real-session-report.md
npm run validation:adapter-readiness -- --adapter-report .audit-reports/adapter/adapter-real-session-report.md --out .audit-reports/adapter/adapter-readiness.md
```

## 8) Cómo evitar bucles operativos

- No abras subtareas técnicas cuando el bloqueo es externo.
- Marca estado en runbook/handoff y espera evento real.
- Si el frente deja de ser prioridad, ciérralo explícitamente como `de-scoped`.

## 9) Checklist de comprensión total

Debes poder responder “sí” a esto:

- ¿Diferencio automático vs manual?
- ¿Sé cuándo necesito MCP JSON?
- ¿Sé ejecutar triage y closure mock end-to-end?
- ¿Sé dónde leer evidencia y estado (`.ai_evidence.json`, `.audit-reports/*`)?
- ¿Sé mapear cada problema al comando correcto?

## 10) Resumen ejecutivo

Pumuki reduce riesgo de entrega porque convierte calidad en un sistema reproducible:

- técnico,
- auditable,
- operativo,
- y escalable para equipos enterprise.

Si quieres una visión breve, usa `README.md`.
Si quieres operar con confianza, usa este playbook.
