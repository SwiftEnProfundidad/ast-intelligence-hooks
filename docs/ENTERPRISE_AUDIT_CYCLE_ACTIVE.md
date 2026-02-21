# Plan de Auditoría Enterprise (Nuevo Ciclo)

Plan operativo del ciclo actual para estabilizar auditoría, trazabilidad y cierre Git Flow sin mezclarlo con el histórico cerrado.

## Leyenda
- ✅ Hecho
- 🚧 En construccion (maximo 1)
- ⏳ Pendiente
- ⛔ Bloqueado

## Scope del ciclo
- Validar cobertura real de reglas/skills por stage y por plataforma.
- Corregir telemetría de evidencia para eliminar ambigüedades de `files_scanned`/`files_affected`.
- Consolidar clasificación determinista `iOS/Android/Backend/Frontend/Other`.
- Cerrar ciclo con TDD de regresión y handoff Git Flow completo.

## Backlog de tareas
- ✅ T1. Diagnóstico profundo de cobertura de reglas/skills
  - Mapear por stage: reglas activas, reglas evaluadas, reglas con findings.
  - Detectar reglas/categorías sin trazabilidad explícita.
  - Criterio de salida: inventario verificable `ruleId -> evaluated -> matched`.
  - Evidencia validada (repo real):
    - Tests GREEN:
      - `npx --yes tsx@4.21.0 --test integrations/git/__tests__/runPlatformGateEvaluation.test.ts scripts/__tests__/framework-menu-rule-coverage-diagnostics.test.ts scripts/__tests__/framework-menu-hard-mode-config.test.ts` (`13/13` pass).
    - Diagnóstico por stage:
      - `PRE_COMMIT`: `rules_total=8`, `matched_rules=0`, `unmatched_rules=8`.
      - `PRE_PUSH`: `rules_total=25`, `matched_rules=0`, `unmatched_rules=25`.
      - `CI`: `rules_total=25`, `matched_rules=0`, `unmatched_rules=25`.
    - Inventario explícito disponible en salida:
      - `evaluated_rule_ids=...`
      - `matched_rule_ids=...`
      - `unmatched_rule_ids=...`

- ✅ T2. Corrección de telemetría de evidencia
  - Persistir métricas de evaluación en `.ai_evidence.json` sin romper contrato.
  - Corregir semántica de `files_scanned` y separar de `files_affected`.
  - Criterio de salida: evidencia consistente entre ejecuciones y scopes.
  - Implementación:
    - `snapshot.files_affected` persistido en contrato `v2.1` y normalizado en escritura.
    - `snapshot.evaluation_metrics` persistido con inventario `evaluated/matched/unmatched`.
    - `runPlatformGate` propaga cobertura de evaluación a evidencia (`evaluation_metrics`).
    - `readLegacyAuditSummary` consume `snapshot.files_affected` sin confundirlo con `files_scanned`.
  - Validación TDD:
    - `npx --yes tsx@4.21.0 --test integrations/evidence/__tests__/buildEvidence.test.ts integrations/evidence/writeEvidence.test.ts integrations/evidence/schema.test.ts integrations/git/__tests__/runPlatformGateEvidence.test.ts integrations/git/__tests__/runPlatformGate.test.ts scripts/__tests__/framework-menu-legacy-audit.test.ts` (`51/51` pass).

- ✅ T3. Ajuste de clasificación multi-plataforma en menú legacy++
  - Mantener siempre `iOS/Android/Backend/Frontend/Other` (incluidos ceros).
  - Garantizar asignación determinista por `path` y `ruleId`.
  - Criterio de salida: mismo input => misma matriz por plataforma.
  - Implementación:
    - Unificación del fallback del menú legacy con el clasificador central de evidencia (`buildSnapshotPlatformSummaries`) para evitar drift entre productor/consumidor.
    - Normalización de `file` en findings (`/` cross-platform) en lectura legacy.
  - Validación TDD:
    - Nuevo test dedicado: `integrations/evidence/platformSummary.test.ts`.
    - Regresión menú legacy + evidencia:
      - `npx --yes tsx@4.21.0 --test integrations/evidence/platformSummary.test.ts scripts/__tests__/framework-menu-legacy-audit.test.ts integrations/evidence/__tests__/buildEvidence.test.ts` (`38/38` pass).

- ✅ T4. TDD de regresión end-to-end
  - ✅ RED:
    - `scripts/__tests__/framework-menu-matrix-runner.test.ts` amplía `sad path` para exigir contrato determinista ante fallo de una opción.
    - `scripts/__tests__/framework-menu-matrix-canary.test.ts` añade `edge` de mapeo stage/plataforma y `happy path PRE_PUSH/frontend`.
    - Evidencia RED:
      - `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-matrix-runner.test.ts scripts/__tests__/framework-menu-matrix-canary.test.ts`
      - Fallos esperados: función no exportada (`resolveConsumerMenuCanaryScenario`) y ausencia de inyección resiliente en matrix runner.
  - ✅ GREEN:
    - `scripts/framework-menu-matrix-runner-lib.ts`
      - soporte de dependencias inyectables para gates/reader.
      - tolerancia a fallo por opción con fallback `UNKNOWN` sin romper la matriz completa.
    - `scripts/framework-menu-matrix-canary-lib.ts`
      - escenario canary parametrizable por `stage/plataforma`.
      - selección de opción por stage (`PRE_COMMIT -> 1`, `PRE_PUSH/CI -> 2`) y regla esperada por plataforma (`backend/frontend`).
      - dependencias inyectables (`runGate`, `readOptionReport`, `extractRuleIds`) para tests deterministas.
  - ✅ REFACTOR + regresión:
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-matrix-runner.test.ts scripts/__tests__/framework-menu-matrix-canary.test.ts` (`5/5`).
    - `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-matrix-evidence.test.ts scripts/__tests__/framework-menu-matrix-runner.test.ts scripts/__tests__/framework-menu-matrix-baseline.test.ts scripts/__tests__/framework-menu-matrix-canary.test.ts` (`11/11`).
  - ✅ Criterio de salida cumplido: happy/sad/edge deterministas + canarios por stage/plataforma en verde.

- ✅ T5. Cierre Git Flow y handoff
  - ✅ Commits atómicos por bloque funcional.
    - `56079b9` feat(audit): persist evaluation telemetry and rule-coverage diagnostics
    - `ddd09c9` feat(menu-matrix): add deterministic baseline and stage/platform canaries
    - `0baf617` fix(types): align ai-gate and rule evaluation contracts
  - ✅ PR a `develop`, merge y validación post-merge.
    - PR: `https://github.com/SwiftEnProfundidad/ast-intelligence-hooks/pull/314`
    - Merge: `develop` en `562111b`.
    - Validación post-merge:
      - `npm run typecheck` (verde).
      - `npx --yes tsx@4.21.0 --test scripts/__tests__/framework-menu-matrix-evidence.test.ts scripts/__tests__/framework-menu-matrix-runner.test.ts scripts/__tests__/framework-menu-matrix-baseline.test.ts scripts/__tests__/framework-menu-matrix-canary.test.ts` (`11/11` verde).
  - ✅ Actualizar documentación de uso si cambia el contrato de evidencia/auditoría.
  - ✅ Criterio de salida cumplido: ciclo cerrado sin tareas huérfanas.
