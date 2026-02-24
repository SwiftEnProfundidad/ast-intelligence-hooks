# C020 - AST Detector Contract by Language

Contrato formalizado para el mapeo de detectores AST por lenguaje en el ciclo `020`.

## Objetivo

- Evitar deteccion opaca/fragil de reglas heuristicas.
- Declarar un contrato explicito `ruleIdPrefix -> language -> detector modules`.
- Validar por test que todas las reglas de `astHeuristicsRuleSet` quedan cubiertas.

## Implementacion

- Contrato versionado:
  - `core/facts/detectors/contract.ts`
- Reglas de mapeo incluidas:
  - `heuristics.ts.* -> typescript`
  - `common.* -> typescript`
  - `heuristics.ios.* -> swift`
  - `heuristics.android.* -> kotlin`
  - `workflow.bdd.* -> generic`

## Validacion

Test de contrato:

```bash
npx --yes tsx@4.21.0 --test core/facts/detectors/contract.test.ts
```

Cobertura validada:
- prefijos de contrato unicos
- mapeo de reglas conocidas
- cobertura completa de reglas en `astHeuristicsRuleSet`

## Endurecimiento asociado (C020.C.T2)

Se incrementa sensibilidad del detector de God Class:
- antes: `>=500` lineas por clase
- ahora: `>=300` lineas por clase

Archivos:
- `core/facts/detectors/typescript/index.ts`
- `core/facts/detectors/typescript/index.test.ts`
- `core/facts/extractHeuristicFacts.ts`

## Unificacion de severidad enterprise (C020.C.T3)

Validado con tests de stage policies:

```bash
npx --yes tsx@4.21.0 --test \
  integrations/gate/__tests__/stagePolicies-config-and-severity.test.ts \
  integrations/gate/__tests__/stagePolicies.test.ts
```

Resultado:
- promociones de heuristicas aplicadas de forma consistente en `PRE_COMMIT`, `PRE_PUSH` y `CI`
- mapeo enterprise a gate severities validado (`CRITICAL/HIGH/MEDIUM/LOW`)
