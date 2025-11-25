# Hook-System Governance & Review Cycle

## Cadencia

- Auditoría trimestral (Phase 5) para revisar métricas, deuda técnica y roadmap.
- Herramienta: `scripts/hooks-system/bin/plan-review.js` (anota próxima fecha en `.audit_tmp/hook-review.log`).

```bash
scripts/hooks-system/bin/plan-review.js
```

## Agenda sugerida

1. Revisión de KPIs (MRRF, ratio de violaciones recurrentes, uptime del orquestador).
2. Estado de iniciativas (fases del plan, backlog de mejoras).
3. Deuda técnica detectada + plan de mitigación.
4. Actualización de documentación y estándares.

## Participantes

- DevOps Platform Team
- Arquitectura
- Leads de cada plataforma (frontend, backend, iOS, Android)

## Salidas

- Minutas en `docs/technical/hook-system/meetings/YYYY-MM-DD.md` (crear).
- Actualización del backlog del hook-system (Jira/Notion).
