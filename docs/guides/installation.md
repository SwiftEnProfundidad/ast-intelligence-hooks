# Installation Guide

Guía rápida para instalar y usar `@pumuki/ast-intelligence-hooks` en un repositorio.

## 1. Instalar dependencia

```bash
npm install @pumuki/ast-intelligence-hooks --save-dev
```

## 2. Instalar hooks

```bash
npx ast-hooks install
```

> TODO: Detallar todos los flags y opciones avanzadas.

## 3. Verificar health

```bash
npx ast-hooks health
```

- `ok` debe ser `true`.
- `evidence.exists` debe ser `true`.
- `astWatch.running` indica si el watcher está activo.
