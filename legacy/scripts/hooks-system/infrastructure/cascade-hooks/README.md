# IDE Hooks + Git Pre-Commit Enforcement

Deterministic runtime hardening for AI code-writing workflows.

This module combines IDE-level hooks (when supported) with Git pre-commit as the universal fallback.

## Purpose

- Block high-risk code patterns before write when the IDE supports pre-write hooks.
- Keep a deterministic audit trail for pre-write and post-write activity.
- Ensure there is always a fallback enforcement layer through Git hooks.

## IDE Coverage

| IDE | Pre-Write Hook | Blocks Before Write | Mechanism | Config |
|---|---|---|---|---|
| Adapter (Codeium-compatible) | `pre_write_code` | Yes | `exit(2)` | `~/.codeium/adapter/hooks.json` |
| Claude Code | `PreToolUse` (Write/Edit) | Yes | `exit(2)` | `~/.config/claude-code/settings.json` |
| OpenCode | `tool.execute.before` plugin | Yes | throw error | `opencode.json` or `~/.config/opencode/opencode.json` |
| Codex CLI | Approval policies only | No (manual) | N/A | `~/.codex/config.toml` |
| Cursor | `afterFileEdit` only | No (post-write) | N/A | `.cursor/hooks.json` |
| Kilo Code | Not documented | No | N/A | N/A |

Git pre-commit remains the guaranteed enforcement fallback across IDEs.

## Adapter Setup

### Recommended install flow

```bash
npm run install:adapter-hooks-config
npm run verify:adapter-hooks-runtime
```

This installs `~/.codeium/adapter/hooks.json` with an automatic backup of any previous file.

### Generate config only (no write)

```bash
npm run print:adapter-hooks-config > ~/.codeium/adapter/hooks.json
```

### Installer dry run

```bash
bash legacy/scripts/hooks-system/infrastructure/cascade-hooks/install-adapter-hooks-config.sh --dry-run
```

### Restart Adapter

Restart the IDE after updating hook configuration.

### Troubleshooting stale direct-node config

If Adapter shows hook errors similar to `bash: node: command not found` and command paths under `.../node_modules/pumuki-ast-hooks/...`, the active `~/.codeium/adapter/hooks.json` is likely stale and still invoking `node` directly.

Run:

```bash
npm run install:adapter-hooks-config
npm run verify:adapter-hooks-runtime
```

Legacy aliases still available for compatibility:
- `install:windsurf-hooks-config`
- `verify:windsurf-hooks-runtime`
- `print:windsurf-hooks-config`

## Runtime Resolution Model

`run-hook-with-node.sh` resolves Node runtime in this order:

1. `NODE_BINARY` (explicit)
2. `node` in `PATH`
3. common runtime managers (`nvm`, `volta`, `asdf`, `fnm`, Homebrew)

If Node is not found:

- Compatibility mode (default): non-blocking fallback
- Strict mode (`PUMUKI_HOOK_STRICT_NODE=1`): fail with `exit(2)`

## Diagnostics

### Wrapper diagnostics

```bash
bash "/ABSOLUTE/PATH/TO/legacy/scripts/hooks-system/infrastructure/cascade-hooks/run-hook-with-node.sh" --diagnose
```

Or enable diagnostics for normal hook executions:

- `PUMUKI_HOOK_DIAGNOSTIC=1`

### Runtime collector

```bash
bash "/ABSOLUTE/PATH/TO/legacy/scripts/hooks-system/infrastructure/cascade-hooks/collect-runtime-diagnostics.sh"
```

Generates support logs under `.audit_tmp/`.

## Local Validation and Session Assessment

### Local simulation

```bash
npm run validate:adapter-hooks-local
```

Expected local result:

- `PRE_EXIT=2`
- `POST_EXIT=0`

Artifacts are written to `docs/validation/adapter/artifacts/`.

### Session assessment

Strict real-session assessment (default, excludes simulated markers):

```bash
npm run assess:adapter-hooks-session
```

Include simulated entries:

```bash
npm run assess:adapter-hooks-session:any
```

## Recommended Rollout

1. Compatibility mode
   - Keep strict mode disabled.
2. Diagnostic stabilization
   - Enable runtime diagnostics and validate resolution consistency.
3. Strict enforcement
   - Enable `PUMUKI_HOOK_STRICT_NODE=1` once runtime stability is confirmed.

## Execution Model

1. IDE triggers `pre_write_code`.
2. Hook receives `{ file_path, edits }`.
3. Proposed code is analyzed in memory.
4. If critical violations are found, hook exits with `2` and blocks write.
5. `post_write_code` logs telemetry for allowed writes.

## Typical Blocked Patterns

| Pattern | Rule | Message |
|---|---|---|
| `catch {}` | `common.error.empty_catch` | Empty catch block detected |
| `.shared` | `common.singleton` | Singleton pattern detected |
| `DispatchQueue.main` | `ios.concurrency.gcd` | Use async/await |
| `@escaping` | `ios.concurrency.completion_handler` | Avoid completion handlers |
| `ObservableObject` | `ios.swiftui.observable_object` | Prefer `@Observable` |
| `AnyView` | `ios.swiftui.any_view` | Avoid type erasure for performance |

## Logs

- `.audit_tmp/cascade-hook.log`: pre-write decision log
- `.audit_tmp/cascade-writes.log`: post-write activity log

## Key Files

- `pre-write-code-hook.js`: pre-write blocking logic
- `post-write-code-hook.js`: post-write logging
- `run-hook-with-node.sh`: resilient runtime wrapper
- `cascade-hooks-config.json`: adapter config template
- `collect-runtime-diagnostics.sh`: runtime diagnostics bundle
- `validate-local-runtime.sh`: local simulation runner
- `verify-adapter-hooks-runtime.sh`: config/runtime preflight check
- `assess-adapter-session.sh`: strict/any session assessor

---
Pumuki Team - AST Intelligence
