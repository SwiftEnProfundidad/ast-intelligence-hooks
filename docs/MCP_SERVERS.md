# MCP Servers (v2.x)

Pumuki expone dos servidores MCP HTTP opcionales:

- `pumuki-mcp-evidence`: API read-only para `.ai_evidence.json`.
- `pumuki-mcp-enterprise`: superficie enterprise consolidada (resources + tools) con guardrails fail-safe.

El enforcement de gates (`pre-commit`, `pre-push`, `ci`) no depende de MCP.

## Arranque rápido

### Desde el repositorio framework

```bash
npm run mcp:evidence
npm run mcp:enterprise
```

### Desde un repositorio consumidor

```bash
npx --yes pumuki-mcp-evidence
npx --yes pumuki-mcp-enterprise
```

## 1) Evidence Context Server (`pumuki-mcp-evidence`)

### Implementación

- `integrations/mcp/evidenceContextServer.ts`
- `integrations/mcp/evidenceContextServer.cli.ts`

### Purpose

Exponer evidencia v2.1 de forma determinista y solo lectura.

### Configuración runtime

- Host default: `127.0.0.1`
- Port default: `7341`
- Route default: `/ai-evidence`

Variables de entorno:

- `PUMUKI_EVIDENCE_HOST`
- `PUMUKI_EVIDENCE_PORT`
- `PUMUKI_EVIDENCE_ROUTE`

### Endpoints

- `GET /health`
- `GET /status`
- `GET /<route>` (default: `/ai-evidence`)
- `GET /<route>/summary`
- `GET /<route>/snapshot`
- `GET /<route>/findings`
- `GET /<route>/rulesets`
- `GET /<route>/platforms`
- `GET /<route>/ledger`

Comportamiento:

- Si falta evidencia o no cumple `version = "2.1"`, los endpoints de evidencia devuelven `404`.
- `findings`, `rulesets`, `platforms` y `ledger` soportan filtrado/paginación deterministas.

## 2) Enterprise MCP Server (`pumuki-mcp-enterprise`)

### Implementación

- `integrations/mcp/enterpriseServer.ts`
- `integrations/mcp/enterpriseServer.cli.ts`

### Purpose

Expose enterprise operational state for the active repository:

- estado de evidencia,
- estado gitflow,
- estado lifecycle,
- estado SDD/OpenSpec,
- toolset legacy-style en modo seguro.

### Configuración runtime

- Host default: `127.0.0.1`
- Port default: `7391`

Variables de entorno:

- `PUMUKI_ENTERPRISE_MCP_HOST`
- `PUMUKI_ENTERPRISE_MCP_PORT`

### Endpoints

- `GET /health`
- `GET /status`
- `GET /resources`
- `GET /resource?uri=<resource-uri>`
- `GET /tools`
- `POST /tool`

`GET /status` devuelve:

- `capabilities.resources`
- `capabilities.tools`
- `capabilities.mode = "baseline"`
- `lifecycle` (o `null` si no aplica)
- `sdd` (o `null` si no aplica)
- `evidence` (status payload)
  - `evidence.exists`: booleano obligatorio (`true|false`, nunca `null`)
  - `evidence.present`: alias de compatibilidad (mismo estado de existencia)
  - `evidence.valid`: booleano obligatorio

### Catálogo de resources

- `evidence://status`
- `gitflow://state`
- `context://active`
- `sdd://status`
- `sdd://active-change`

`GET /resource` responde:

```json
{
  "uri": "sdd://status",
  "payload": {}
}
```

URI no soportada devuelve `404`.

### Catálogo de tools

- `ai_gate_check`
- `check_sdd_status`
- `validate_and_fix`
- `sync_branches`
- `cleanup_stale_branches`

`GET /tools` incluye metadatos por tool (`name`, `description`, `mutating`, `safeByDefault`).

`POST /tool` acepta:

```json
{
  "name": "sync_branches",
  "dryRun": false,
  "args": {
    "stage": "PRE_PUSH"
  }
}
```

`POST /tool` responde siempre con envelope estable:

```json
{
  "tool": "sync_branches",
  "dryRun": true,
  "executed": false,
  "success": true,
  "warnings": [],
  "result": {}
}
```

`ai_gate_check` usa el evaluador unificado (`integrations/gate/evaluateAiGate.ts`) y devuelve:

- `status`: `ALLOWED|BLOCKED`
- `stage`
- `violations[]`
- `evidence` (kind + age/max-age)
- `repo_state` (git + lifecycle snapshot)

### Guardrails enterprise (baseline fail-safe)

- Tools mutating (`validate_and_fix`, `sync_branches`, `cleanup_stale_branches`) fuerzan `dryRun=true` aunque se solicite `dryRun=false`.
- Tools críticos (`validate_and_fix`, `sync_branches`, `cleanup_stale_branches`) pasan por guardia SDD/session.
- Si SDD bloquea, `/tool` devuelve `success=false`, `executed=false` y `result.guard.decision`.
- Errores de ejecución se manejan fail-safe (`success=false`, sin mutaciones).

Códigos SDD frecuentes en bloqueo:

- `OPENSPEC_MISSING`
- `OPENSPEC_PROJECT_MISSING`
- `SDD_SESSION_MISSING`
- `SDD_SESSION_INVALID`
- `SDD_CHANGE_MISSING`
- `SDD_CHANGE_ARCHIVED`
- `SDD_VALIDATION_FAILED`
- `SDD_VALIDATION_ERROR`

## Comportamiento HTTP

- Endpoint desconocido: `404`
- Método no permitido: `405`
- JSON inválido en `POST /tool`: `400`
- Body inválido en `POST /tool`: `400`

## Validación

Suites MCP:

- `integrations/mcp/__tests__/evidenceContextServer-*.test.ts`
- `integrations/mcp/__tests__/enterpriseServer.test.ts`

Comando:

```bash
npm run test:mcp
```

## Referencias

- `docs/MCP_EVIDENCE_CONTEXT_SERVER.md`
- `docs/MCP_AGENT_CONTEXT_CONSUMPTION.md`
- `docs/evidence-v2.1.md`
