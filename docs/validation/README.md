# Validation Docs (Enterprise Minimal Set)

Este directorio contiene solo documentación oficial y estable de validación para Pumuki.

## Documentación oficial vigente

- `adapter-hook-runtime-validation.md`
- `detection-audit-baseline.md`
- `enterprise-consumer-isolation-policy.md`
- `mock-consumer-integration-runbook.md`
- `skills-rollout-consumer-repositories.md`

## Política de higiene

- Los reportes de ejecución/cierre de ciclos se generan en `.audit_tmp` o `.audit-reports`.
- No se versionan reportes históricos ad-hoc en `docs/validation/`.
- Si hace falta conservar evidencia operativa, se referencia desde `docs/REFRACTOR_PROGRESS.md`.
