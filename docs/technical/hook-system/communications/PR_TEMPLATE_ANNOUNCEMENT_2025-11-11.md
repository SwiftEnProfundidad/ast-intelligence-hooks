Location: docs/technical/hook-system/communications/PR_TEMPLATE_ANNOUNCEMENT_2025-11-11.md
Related to: PR template socialization
Owner: Pumuki Team®

# PR Template Socialization – Announcement (11/11/2025)

## Context
- Plantilla PR multitecnología (`.github/pull_request_template.md`) publicada con checklists para Backend, Frontend, iOS, Android, Shared y Tooling.
- Governance reforzada con hook-system (AI evidence, git-wrapper, pre-receive y validación Conventional Commit). Branch protection automática bloqueada por plan GitHub Free → se mantiene enforcement local.

## Slack message (canal #platform)
```
:tada: **Nueva plantilla PR multitecnología** – ya está disponible con checklists por plataforma.

**Qué cambia hoy**
1. Usa la plantilla en tu próxima PR (`.github/pull_request_template.md`).
2. Marca únicamente las plataformas afectadas y adjunta evidencia (build/test) correspondiente.
3. Menciona al CODEOWNER si GitHub no lo sugiere automáticamente.

**Enforcement**
- Branch protection automática está bloqueada (plan GitHub Free). Mientras tanto el guard local (git-wrapper + pre-receive + commit-msg hook) impide pushes directos y valida Conventional Commits.
- Necesitamos al menos *una* aprobación del owner + pipelines verdes antes de merge.

**Apoyo**
- Training flash (11:00 CET, 15 min) con walkthrough del checklist → se grabará y quedará en la wiki.
- Guía rápida disponible en `docs/technical/hook-system/guides/PR_TEMPLATE_SOCIALIZATION.md`.
- Dudas → responde a este hilo o menciona a @Platform-Chapter.

¡Gracias por mantener el monorepo saludable! :rocket:
```

## Training flash
- **Fecha:** 11/11/2025 – 11:00 CET (grabación en wiki interna).
- **Agenda:** walkthrough de la plantilla, ejemplos por plataforma, repaso de enforcement local y preguntas.
- **Materiales:** guía de socialización + GOV actualizada con la limitación de branch protection.

## Follow-up
- **Arquitectura/Product:** incorporar la grabación y enlace a la guía en la wiki (deadline 12/11).
- **Platform Chapter:** registrar feedback después de la primera semana para ajustar la plantilla si es necesario.
- **DevOps:** mantener backlog para upgrade de plan GitHub y reintentar branch protection cuando exista presupuesto.
