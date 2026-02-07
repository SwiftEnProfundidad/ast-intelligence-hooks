# Windsurf Hook Runtime Validation

Objective: validate `pre_write_code` and `post_write_code` runtime behavior in a real Windsurf session after Node wrapper hardening.

## Preconditions

- Repo checked out with latest `enterprise-refactor`.
- Windsurf config refreshed from current repo path:
  - `npm run install:windsurf-hooks-config`
  - (alternative) `npm run print:windsurf-hooks-config > ~/.codeium/windsurf/hooks.json`
- Runtime/config wiring pre-check:
  - `npm run verify:windsurf-hooks-runtime`
- Windsurf hook config uses:
  - `run-hook-with-node.sh pre-write-code-hook.js`
  - `run-hook-with-node.sh post-write-code-hook.js`
- Optional env toggles:
  - `PUMUKI_HOOK_DIAGNOSTIC=1` (recommended during validation)
  - `PUMUKI_HOOK_STRICT_NODE=1` (validate only after diagnostics are stable)

## Steps

1. Run local runtime diagnostics collector:
   - `bash legacy/scripts/hooks-system/infrastructure/cascade-hooks/collect-runtime-diagnostics.sh`
2. Open Windsurf and trigger a normal write (`post_write_code` expected).
3. Trigger a blocked write candidate (`pre_write_code` expected) with a known blocked pattern.
4. Capture generated logs:
   - `.audit_tmp/cascade-hook-runtime-*.log`
   - `.audit_tmp/cascade-hook-smoke-*.log`
   - `.audit_tmp/cascade-hook.log`
   - `.audit_tmp/cascade-writes.log`
5. Validate strict mode behavior:
   - Enable `PUMUKI_HOOK_STRICT_NODE=1`.
   - Repeat one `pre_write_code` write and confirm no false positive block when Node runtime is present.
6. Record outcome summary:
   - `PASS` if hooks execute and logs contain resolved `node_bin` and expected events.
   - `FAIL` if runtime resolution is unstable or events are missing.

7. Optional automatic assessment (last 24h by default):
   - `npm run assess:windsurf-hooks-session`
   - default mode excludes simulated local events (`__pumuki_simulated__`)
   - include simulated events:
     - `npm run assess:windsurf-hooks-session:any`
   - custom lower bound:
     - `bash legacy/scripts/hooks-system/infrastructure/cascade-hooks/assess-windsurf-session.sh "2026-02-07T00:00:00.000Z"`

## Evidence to attach

- Hook config snippet (`~/.codeium/windsurf/hooks.json`).
- Tail output from relevant `.audit_tmp` files.
- Any console output showing runtime resolution failures.
