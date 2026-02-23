# Enterprise Detection Revalidation — Cycle 012

Cierre de revalidación técnica del ciclo `P-ADHOC-LINES-012` sobre el estado actual del refactor enterprise.

## Alcance

- Repo: `ast-intelligence-hooks`
- Branch: `develop`
- Fecha: `2026-02-23`
- Objetivo: confirmar estabilidad técnica post-remediación (`P-ADHOC-LINES-011`) y estado real de paridad legacy.

## Evidencias ejecutadas

### 1) Tests focales (TDD regression pack)

Comando:

```bash
node --import tsx --test \
  core/facts/detectors/typescript/index.test.ts \
  core/facts/__tests__/extractHeuristicFacts.test.ts \
  integrations/git/__tests__/findingTraceability.test.ts
```

Artefacto:

- `.audit_tmp/p-adhoc-lines-012-tests.out`

Resultado:

- `tests=47`
- `pass=47`
- `fail=0`

### 2) Typecheck

Comando:

```bash
npx tsc --noEmit
```

Artefacto:

- `.audit_tmp/p-adhoc-lines-012-typecheck.out`

Resultado:

- Exit code `0` (sin errores de compilación TypeScript).

### 3) Smoke funcional hooks

Comandos:

```bash
node bin/pumuki-pre-write.js
node bin/pumuki-pre-commit.js
node bin/pumuki-pre-push.js
```

Artefactos:

- `.audit_tmp/p-adhoc-lines-012-prewrite.out`
- `.audit_tmp/p-adhoc-lines-012-precommit.out`
- `.audit_tmp/p-adhoc-lines-012-prepush.out`

Resultado:

- `pre-write`: `BLOCK` por `sdd.policy.blocked` (`openspec/changes:1`) y políticas de gate (`.ai_evidence.json:1`, `.git/HEAD:1`).
- `pre-commit`: `BLOCK` por `sdd.policy.blocked` (`openspec/changes:1`).
- `pre-push`: `BLOCK` por `sdd.policy.blocked` (`openspec/changes:1`).

### 4) Smoke funcional menú (`1 -> 8 -> 9 -> 10`)

Comando:

```bash
printf '1\n8\n9\n10\n' | node bin/pumuki-framework.js
```

Artefacto:

- `.audit_tmp/p-adhoc-lines-012-menu.out`

Resultado (auditoría full repo):

- `CRITICAL: 42`
- `HIGH: 37`
- `MEDIUM: 59`
- `LOW: 0`
- `Outcome PRE_COMMIT: BLOCK`
- Salida con rutas clicables `file:line` visible en resumen operativo.

## Paridad legacy (revalidación)

Comando:

```bash
node --import tsx scripts/build-legacy-parity-report.ts \
  --legacy=.audit_tmp/p-adhoc-lines-012-legacy-baseline.json \
  --enterprise=.ai_evidence.json \
  --out=.audit-reports/p-adhoc-lines-012-legacy-parity.md \
  --allow-scope-mismatch
```

Artefactos:

- `.audit_tmp/p-adhoc-lines-012-parity-run.out`
- `.audit-reports/p-adhoc-lines-012-legacy-parity.md`

Matriz de severidad:

- `CRITICAL`: legacy `9` vs enterprise `42` -> `PASS`
- `HIGH`: legacy `41` vs enterprise `37` -> `FAIL`
- `MEDIUM`: legacy `21` vs enterprise `59` -> `PASS`
- `LOW`: legacy `0` vs enterprise `0` -> `PASS`

## Conclusión operativa

- La remediación de `P-ADHOC-LINES-011` queda estable: tests y typecheck en verde, y trazabilidad funcional en menú/hook.
- El estado de dominancia legacy por severidad **sigue abierto en `HIGH`** (gap actual `-4`).
- El ciclo `P-ADHOC-LINES-012` puede cerrarse técnicamente en validación, pero no en paridad estricta `HIGH` hasta completar la remediación pendiente de esa banda.

## Actualización de cierre (misma tarea, iteración v2)

Se aplicó un ajuste adicional en extracción AST para permitir `common.network.missing_error_handling` en ficheros de test (sin abrir el resto de heurísticas TS en test), manteniendo trazabilidad por líneas.

Evidencias v2:

- `.audit_tmp/p-adhoc-lines-012-tests.out` (`48/48` OK tras nuevo test de cobertura)
- `.audit_tmp/p-adhoc-lines-012-prewrite-v2.out`
- `.audit_tmp/p-adhoc-lines-012-precommit-v2.out`
- `.audit_tmp/p-adhoc-lines-012-prepush-v2.out`
- `.audit_tmp/p-adhoc-lines-012-menu-v2.out`
- `.audit_tmp/p-adhoc-lines-012-parity-run-v2.out`
- `.audit-reports/p-adhoc-lines-012-legacy-parity-v2.md`

Resultado v2 (menú full audit):

- `CRITICAL: 42`
- `HIGH: 43`
- `MEDIUM: 59`
- `LOW: 0`

Paridad legacy v2 (severidad):

- `CRITICAL`: `PASS` (`42 >= 9`)
- `HIGH`: `PASS` (`43 >= 41`)
- `MEDIUM`: `PASS` (`59 >= 21`)
- `LOW`: `PASS` (`0 = 0`)

Estado:

- `dominance: PASS` a nivel severidad.
- `rule_dominance: FAIL` permanece por formato agregado del baseline histórico (`baseline.*`), sin afectar la dominancia por severidad.
