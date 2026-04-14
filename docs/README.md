# Documentation Index

Mapa corto y humano de la documentación oficial de Pumuki.

## Si buscas algo concreto

- Quiero límites del producto, perfil de adopción y comandos mínimos (sin leer todo el README largo):
  - `README.md` (secciones **Qué NO es Pumuki**, **Rutas de adopción**, **Comandos esenciales**)
- Quiero instalar y arrancar Pumuki en un repo consumidor:
  - `README.md`
  - `docs/product/INSTALLATION.md`
  - `docs/product/USAGE.md`

- Quiero entender cómo funciona por dentro:
  - `ARCHITECTURE.md`
  - `docs/product/ARCHITECTURE.md`
  - `docs/product/HOW_IT_WORKS.md`

- Quiero el contrato técnico de CLI, status, doctor o evidence:
  - `docs/product/API_REFERENCE.md`
  - `docs/mcp/ai-evidence-v2.1-contract.md`

- Quiero la parte MCP:
  - `docs/mcp/mcp-servers-overview.md`
  - `docs/mcp/evidence-context-server.md`
  - `docs/mcp/agent-context-consumption.md`

- Quiero operación diaria o releases:
  - `PUMUKI.md`
  - `docs/operations/production-operations-policy.md`
  - `docs/operations/framework-menu-consumer-walkthrough.md`
  - `docs/operations/RELEASE_NOTES.md`

- Quiero runbooks de validación:
  - `docs/validation/README.md`
  - `docs/validation/ios-avdlee-parity-matrix.md`

- Quiero saber en qué estamos ahora:
  - `PUMUKI-RESET-MASTER-PLAN.md` en la raíz del repo como artefacto operativo local y única fuente viva del tracking interno
- Quiero contexto histórico o materiales de seguimiento retirados:
  - Referencia histórica: `docs/tracking/plan-activo-de-trabajo.md`
  - Quiero el seguimiento del curso Stack My Architecture (Pumuki), iniciativa formativa aparte del espejo operativo:
  - Curso Stack My Architecture: `docs/tracking/plan-curso-pumuki-stack-my-architecture.md`

## Estructura oficial

- `docs/product/`
  - Manual funcional y técnico del producto.
  - Contiene arquitectura, instalación, uso, configuración, testing y referencia API.

- `docs/governance/`
  - Reglas de contribución y gobierno del repo.

- `docs/mcp/`
  - Contratos MCP, evidence y consumo por agentes.

- `docs/operations/`
  - Operación diaria, walkthroughs y notas de release.

- `docs/validation/`
  - Runbooks y contratos estables de validación.

- `docs/rule-packs/`
  - Packs de reglas oficiales por ámbito.

- `docs/codex-skills/`
  - Skills vendorizadas que el repo usa como contrato local.

- `docs/tracking/`
  - Material histórico o formativo; no actúa como backlog vivo del producto.
  - Fuente viva del tracking interno: `PUMUKI-RESET-MASTER-PLAN.md` en la raíz del repo.
  - Documento retirado: `docs/tracking/plan-activo-de-trabajo.md`.
  - Material del curso: `docs/tracking/plan-curso-pumuki-stack-my-architecture.md`.

## Fuera de `docs/`

- `README.md`
- `ARCHITECTURE.md`
- `CHANGELOG.md`
- `AGENTS.md`
- `PUMUKI.md`

## Lo que no se conserva

- No se guardan en `docs/` reportes ad-hoc de ejecución.
- Los artefactos efímeros se limpian al cerrar ciclo:
  - `.audit-reports/**`
  - `.coverage/**`
  - `.ai_evidence.json`
