# Windsurf Hook Runtime - Real Session Report Template

Use this template after executing `docs/validation/windsurf-hook-runtime-validation.md`.

You can generate a pre-filled report from available logs with:

```bash
npm run validation:windsurf-real-session-report -- \
  --status-report docs/validation/windsurf-session-status.md \
  --out docs/validation/windsurf-real-session-report.md
```

## Metadata

- Date:
- Operator:
- Branch:
- Repository:
- Windsurf version:
- Node runtime:
- Hook config path:

## Preconditions Check

- `npm run install:windsurf-hooks-config`: PASS/FAIL
- `npm run verify:windsurf-hooks-runtime`: PASS/FAIL
- `PUMUKI_HOOK_DIAGNOSTIC=1`: ON/OFF
- `PUMUKI_HOOK_STRICT_NODE=1`: ON/OFF

## Real Session Steps

1. Normal write action triggered in Windsurf: PASS/FAIL
2. Blocked candidate write action triggered in Windsurf: PASS/FAIL
3. Strict-node validation write action triggered: PASS/FAIL

## Observed Runtime Signals

- `pre_write_code` event observed: YES/NO
- `post_write_code` event observed: YES/NO
- `node_bin` resolved in runtime logs: YES/NO
- Missing runtime events: YES/NO
- Any `bash: node: command not found`: YES/NO

## Captured Evidence

- `~/.codeium/windsurf/hooks.json` snippet attached: YES/NO
- `.audit_tmp/cascade-hook-runtime-*.log` tail attached: YES/NO
- `.audit_tmp/cascade-hook-smoke-*.log` tail attached: YES/NO
- `.audit_tmp/cascade-hook.log` tail attached: YES/NO
- `.audit_tmp/cascade-writes.log` tail attached: YES/NO

## Outcome

- Validation result: PASS / FAIL
- Summary:
- Root cause (if failed):
- Corrective action:
- Re-test required: YES/NO

## Follow-up

- Update `docs/TODO.md` Windsurf item status.
- If failed, attach remediation plan and rerun command outputs.
