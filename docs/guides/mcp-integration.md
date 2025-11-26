# MCP Integration Guide

Cómo integrar `@pumuki/ast-intelligence-hooks` con asistentes de IA vía **Model Context Protocol (MCP)**.

## Recursos expuestos

- `ai://gate` – AI Gate Check (evidence + Git Flow).
- `evidence://status` – Estado de `.AI_EVIDENCE.json`.
- `gitflow://state` – Estado del ciclo Git Flow.
- `context://active` – Contexto activo y plataformas detectadas.

## Flujo recomendado

1. El asistente lee `ai://gate` al inicio de cada respuesta.
2. Si el estado es `BLOCKED`, debe anunciar las violaciones y ayudar a resolverlas.
3. Si el estado es `ALLOWED`, puede leer `evidence://status` y `gitflow://state` para tener contexto.

> TODO: Añadir ejemplos de configuración en Windsurf/Cursor y comandos concretos.
