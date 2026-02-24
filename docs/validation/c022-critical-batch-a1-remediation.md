# C022 - Remediacion Lote CRITICAL A1 (Fase A / T2)

Ejecucion de `C022.A.T2` sobre el lote `A1` definido en `docs/validation/c022-critical-batch-selection.md`.

## Alcance ejecutado

- Regla objetivo del lote:
  - `common.types.undefined_in_base_type` (`16`)
- Ficheros objetivo:
  - `core/facts/detectors/typescript/index.ts`
  - `integrations/config/heuristics.ts`
  - `integrations/config/skillsCustomRules.ts`
  - `integrations/evidence/buildEvidence.ts`
  - `integrations/evidence/repoState.ts`
  - `integrations/lifecycle/cli.ts`
  - `integrations/lifecycle/gitService.ts`
  - `integrations/lifecycle/remove.ts`
  - `integrations/lifecycle/state.ts`
  - `integrations/mcp/enterpriseServer.ts`
  - `integrations/mcp/evidencePayloadCollectionsPaging.ts`
  - `integrations/mcp/evidencePayloadConfig.ts`
  - `integrations/notifications/emitAuditSummaryNotification.ts`
  - `integrations/platform/detectPlatforms.ts`
  - `integrations/sdd/openSpecCli.ts`
  - `integrations/sdd/sessionStore.ts`

## Cambios aplicados (refactor)

- Se eliminaron anotaciones explicitas `string | undefined`, `number | undefined` o `boolean | undefined` en firmas afectadas del lote A1.
- Se mantuvo el comportamiento funcional usando:
  - parametros opcionales (`value?: string`, `value?: number`)
  - tipos derivados por indexed access en casos de payload opcional
  - inferencia de retorno o retorno tipado no base (`PlatformState | undefined`) cuando aplica.
- No se introdujeron cambios de arquitectura ni de flujo funcional fuera del alcance del lote.

## Evidencia TDD (red/green/refactor)

- `RED`: `.audit_tmp/c022-a-t2-red.out`
  - `baseline_selected_findings=16`
  - `status=RED_OK`
  - `exit_code=1`
- `GREEN`: `.audit_tmp/c022-a-t2-green.out`
  - `selected_rule_findings=0` (lote A1 limpio en `core/integrations`)
  - `remaining_undefined_rule_total=17` (pendiente en `scripts/*`, fuera de A1)
  - `status=GREEN_OK`
  - `exit_code=0`

## Verificacion local

- Full audit:
  - `printf '1\n10\n' | PUMUKI_SDD_BYPASS=1 node bin/pumuki-framework.js`
  - salida: `.audit_tmp/c022-a-t2/framework-menu.out`
  - `total_violations=45` (`CRITICAL 18`, `HIGH 27`, `MEDIUM 0`, `LOW 0`)
- Tests focales del lote:
  - `npx --yes tsx@4.21.0 --test core/facts/__tests__/extractHeuristicFacts.test.ts integrations/evidence/__tests__/buildEvidence.test.ts integrations/evidence/__tests__/repoState.test.ts integrations/lifecycle/__tests__/cli.test.ts integrations/lifecycle/__tests__/gitService.test.ts integrations/lifecycle/__tests__/remove.test.ts integrations/lifecycle/__tests__/state.test.ts integrations/mcp/__tests__/enterpriseServer.test.ts integrations/platform/__tests__/detectPlatforms.test.ts integrations/sdd/__tests__/openSpecCli.test.ts integrations/sdd/__tests__/sessionStore.test.ts`
  - resultado: `tests=101`, `pass=101`, `fail=0`
- Typecheck global:
  - `npm run typecheck`
  - estado: fallo preexistente fuera del alcance A1 en `integrations/config/skillsEffectiveLock.ts` (literal type `version`).

## Salida de T2

- Lote `A1` remediado en `core/integrations` para `common.types.undefined_in_base_type`.
- Evidencia TDD formal publicada en `.audit_tmp`.
- Revalidacion de severidad full-repo y delta quedan en `C022.A.T3`.
