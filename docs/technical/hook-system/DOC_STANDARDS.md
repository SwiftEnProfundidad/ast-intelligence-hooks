# Hook-System Documentation Standards

## Principios

- Documentación mínima obligatoria para cada fase del plan.
- Actualización cada 30 días como máximo (ver `doc-standards.json`).
- Formato Markdown, sin comentarios en código, con tablas y ejemplos ejecutables.

## Checklist

- [x] `PLAN_PROGRESIVO_PLATAFORMAS.md`
- [x] `OWNERSHIP_AND_ROADMAP.md`
- [x] `TELEMETRY.md`
- [x] `PREDICTIVE_AUTOMATION.md`
- [x] `REALTIME_GUARDS.md`
- [x] `PLAYBOOKS.md`

## Automatización

- CLI `scripts/hooks-system/bin/check-doc-drift.js`
  - Verifica existencia, tamaño (>0) y antigüedad (<30 días).
- Integrar en CI (Phase 4 – `docs-standards`).

## Roadmap

- Añadir generación automática de índice.
- Validar enlaces y snippets via Markdown lint.
