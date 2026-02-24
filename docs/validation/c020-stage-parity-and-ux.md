# C020 - Stage Parity and UX Validation

Validacion oficial de la fase D del ciclo `020`: paridad operativa por stage, trazabilidad clicable, notificaciones y opción de worktree completo.

## D1 - Paridad runtime entre entrypoints

Ejecuciones reales:

```bash
printf '1\n10\n' | PUMUKI_SDD_BYPASS=1 node bin/pumuki-framework.js
node bin/pumuki-pre-write.js
PUMUKI_SDD_BYPASS=1 node bin/pumuki-pre-commit.js
PUMUKI_SDD_BYPASS=1 node bin/pumuki-pre-push.js
PUMUKI_SDD_BYPASS=1 node bin/pumuki-ci.js
```

Artefactos:
- `.audit_tmp/c020-d1/stage-summary.json`
- `.audit_tmp/c020-d1/exits.txt`

Resumen:
- `menu_option1`: `BLOCK`, `stage=PRE_COMMIT`, `audit_mode=engine`, `total_violations=144`
- `pre_write`: `exit=1`, usa evidencia fresca y mantiene `audit_mode=engine` con severidades enterprise
- `pre_commit`: `PASS`, `audit_mode=gate` (`files_scanned=0` cuando no hay scope staged)
- `pre_push`: `exit=1` esperado en rama sin upstream
- `ci`: `PASS`, `audit_mode=gate` (`files_scanned=0` en contexto local sin rango CI activo)

## D2 - Reportes clicables

Ejecucion:

```bash
printf '1\n8\n10\n' | PUMUKI_SDD_BYPASS=1 node bin/pumuki-framework.js
```

Validado en export:
- `.audit-reports/pumuki-legacy-audit.md`
- secciones presentes:
  - `Clickable Top Files`
  - `Clickable Findings`
- enlaces formato `./path#Lline` activos y consistentes.

## D3 - Notificaciones macOS / audit summary

Validacion por test:

```bash
npx --yes tsx@4.21.0 --test \
  scripts/__tests__/framework-menu-consumer-runtime.test.ts \
  integrations/git/__tests__/stageRunners.test.ts \
  integrations/notifications/__tests__/emitAuditSummaryNotification.test.ts
```

Resultado:
- notificación de resumen validada para menú (`1/2/3/4`)
- notificación de resumen validada para `PRE_COMMIT/PRE_PUSH/CI`
- `CI` mantiene política de emisión controlada (desactivada por defecto salvo override)

## D4 - Opción worktree completo (staged + unstaged)

Validado en render del menú:
- opción visible: `Audit STAGED+UNSTAGED working tree (PRE_PUSH policy)`
- evidencia en `.audit_tmp/c020-d1/menu-1-8-10.out`

Conclusión:
- la opción de worktree completo está operativa y alineada con política `PRE_PUSH`.
