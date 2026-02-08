# Adapter Hook Runtime Validation

Objective: validate `pre_write_code` and `post_write_code` runtime behavior in a real Adapter session after Node wrapper hardening.

Scope note: this is an optional adapter-validation runbook and does not alter PRE_COMMIT/PRE_PUSH/CI gate decisions.

## Preconditions

- Repo checked out with latest `enterprise-refactor`.
- Adapter config refreshed from current repo path:
  - `npm run install:adapter-hooks-config`
  - (alternative) `npm run print:adapter-hooks-config > ~/.codeium/adapter/hooks.json`
- Runtime/config wiring pre-check:
  - `npm run verify:adapter-hooks-runtime`
- Adapter hook config uses:
  - `run-hook-with-node.sh pre-write-code-hook.js`
  - `run-hook-with-node.sh post-write-code-hook.js`
- Optional env toggles:
  - `PUMUKI_HOOK_DIAGNOSTIC=1` (recommended during validation)
  - `PUMUKI_HOOK_STRICT_NODE=1` (validate only after diagnostics are stable)

## Steps

1. Run local runtime diagnostics collector:
   - `bash legacy/scripts/hooks-system/infrastructure/cascade-hooks/collect-runtime-diagnostics.sh`
2. Open Adapter and trigger a normal write (`post_write_code` expected).
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
   - `npm run assess:adapter-hooks-session`
   - default mode excludes simulated local events (`__pumuki_simulated__`)
   - include simulated events:
     - `npm run assess:adapter-hooks-session:any`
   - custom lower bound:
     - `bash legacy/scripts/hooks-system/infrastructure/cascade-hooks/assess-adapter-session.sh "2026-02-07T00:00:00.000Z"`
   - consolidated report:
     - `npm run validation:adapter-session-status -- --out docs/validation/adapter-session-status.md`
   - pre-filled real-session report:
     - `npm run validation:adapter-real-session-report -- --status-report docs/validation/adapter-session-status.md --out docs/validation/adapter-real-session-report.md`

## Known Failure Signature and Remediation

If Adapter shows hook failures with:

- `bash: node: command not found`
- command path similar to:
  - `.../node_modules/pumuki-ast-hooks/.../pre-write-code-hook.js`
  - `.../node_modules/pumuki-ast-hooks/.../post-write-code-hook.js`

then the active `~/.codeium/adapter/hooks.json` is using a stale direct `node` invocation.

Remediation:

1. Reinstall hook config from the active framework repository:
   - `npm run install:adapter-hooks-config`
2. Verify wrapper wiring and runtime resolution:
   - `npm run verify:adapter-hooks-runtime`
3. Re-run a real Adapter write event and confirm hooks execute via:
   - `run-hook-with-node.sh pre-write-code-hook.js`
   - `run-hook-with-node.sh post-write-code-hook.js`
4. Attach the updated `hooks.json` snippet and `.audit_tmp/cascade-hook-runtime-*.log` tail to validation evidence.

## Evidence to attach

- Hook config snippet (`~/.codeium/adapter/hooks.json`).
- Tail output from relevant `.audit_tmp` files.
- Any console output showing runtime resolution failures.
- Completed report based on:
  - `docs/validation/adapter-real-session-report-template.md`
  - or generated with:
    - `npm run validation:adapter-real-session-report -- --status-report docs/validation/adapter-session-status.md --out docs/validation/adapter-real-session-report.md`
