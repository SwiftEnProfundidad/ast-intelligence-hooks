# Validation Docs

Este directorio contiene solo documentación estable de validación y runbooks oficiales.

## Documentación vigente

- `adapter-hook-runtime-runbook.md`
- `ast-intelligence-validation-roadmap.md`
- `full-repo-detection-audit-baseline.md`
- `enterprise-consumer-isolation-policy.md`
- `mock-consumer-integration-runbook.md`
- `consumer-repositories-skills-rollout-validation.md`
- `ios-avdlee-parity-matrix.md`

## Estado de seguimiento

- Única fuente de seguimiento: `docs/tracking/plan-activo-de-trabajo.md`

## Política de higiene

- `docs/validation/` no guarda reportes temporales.
- Los artefactos efímeros se generan fuera de `docs/` y deben limpiarse antes de cerrar un ciclo:
  - `.audit-reports/**`
  - `.coverage/**`
  - `.ai_evidence.json`
- La evidencia histórica que sí aporta contexto se consolida en documentación estable o en el plan activo si sigue vigente.

## Comprobaciones útiles

- Higiene hard del worktree propio: `npm run -s validation:self-worktree-hygiene`
- Suite contractual enterprise: `npm run -s validation:contract-suite:enterprise`
- Verificación de plan activo único + higiene hard del worktree propio: `npm run -s validation:tracking-single-active`
