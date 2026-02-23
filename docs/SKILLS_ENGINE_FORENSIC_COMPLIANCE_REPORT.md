# Skills Engine Forensic Compliance Report

Fecha: 2026-02-23
Ciclo: `SKILLS_ENGINE_FORENSIC_RECOVERY`
Rama: `feature/skills-engine-forensic-recovery`

## 1) Alcance validado

- Contrato dual runtime implementado y verificado: `auditMode=gate|engine`.
- Evidencia v2.1 persistiendo `snapshot.audit_mode`.
- Severidad dual persistida en evidencia:
  - Legacy: `severity_metrics.by_severity` (`CRITICAL/ERROR/WARN/INFO`)
  - Enterprise: `severity_metrics.by_enterprise_severity` (`CRITICAL/HIGH/MEDIUM/LOW`)
- Brecha AUTO cerrada para auditoría repo-level:
  - `unsupported_auto_rule_ids=0`
  - `unevaluated_rule_ids=0` (en modo `engine`)
- Diagnóstico de cobertura alineado con el mismo motor de evaluación usado por gate/menu.

## 2) Evidencia reproducible (comandos)

### 2.1 Suite integral de stage gates

Comando:

```bash
npm run test:stage-gates
```

Resultado:

- `tests=785`
- `pass=781`
- `fail=0`
- `skipped=4`

### 2.2 Matriz runtime stage x mode

Archivo generado:

- `docs/SKILLS_ENGINE_RUNTIME_MATRIX.md`

Fuente de datos:

- Ejecuciones reales de `runPlatformGate` por `PRE_COMMIT|PRE_PUSH|CI` y `gate|engine`.
- Lectura de `.ai_evidence.json` tras cada ejecución.

Resumen observado:

- `audit_mode` persistido correctamente en todos los casos.
- `mode=gate`: short-circuit SDD activo cuando falta OpenSpec/sesión (esperado).
- `mode=engine`: evaluación completa de reglas con cobertura total (`active=evaluated`, `unevaluated=0`).
- `unsupported_auto=0` en todos los stages evaluados.

### 2.3 Validación visual de menú/reportes

Comandos ejecutados:

```bash
printf '10\n' | PUMUKI_MENU_UI_V2=1 node bin/pumuki-framework.js > /tmp/pumuki-menu-v2-consumer.txt
printf 'A\n10\n' | PUMUKI_MENU_UI_V2=1 node bin/pumuki-framework.js > /tmp/pumuki-menu-v2-advanced.txt
```

Comprobaciones:

- Menú consumer renderiza estado y secciones correctamente.
- Menú advanced renderiza dominios completos y ayuda contextual.
- Bloque de evidencia muestra severidad enterprise y legacy en paralelo.

## 3) Cumplimiento de objetivos del ciclo

- Objetivo de eliminación de caja negra: **cumplido** (trazabilidad explícita por modo/stage).
- Objetivo de reglas AUTO sin detector: **cumplido** para runtime auditado (`unsupported_auto=0`).
- Objetivo de severidad enterprise canónica: **cumplido** sin romper compatibilidad.
- Objetivo TDD/regresión: **cumplido** con suite integral en verde.

## 4) Limitaciones observadas (no regresión)

- En entorno sin OpenSpec/sesión, `mode=gate` bloquea por SDD antes de evaluar reglas (comportamiento de diseño).
- Para diagnóstico completo en esos contextos, usar `mode=engine` (sin short-circuit por defecto).

## 5) Artefactos del ciclo

- `docs/SKILLS_ENGINE_FORENSIC_RCA_REPORT.md`
- `docs/SKILLS_ENGINE_RUNTIME_MATRIX.md`
- `docs/SKILLS_ENGINE_FORENSIC_COMPLIANCE_REPORT.md`
- `docs/SKILLS_ENGINE_FORENSIC_RECOVERY_CYCLE.md`
- `docs/REFRACTOR_PROGRESS.md`

