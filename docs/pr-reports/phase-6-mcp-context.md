# Phase 6 - MCP Evidence Context Hardening

## Objective

Validate and operationalize the read-only evidence context server so agents can consume deterministic `ai_evidence v2.1` before acting.

## Commits

- `3cf08a7` test(mcp): add evidence context server coverage and runnable CLI script
- `82180dc` ci(mcp): run evidence context server tests in deterministic workflow
- `82cb873` ci(tests): unify deterministic suite for evidence mcp and heuristics
- `b5088af` feat(mcp): add compact/full evidence response filters for consolidation-aware payloads
- `5c8227a` test(mcp): cover compact/full evidence query variants

## Scope

- MCP context server tests:
  - `integrations/mcp/__tests__/evidenceContextServer.test.ts`
- MCP runtime command:
  - `package.json` -> `mcp:evidence`
- Deterministic suite orchestration:
  - `package.json` -> `test:deterministic`
  - `.github/workflows/pumuki-evidence-tests.yml`
- Documentation update:
  - `docs/MCP_EVIDENCE_CONTEXT_SERVER.md`
  - query options: `includeSuppressed`, `view=compact|full`

## Validation status

- `npm run test:mcp` passes.
- `npm run test:deterministic` passes (evidence + mcp + heuristics).
- Server keeps read-only contract and returns `404` for missing/invalid evidence.
- Server now supports compact evidence responses without `consolidation.suppressed[]` when requested.
- MCP tests cover both query forms: `includeSuppressed=false` and `view=compact|full`.
