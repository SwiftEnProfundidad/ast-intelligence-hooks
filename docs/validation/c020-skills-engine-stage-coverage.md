# C020 - Skills Engine Stage Coverage

Validacion oficial de la fase B del ciclo `020`: carga determinista de skills y trazabilidad de cobertura por stage.

## Objetivo

- Verificar que el motor carga/aplica reglas de skills de forma consistente en todos los stages.
- Publicar matriz de cobertura (`active/evaluated/matched/unevaluated`) por stage.
- Verificar bloqueo de gobernanza cuando existen reglas `AUTO` sin detector mapeado.

## Evidencia de ejecucion

- Tests de carga/evaluacion por stage:
  - `npx --yes tsx@4.21.0 --test integrations/git/__tests__/runPlatformGateEvaluation.test.ts`
  - `npx --yes tsx@4.21.0 --test integrations/git/__tests__/runPlatformGate.test.ts`
  - `npx --yes tsx@4.21.0 --test integrations/git/__tests__/stageRunners.test.ts`
  - `npx --yes tsx@4.21.0 --test integrations/gate/__tests__/evaluateAiGate.test.ts`
- Test focal de gobernanza (`AUTO` sin detector):
  - `npx --yes tsx@4.21.0 --test --test-name-pattern "AUTO de skills sin detector" integrations/git/__tests__/runPlatformGate.test.ts`
  - salida: `.audit_tmp/c020-a/skills-governance-auto-rule-test.out`
- Matriz compacta generada:
  - `.audit_tmp/c020-a/rule-coverage-summary.json`

## Matriz de cobertura (resumen)

Valores extraidos de `.audit_tmp/c020-a/rule-coverage-summary.json`:

| Stage | Evaluation stage | Rules total | Skills rules | Evaluated | Matched | Unmatched | Findings |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| PRE_WRITE | PRE_COMMIT | 417 | 239 | 417 | 15 | 402 | 144 |
| PRE_COMMIT | PRE_COMMIT | 417 | 239 | 417 | 15 | 402 | 144 |
| PRE_PUSH | PRE_PUSH | 417 | 239 | 417 | 15 | 402 | 144 |
| CI | CI | 417 | 239 | 417 | 15 | 402 | 144 |

Severidad enterprise consistente en todos los stages:
- `CRITICAL: 42`
- `HIGH: 43`
- `MEDIUM: 59`
- `LOW: 0`

## Resultado fase B

- `C020.B.T1`: ✅ Carga determinista de skills consolidada (mismo total de `skillsRules=239` en todos los stages).
- `C020.B.T2`: ✅ Matriz de cobertura publicada con conteos por stage.
- `C020.B.T3`: ✅ Bloqueo de gobernanza validado cuando existen reglas `AUTO` sin detector (`governance.skills.detector-mapping.incomplete`).
