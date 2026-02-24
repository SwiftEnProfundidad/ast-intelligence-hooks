# Validation Docs (Enterprise Minimal Set)

Este directorio contiene solo documentación oficial y estable de validación para Pumuki.

## Documentación oficial vigente

- `adapter-hook-runtime-validation.md`
- `c020-ast-detector-contract.md`
- `c020-enterprise-certification-report.md`
- `c020-legacy-refactor-benchmark.md`
- `c020-skills-engine-stage-coverage.md`
- `c020-stage-parity-and-ux.md`
- `detection-audit-baseline.md`
- `enterprise-consumer-isolation-policy.md`
- `mock-consumer-integration-runbook.md`
- `skills-rollout-consumer-repositories.md`

## Política de higiene

- Los reportes de ejecución/cierre de ciclos se generan en `.audit_tmp` o `.audit-reports`.
- No se versionan reportes históricos ad-hoc en `docs/validation/`.
- Si hace falta conservar evidencia operativa de ejecución, se referencia desde el ciclo temporal activo (si existe) y/o desde reportes en `.audit_tmp` / `.audit-reports`.
