# Validation Docs (Enterprise Minimal Set)

Este directorio contiene solo documentación oficial y estable de validación para Pumuki.

## Documentación oficial vigente

- `adapter-hook-runtime-validation.md`
- `c022-phase-acceptance-contract.md`
- `detection-audit-baseline.md`
- `enterprise-consumer-isolation-policy.md`
- `mock-consumer-integration-runbook.md`
- `skills-rollout-consumer-repositories.md`

## Política de higiene

- Los reportes de ejecución/cierre de ciclos se generan en `.audit_tmp` o `.audit-reports`.
- No se versionan reportes históricos ad-hoc en `docs/validation/`.
- Si hace falta conservar evidencia operativa de ejecución, se referencia desde el ciclo temporal activo (si existe) y/o desde reportes en `.audit_tmp` / `.audit-reports`.
- El cierre oficial de `C022` (`D.T2` + `D.T4`) está consolidado en `c022-phase-acceptance-contract.md`.
