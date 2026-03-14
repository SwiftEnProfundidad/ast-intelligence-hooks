# Validation Docs

Este directorio contiene solo documentación estable de validación y runbooks oficiales.

## Documentación vigente

- `adapter-hook-runtime-runbook.md`
- `ast-intelligence-validation-roadmap.md`
- `full-repo-detection-audit-baseline.md`
- `enterprise-consumer-isolation-policy.md`
- `mock-consumer-integration-runbook.md`
- `consumer-repositories-skills-rollout-validation.md`

## Estado de seguimiento

- Fuente viva única: `PUMUKI-RESET-MASTER-PLAN.md`
- No se conservan MDs legacy de seguimiento en `docs/tracking/`.

## Política de higiene

- `docs/validation/` no guarda reportes temporales.
- Los artefactos efímeros se generan fuera de `docs/` y deben limpiarse antes de cerrar un ciclo:
  - `.audit-reports/**`
  - `.coverage/**`
  - `.ai_evidence.json`
- La evidencia histórica que sí aporta contexto se consolida en documentación estable o en el histórico permitido.

## Comprobaciones útiles

- Higiene hard del worktree propio: `npm run -s validation:self-worktree-hygiene`
- Suite contractual enterprise: `npm run -s validation:contract-suite:enterprise`
- Baseline repetible de fixture consumer: `npm run -s validation:consumer-matrix-baseline -- --repo-root /absolute/path/to/<fixture> --fixture <name> --rounds 3 --json`
  - emite `report.json` + `summary.md` con `doctor_blocking` y `layerSummary`
  - validado en `ios-architecture-showcase`, `SAAS:APP_SUPERMERCADOS` y `R_GO`
- Verificación de plan activo único + higiene hard del worktree propio: `npm run -s validation:tracking-single-active`

## Release readiness del reset

Secuencia mínima congelada antes de decidir una publicación útil:

- `npm run -s typecheck`
- `npm run -s validation:contract-suite:enterprise`
- `npm run -s validation:package-manifest`
- `npm run -s validation:package-smoke`
- `npm run -s validation:package-smoke:minimal`
- `npm run -s validation:consumer-matrix-baseline -- --repo-root /Users/juancarlosmerlosalbarracin/Developer/Projects/ios-architecture-showcase --fixture ios-architecture-showcase --rounds 3 --json`
- `npm run -s validation:consumer-matrix-baseline -- --repo-root "/Users/juancarlosmerlosalbarracin/Developer/Projects/SAAS:APP_SUPERMERCADOS" --fixture saas-app-supermercados --rounds 3 --json`
- `npm run -s validation:consumer-matrix-baseline -- --repo-root /Users/juancarlosmerlosalbarracin/Developer/Projects/R_GO --fixture r_go --rounds 3 --json`
- `git diff --check`

Regla de publicación:

- publicar solo desde `release/<semver>` cortada desde `develop`
- exigir checklist verde o hallazgos remanentes ya clasificados como deuda del consumer, nunca como bug del framework
- no publicar si reaparece un falso positivo blocking conocido o si un fixture necesita bypass manual

Rollback mínimo:

- volver al semver estable previo de `pumuki`
- repinear consumers afectados a esa versión exacta
- revalidar `status`, `doctor` y la baseline del consumer impactado antes de cerrar el incidente
