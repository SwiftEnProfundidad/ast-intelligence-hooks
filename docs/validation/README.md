# Validation Docs (Enterprise Minimal Set)

Este directorio contiene solo documentación oficial y estable de validación para Pumuki.

## Documentación oficial vigente

- `adapter-hook-runtime-validation.md`
- `c021-critical-batch-a1-remediation.md`
- `c021-critical-batch-a1-severity-delta.md`
- `c021-critical-batch-selection.md`
- `c021-full-repo-baseline.md`
- `c021-high-batch-b1-remediation.md`
- `c021-high-batch-b1-severity-delta.md`
- `c021-high-batch-selection.md`
- `c021-clickable-consistency-c2-remediation.md`
- `c021-medium-quick-wins-c1-remediation.md`
- `c021-stage-parity-c3-validation.md`
- `c021-d1-local-revalidation.md`
- `c021-d3-gitflow-close.md`
- `c021-d4-cycle-retirement.md`
- `c021-enterprise-certification-report.md`
- `c021-phase-acceptance-contract.md`
- `c022-full-repo-baseline.md`
- `c022-phase-acceptance-contract.md`
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
