# Skills Engine Runtime Matrix

Matriz runtime generada automaticamente para validar contrato por stage/mode y cobertura determinista.

Generated at: 2026-02-23T01:10:51.999Z

| Stage | Mode | exit | audit_mode | outcome | active | evaluated | unevaluated | unsupported_auto | coverage_ratio | sdd_code | duration_ms |
| --- | --- | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| PRE_COMMIT | gate | 1 | gate | BLOCK | 0 | 0 | 0 | 0 | 1.000 | OPENSPEC_MISSING | 92 |
| PRE_COMMIT | engine | 1 | engine | BLOCK | 245 | 245 | 0 | 0 | 1.000 | OPENSPEC_MISSING | 205 |
| PRE_PUSH | gate | 1 | gate | BLOCK | 0 | 0 | 0 | 0 | 1.000 | OPENSPEC_MISSING | 78 |
| PRE_PUSH | engine | 1 | engine | BLOCK | 245 | 245 | 0 | 0 | 1.000 | OPENSPEC_MISSING | 128 |
| CI | gate | 1 | gate | BLOCK | 0 | 0 | 0 | 0 | 1.000 | OPENSPEC_MISSING | 79 |
| CI | engine | 1 | engine | BLOCK | 245 | 245 | 0 | 0 | 1.000 | OPENSPEC_MISSING | 114 |

## Notes
- `gate`: aplica short-circuit SDD por defecto cuando faltan precondiciones OpenSpec/sesion.
- `engine`: no hace short-circuit SDD por defecto y evalua reglas para diagnostico completo.
- En ambos modos la evidencia persiste `snapshot.audit_mode` y mantiene compatibilidad con severidades legacy + enterprise.
