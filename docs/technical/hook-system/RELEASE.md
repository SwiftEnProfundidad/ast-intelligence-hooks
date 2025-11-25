# Hook-System Release Guide

## Versionado

- Paquete interno `@ruralgo/hook-system` (`scripts/hooks-system/package.json`).
- Versionado semántico (MAJOR.MINOR.PATCH).
- Registrar cambios en `scripts/hooks-system/CHANGELOG.md`.

## Flujo propuesto

1. Ejecutar pruebas locales (playbooks críticos, predictive, status).
2. Actualizar versión en `package.json`.
3. Documentar en `CHANGELOG.md`.
4. Crear tag `hook-system-vX.Y.Z`.
5. Publicar artefacto (tarball) en registry interno.

## Automatización futura (Phase 4)

- Script `npm version` personalizado.
- Pipeline CI que genere release notes automáticamente.
- Distribución vía GitHub Packages.
