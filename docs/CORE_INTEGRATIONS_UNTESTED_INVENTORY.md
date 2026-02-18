# Inventario Determinista: core/integrations sin test directo

## Criterio
- Alcance: archivos `*.ts` bajo `core/` e `integrations/`, excluyendo `__tests__/`, `*.test.ts`, `*.spec.ts` y `*.d.ts`.
- Se considera "sin test directo" si no existe `archivo.test.ts`/`archivo.spec.ts` como sibling o en `__tests__/`.
- Priorización determinista por impacto: `score = (reverse_dependencies * 20) + loc`.
- Prioridades: `P1` (deps>=8 o loc>=220), `P2` (deps>=4 o loc>=140), `P3` (deps>=2 o loc>=70), `P4` resto.

## Resumen
- Total source files analizados: **204**
- Total test files detectados: **208**
- Total sin test directo: **22**
- Prioridades: P1=1, P2=1, P3=9, P4=11

## Top 60 por impacto
| Priority | Score | RevDeps | LOC | File |
|---|---:|---:|---:|---|
| P1 | 399 | 5 | 299 | `integrations/gate/stagePolicies.ts` |
| P2 | 138 | 4 | 58 | `integrations/platform/detectPlatforms.ts` |
| P3 | 172 | 2 | 132 | `integrations/mcp/evidenceContextServer.ts` |
| P3 | 131 | 3 | 71 | `integrations/mcp/evidencePayloadConfig.ts` |
| P3 | 103 | 2 | 63 | `integrations/sdd/types.ts` |
| P3 | 87 | 2 | 47 | `integrations/mcp/evidenceFacetsRulesets.ts` |
| P3 | 79 | 3 | 19 | `integrations/mcp/evidenceFacetsPlatforms.ts` |
| P3 | 75 | 2 | 35 | `integrations/mcp/evidenceFacetsFindings.ts` |
| P3 | 71 | 3 | 11 | `integrations/sdd/index.ts` |
| P3 | 66 | 3 | 6 | `integrations/mcp/evidenceFacets.ts` |
| P3 | 64 | 2 | 24 | `integrations/mcp/evidenceFacetsLedger.ts` |
| P4 | 82 | 1 | 62 | `integrations/mcp/evidencePayloadSummary.ts` |
| P4 | 46 | 1 | 26 | `integrations/platform/detectFrontend.ts` |
| P4 | 42 | 1 | 22 | `integrations/platform/detectAndroid.ts` |
| P4 | 39 | 1 | 19 | `integrations/platform/detectBackend.ts` |
| P4 | 22 | 1 | 2 | `integrations/mcp/evidenceFacetsSuppressedShare.ts` |
| P4 | 13 | 0 | 13 | `integrations/git/index.ts` |
| P4 | 13 | 0 | 13 | `integrations/mcp/evidenceContextServer.cli.ts` |
| P4 | 9 | 0 | 9 | `integrations/mcp/enterpriseServer.cli.ts` |
| P4 | 4 | 0 | 4 | `integrations/mcp/evidenceFacetsSnapshot.ts` |
| P4 | 3 | 0 | 3 | `integrations/mcp/evidenceFacetsBase.ts` |
| P4 | 2 | 0 | 2 | `integrations/mcp/index.ts` |

## Artefacto completo
- Ver listado completo en `docs/CORE_INTEGRATIONS_UNTESTED_INVENTORY.json`.

## Lote Atómico Inicial Seleccionado (Batch 01)
- `integrations/gate/stagePolicies.ts` (P1, score 399)
- `integrations/platform/detectPlatforms.ts` (P2, score 138)
- `integrations/mcp/evidenceContextServer.ts` (P3, score 172)

### Criterio de selección
- Prioridad por impacto (score + prioridad) sobre el inventario determinista.
- Cobertura transversal de dominios (`gate`, `platform`, `mcp`) para reducir riesgo sistémico temprano.
- Límite operativo estricto: máximo 3 archivos para mantener cierre atómico y trazable.

### Criterio de cierre del Batch 01
- Existe al menos un test unitario directo por cada archivo del lote.
- Los tests del lote pasan en local.
- El tracker se actualiza con Batch 01 en ✅ y Batch 02 como única tarea en 🚧.
