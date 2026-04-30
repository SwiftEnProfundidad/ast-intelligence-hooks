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

- `docs/validation/` no gobierna backlog.
- La única fuente viva del tracking interno es `PUMUKI-RESET-MASTER-PLAN.md` en la raíz del repo.
- `docs/tracking/plan-activo-de-trabajo.md` queda retirado como espejo operativo y solo conserva valor histórico.

## GitHub Actions y cuota

Si la organización **no tiene minutos útiles** de Actions, los workflows bajo `.github/workflows/` **no bloquean** el flujo de merge ni sustituyen la evidencia: la barra operativa es **local** — comando único recomendado: **`npm run -s validation:local-merge-bar`** (`typecheck` + `validation:pumuki-surface-smoke` + `npm test`). Complementos habituales: hooks Pumuki, `validation:tracking-single-active`, etc. Alineado con `docs/tracking/plan-activo-de-trabajo.md`.

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
- **Smoke de superficie Pumuki** (~29 filas: CLI, `doctor`/`status`, `audit` (varios stages), `watch` (repo + staged), `loop`, `adapter` dry-run repo+codex, `analytics`, `policy` normal+`--strict`, `sdd status`+`validate` por stage, hooks): desde la raíz de **este** repo, `npm run -s smoke:pumuki-surface` (alias: `npm run -s validation:pumuki-surface-smoke`). Tests del resolver y del exit 2 sin `node_modules/pumuki`: `npx --yes tsx@4.21.0 --test scripts/__tests__/pumuki-full-surface-smoke-lib.test.ts scripts/__tests__/pumuki-full-surface-smoke-exit2.test.ts`. Opcional sobre un consumidor con **bins del tree pumuki** (gate en el cwd del consumidor): `PUMUKI_SMOKE_REPO_ROOT=/ruta/abs/al/consumer npm run -s smoke:pumuki-surface`. Para validar **exactamente lo instalado** en `node_modules/pumuki` del consumidor: `PUMUKI_SMOKE_REPO_ROOT=/ruta/abs/al/consumer PUMUKI_SMOKE_BIN_STRATEGY=installed npm run -s smoke:pumuki-surface`, o `PUMUKI_SMOKE_REPO_ROOT=/ruta/abs/al/consumer npm run -s smoke:pumuki-surface-installed`. Ver interpretación de exit codes al final del informe impreso.
