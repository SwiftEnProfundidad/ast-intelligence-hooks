import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const resolveScriptPath = (relativePath: string): string =>
  fileURLToPath(new URL(relativePath, import.meta.url));

const runTsxScript = (scriptPath: string, args: ReadonlyArray<string>) =>
  spawnSync('node', ['--import', 'tsx', scriptPath, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

const createBacklogFile = (contents: string): string => {
  const dir = mkdtempSync(join(tmpdir(), 'pumuki-backlog-cli-'));
  const filePath = join(dir, 'backlog.md');
  writeFileSync(filePath, contents, 'utf8');
  return filePath;
};

test('watch-consumer-backlog --help devuelve exit code 0', () => {
  const scriptPath = resolveScriptPath('../watch-consumer-backlog.ts');
  const result = runTsxScript(scriptPath, ['--help']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/);
  assert.match(result.stdout, /--id-issue-map-from/);
});

test('reconcile-consumer-backlog-issues --help devuelve exit code 0', () => {
  const scriptPath = resolveScriptPath('../reconcile-consumer-backlog-issues.ts');
  const result = runTsxScript(scriptPath, ['--help']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/);
  assert.match(result.stdout, /--resolve-missing-via-gh/);
});

test('watch-consumer-backlog unknown arg devuelve exit code 1', () => {
  const scriptPath = resolveScriptPath('../watch-consumer-backlog.ts');
  const result = runTsxScript(scriptPath, ['--unknown']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown argument/);
});

test('reconcile-consumer-backlog-issues unknown arg devuelve exit code 1', () => {
  const scriptPath = resolveScriptPath('../reconcile-consumer-backlog-issues.ts');
  const result = runTsxScript(scriptPath, ['--unknown']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown argument/);
});

test('watch-consumer-backlog --json incluye tool y schema_version', () => {
  const scriptPath = resolveScriptPath('../watch-consumer-backlog.ts');
  const backlogFile = createBacklogFile(
    `| ID | Estado | Referencia upstream |\n|---|---|---|\n| PUMUKI-001 | ✅ | #100 |\n`
  );
  const result = runTsxScript(scriptPath, ['--file=' + backlogFile, '--json', '--no-fail']);
  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout) as {
    tool?: string;
    schema_version?: string;
    generated_at?: string;
    run_id?: string;
    invocation?: {
      mode?: string;
      repo?: string | null;
      resolve_missing_via_gh?: boolean;
      id_issue_map?: string;
      id_issue_map_from?: string;
    };
    compat?: {
      contract_id?: string;
      min_reader_version?: string;
      is_backward_compatible?: boolean;
      breaking_changes?: unknown[];
    };
    classification_counts?: {
      needs_issue?: number;
      drift_closed_issue?: number;
      active_issue?: number;
      heading_drift?: number;
    };
    compat?: {
      contract_id?: string;
    };
    action_required_reasons?: string[];
    next_command?: string;
    next_command_reason?: string;
    next_commands?: Array<{
      id?: number;
      origin_tool?: string;
      label?: string;
      recommendation_type?: string;
      priority?: string;
      mode?: string;
      safety?: string;
      idempotent?: boolean;
      max_retries?: number;
      retry_strategy?: string;
      estimated_duration_ms?: number;
      requires_confirmation?: boolean;
      depends_on?: string | null;
      execution_group_id?: string;
      origin_schema_version?: string;
      origin_contract_id?: string;
      description?: string;
      expected_outcome?: string;
      success_criteria?: string;
      success_probe?: string;
      probe_kind?: string;
      probe_timeout_ms?: number;
      failure_hint?: string;
      command?: string;
    }>;
  };
  assert.equal(payload.tool, 'backlog-watch');
  assert.equal(payload.schema_version, '1.0.0');
  assert.match(payload.generated_at ?? '', /^\d{4}-\d{2}-\d{2}T/);
  assert.match(payload.run_id ?? '', /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.equal(payload.invocation?.mode, 'json');
  assert.equal(payload.invocation?.repo, null);
  assert.equal(payload.invocation?.resolve_missing_via_gh, false);
  assert.equal(payload.invocation?.id_issue_map, 'none');
  assert.equal(payload.invocation?.id_issue_map_from, 'none');
  assert.equal(payload.compat?.contract_id, 'backlog-tooling-json-v1');
  assert.equal(payload.compat?.min_reader_version, '1.0.0');
  assert.equal(payload.compat?.is_backward_compatible, true);
  assert.deepEqual(payload.compat?.breaking_changes, []);
  assert.equal(payload.classification_counts?.needs_issue, 0);
  assert.equal(payload.classification_counts?.drift_closed_issue, 0);
  assert.equal(payload.classification_counts?.active_issue, 0);
  assert.equal(payload.classification_counts?.heading_drift, 0);
  assert.deepEqual(payload.action_required_reasons, []);
  assert.equal(payload.next_command, undefined);
  assert.equal(payload.next_command_reason, undefined);
  assert.equal(payload.next_commands, undefined);
});

test('watch-consumer-backlog detecta heading drift en salida humana y JSON', () => {
  const scriptPath = resolveScriptPath('../watch-consumer-backlog.ts');
  const backlogFile = createBacklogFile(
    `| ID | Estado | Referencia upstream |\n|---|---|---|\n| PUMUKI-INC-301 | 🚧 | Pendiente |\n\n### ⏳ PUMUKI-INC-301\nDetalle.\n`
  );

  const human = runTsxScript(scriptPath, ['--file=' + backlogFile, '--no-fail']);
  assert.equal(human.status, 0);
  assert.match(human.stdout, /heading_drift=1/);
  assert.match(human.stdout, /\[pumuki\]\[backlog-watch\] heading_drift_entries:/);
  assert.match(human.stdout, /PUMUKI-INC-301: heading=⏳ effective=🚧/);
  assert.match(human.stdout, /action_required_reasons=needs_issue,heading_drift/);
  assert.match(human.stdout, /hint=use --no-fail to inspect findings without exit code 1/);

  const json = runTsxScript(scriptPath, ['--file=' + backlogFile, '--json', '--no-fail']);
  assert.equal(json.status, 0);
  const payload = JSON.parse(json.stdout) as {
    classification_counts?: {
      needs_issue?: number;
      drift_closed_issue?: number;
      active_issue?: number;
      heading_drift?: number;
    };
    action_required_reasons?: string[];
    next_command?: string;
    next_command_reason?: string;
    next_commands?: Array<{
      id?: number;
      origin_tool?: string;
      label?: string;
      recommendation_type?: string;
      priority?: string;
      mode?: string;
      safety?: string;
      idempotent?: boolean;
      max_retries?: number;
      retry_strategy?: string;
      estimated_duration_ms?: number;
      requires_confirmation?: boolean;
      depends_on?: string | null;
      execution_group_id?: string;
      origin_schema_version?: string;
      description?: string;
      expected_outcome?: string;
      success_criteria?: string;
      success_probe?: string;
      probe_kind?: string;
      probe_timeout_ms?: number;
      failure_hint?: string;
      command?: string;
    }>;
    heading_drift_count?: number;
    headingDrift?: Array<{ id?: string; headingStatus?: string; effectiveStatus?: string }>;
    hasActionRequired?: boolean;
  };
  assert.equal(payload.heading_drift_count, 1);
  assert.equal(payload.headingDrift?.length, 1);
  assert.equal(payload.headingDrift?.[0]?.id, 'PUMUKI-INC-301');
  assert.equal(payload.headingDrift?.[0]?.headingStatus, '⏳');
  assert.equal(payload.headingDrift?.[0]?.effectiveStatus, '🚧');
  assert.equal(payload.classification_counts?.needs_issue, 1);
  assert.equal(payload.classification_counts?.drift_closed_issue, 0);
  assert.equal(payload.classification_counts?.active_issue, 0);
  assert.equal(payload.classification_counts?.heading_drift, 1);
  assert.deepEqual(payload.action_required_reasons, ['needs_issue', 'heading_drift']);
  assert.match(payload.next_command ?? '', /--file='/);
  assert.match(payload.next_command ?? '', /--json &&/);
  assert.match(payload.next_command ?? '', /--apply$/);
  assert.equal(payload.next_command_reason, 'needs_issue');
  assert.equal(payload.next_commands?.length, 2);
  assert.equal(payload.next_commands?.[0]?.execution_group_id, payload.run_id);
  assert.equal(payload.next_commands?.[0]?.origin_schema_version, payload.schema_version);
  assert.equal(payload.next_commands?.[0]?.origin_contract_id, payload.compat?.contract_id);
  assert.equal(payload.next_commands?.[0]?.id, 1);
  assert.equal(payload.next_commands?.[0]?.origin_tool, 'backlog-watch');
  assert.equal(payload.next_commands?.[0]?.label, 'dry_run');
  assert.equal(payload.next_commands?.[0]?.recommendation_type, 'reconcile_loop');
  assert.equal(payload.next_commands?.[0]?.priority, 'high');
  assert.equal(payload.next_commands?.[0]?.mode, 'dry-run');
  assert.equal(payload.next_commands?.[0]?.safety, 'read_only');
  assert.equal(payload.next_commands?.[0]?.idempotent, true);
  assert.equal(payload.next_commands?.[0]?.max_retries, 2);
  assert.equal(payload.next_commands?.[0]?.retry_strategy, 'immediate');
  assert.equal(payload.next_commands?.[0]?.estimated_duration_ms, 3000);
  assert.equal(payload.next_commands?.[0]?.requires_confirmation, false);
  assert.equal(payload.next_commands?.[0]?.depends_on, null);
  assert.match(payload.next_commands?.[0]?.description ?? '', /without mutating files/);
  assert.match(payload.next_commands?.[0]?.expected_outcome ?? '', /without file mutations/);
  assert.equal(payload.next_commands?.[0]?.success_criteria, 'plan_generated_no_mutation');
  assert.match(payload.next_commands?.[0]?.success_probe ?? '', /includes dry_run\/apply next_commands/);
  assert.equal(payload.next_commands?.[0]?.probe_kind, 'json_contract');
  assert.equal(payload.next_commands?.[0]?.probe_timeout_ms, 1500);
  assert.match(payload.next_commands?.[0]?.failure_hint ?? '', /Re-run dry_run/);
  assert.match(payload.next_commands?.[0]?.command ?? '', /--json$/);
  assert.equal(payload.next_commands?.[1]?.execution_group_id, payload.run_id);
  assert.equal(payload.next_commands?.[1]?.origin_schema_version, payload.schema_version);
  assert.equal(payload.next_commands?.[1]?.origin_contract_id, payload.compat?.contract_id);
  assert.equal(payload.next_commands?.[1]?.id, 2);
  assert.equal(payload.next_commands?.[1]?.origin_tool, 'backlog-watch');
  assert.equal(payload.next_commands?.[1]?.label, 'apply');
  assert.equal(payload.next_commands?.[1]?.recommendation_type, 'reconcile_loop');
  assert.equal(payload.next_commands?.[1]?.priority, 'medium');
  assert.equal(payload.next_commands?.[1]?.mode, 'apply');
  assert.equal(payload.next_commands?.[1]?.safety, 'mutating');
  assert.equal(payload.next_commands?.[1]?.idempotent, true);
  assert.equal(payload.next_commands?.[1]?.max_retries, 0);
  assert.equal(payload.next_commands?.[1]?.retry_strategy, 'manual');
  assert.equal(payload.next_commands?.[1]?.estimated_duration_ms, 5000);
  assert.equal(payload.next_commands?.[1]?.requires_confirmation, true);
  assert.equal(payload.next_commands?.[1]?.depends_on, 'dry_run');
  assert.match(payload.next_commands?.[1]?.description ?? '', /Apply reconcile changes/);
  assert.match(payload.next_commands?.[1]?.expected_outcome ?? '', /reconciled and persisted/);
  assert.equal(payload.next_commands?.[1]?.success_criteria, 'backlog_reconciled_persisted');
  assert.match(payload.next_commands?.[1]?.success_probe ?? '', /action_required_reasons are reduced or none/);
  assert.equal(payload.next_commands?.[1]?.probe_kind, 'state_recheck');
  assert.equal(payload.next_commands?.[1]?.probe_timeout_ms, 4000);
  assert.match(payload.next_commands?.[1]?.failure_hint ?? '', /Run dry_run first/);
  assert.match(payload.next_commands?.[1]?.command ?? '', /--apply$/);
  assert.equal(payload.hasActionRequired, true);
});

test('reconcile-consumer-backlog-issues --json incluye tool y schema_version', () => {
  const scriptPath = resolveScriptPath('../reconcile-consumer-backlog-issues.ts');
  const backlogFile = createBacklogFile(
    `| Orden | ID | Estado | Referencia upstream | Nota |\n|---|---|---|---|---|\n| 1 | PUMUKI-001 | ✅ | Pendiente | cerrado |\n`
  );
  const result = runTsxScript(scriptPath, ['--file=' + backlogFile, '--json']);
  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout) as {
    tool?: string;
    schema_version?: string;
    generated_at?: string;
    run_id?: string;
    invocation?: {
      mode?: string;
      repo?: string | null;
      apply?: boolean;
      resolve_missing_via_gh?: boolean;
      id_issue_map?: string;
      id_issue_map_from?: string;
    };
    compat?: {
      contract_id?: string;
      min_reader_version?: string;
      is_backward_compatible?: boolean;
      breaking_changes?: unknown[];
    };
    classification_counts?: {
      issue_changes?: number;
      reference_changes?: number;
      heading_changes?: number;
      summary_closed?: number;
      summary_in_progress?: number;
      summary_pending?: number;
      summary_blocked?: number;
    };
    action_required_reasons?: string[];
    next_command?: string;
    next_command_reason?: string;
    next_commands?: Array<{
      id?: number;
      origin_tool?: string;
      label?: string;
      recommendation_type?: string;
      priority?: string;
      mode?: string;
      safety?: string;
      idempotent?: boolean;
      max_retries?: number;
      retry_strategy?: string;
      estimated_duration_ms?: number;
      requires_confirmation?: boolean;
      depends_on?: string | null;
      execution_group_id?: string;
      origin_schema_version?: string;
      description?: string;
      expected_outcome?: string;
      success_criteria?: string;
      success_probe?: string;
      probe_kind?: string;
      probe_timeout_ms?: number;
      failure_hint?: string;
      command?: string;
    }>;
  };
  assert.equal(payload.tool, 'backlog-reconcile');
  assert.equal(payload.schema_version, '1.0.0');
  assert.match(payload.generated_at ?? '', /^\d{4}-\d{2}-\d{2}T/);
  assert.match(payload.run_id ?? '', /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.equal(payload.invocation?.mode, 'json');
  assert.equal(payload.invocation?.repo, null);
  assert.equal(payload.invocation?.apply, false);
  assert.equal(payload.invocation?.resolve_missing_via_gh, false);
  assert.equal(payload.invocation?.id_issue_map, 'none');
  assert.equal(payload.invocation?.id_issue_map_from, 'none');
  assert.equal(payload.compat?.contract_id, 'backlog-tooling-json-v1');
  assert.equal(payload.compat?.min_reader_version, '1.0.0');
  assert.equal(payload.compat?.is_backward_compatible, true);
  assert.deepEqual(payload.compat?.breaking_changes, []);
  assert.equal(payload.classification_counts?.issue_changes, 0);
  assert.equal(payload.classification_counts?.reference_changes, 0);
  assert.equal(payload.classification_counts?.heading_changes, 0);
  assert.deepEqual(payload.action_required_reasons, []);
  assert.equal(payload.next_command, undefined);
  assert.equal(payload.next_command_reason, undefined);
  assert.equal(payload.next_commands, undefined);
});

test('reconcile-consumer-backlog-issues --json expone heading sync metadata', () => {
  const scriptPath = resolveScriptPath('../reconcile-consumer-backlog-issues.ts');
  const backlogFile = createBacklogFile(
    `| ID | Estado | Referencia upstream |\n|---|---|---|\n| PUMUKI-010 | ✅ | Pendiente |\n\n### ⏳ PUMUKI-010\nDetalle.\n`
  );
  const result = runTsxScript(scriptPath, ['--file=' + backlogFile, '--json', '--apply']);
  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout) as {
    classification_counts?: {
      issue_changes?: number;
      reference_changes?: number;
      heading_changes?: number;
      summary_closed?: number;
      summary_in_progress?: number;
      summary_pending?: number;
      summary_blocked?: number;
    };
    action_required_reasons?: string[];
    heading_changes_count?: number;
    compat?: {
      contract_id?: string;
    };
    headingUpdated?: boolean;
    headingChanges?: Array<{ id?: string; from?: string; to?: string }>;
    next_command?: string;
    next_command_reason?: string;
    next_commands?: Array<{
      id?: number;
      origin_tool?: string;
      label?: string;
      recommendation_type?: string;
      priority?: string;
      mode?: string;
      safety?: string;
      idempotent?: boolean;
      max_retries?: number;
      retry_strategy?: string;
      estimated_duration_ms?: number;
      requires_confirmation?: boolean;
      depends_on?: string | null;
      execution_group_id?: string;
      origin_schema_version?: string;
      origin_contract_id?: string;
      description?: string;
      expected_outcome?: string;
      success_criteria?: string;
      success_probe?: string;
      probe_kind?: string;
      probe_timeout_ms?: number;
      failure_hint?: string;
      command?: string;
    }>;
  };
  assert.equal(payload.heading_changes_count, 1);
  assert.equal(payload.headingUpdated, true);
  assert.equal(payload.headingChanges?.length, 1);
  assert.equal(payload.headingChanges?.[0]?.id, 'PUMUKI-010');
  assert.equal(payload.headingChanges?.[0]?.from, '⏳');
  assert.equal(payload.headingChanges?.[0]?.to, '✅');
  assert.equal(payload.classification_counts?.issue_changes, 0);
  assert.equal(payload.classification_counts?.reference_changes, 0);
  assert.equal(payload.classification_counts?.heading_changes, 1);
  assert.equal(payload.classification_counts?.summary_closed, 1);
  assert.equal(payload.classification_counts?.summary_in_progress, 0);
  assert.equal(payload.classification_counts?.summary_pending, 0);
  assert.equal(payload.classification_counts?.summary_blocked, 0);
  assert.deepEqual(payload.action_required_reasons, ['heading_changes']);
  assert.match(payload.next_command ?? '', /--file='/);
  assert.match(payload.next_command ?? '', /--json &&/);
  assert.match(payload.next_command ?? '', /--apply$/);
  assert.equal(payload.next_command_reason, 'heading_changes');
  assert.equal(payload.next_commands?.length, 2);
  assert.equal(payload.next_commands?.[0]?.execution_group_id, payload.run_id);
  assert.equal(payload.next_commands?.[0]?.origin_schema_version, payload.schema_version);
  assert.equal(payload.next_commands?.[0]?.origin_contract_id, payload.compat?.contract_id);
  assert.equal(payload.next_commands?.[0]?.id, 1);
  assert.equal(payload.next_commands?.[0]?.origin_tool, 'backlog-reconcile');
  assert.equal(payload.next_commands?.[0]?.label, 'dry_run');
  assert.equal(payload.next_commands?.[0]?.recommendation_type, 'reconcile_loop');
  assert.equal(payload.next_commands?.[0]?.priority, 'high');
  assert.equal(payload.next_commands?.[0]?.mode, 'dry-run');
  assert.equal(payload.next_commands?.[0]?.safety, 'read_only');
  assert.equal(payload.next_commands?.[0]?.idempotent, true);
  assert.equal(payload.next_commands?.[0]?.max_retries, 2);
  assert.equal(payload.next_commands?.[0]?.retry_strategy, 'immediate');
  assert.equal(payload.next_commands?.[0]?.estimated_duration_ms, 3000);
  assert.equal(payload.next_commands?.[0]?.requires_confirmation, false);
  assert.equal(payload.next_commands?.[0]?.depends_on, null);
  assert.match(payload.next_commands?.[0]?.description ?? '', /without mutating files/);
  assert.match(payload.next_commands?.[0]?.expected_outcome ?? '', /without file mutations/);
  assert.equal(payload.next_commands?.[0]?.success_criteria, 'plan_generated_no_mutation');
  assert.match(payload.next_commands?.[0]?.success_probe ?? '', /includes dry_run\/apply next_commands/);
  assert.equal(payload.next_commands?.[0]?.probe_kind, 'json_contract');
  assert.equal(payload.next_commands?.[0]?.probe_timeout_ms, 1500);
  assert.match(payload.next_commands?.[0]?.failure_hint ?? '', /Re-run dry_run/);
  assert.match(payload.next_commands?.[0]?.command ?? '', /--json$/);
  assert.equal(payload.next_commands?.[1]?.execution_group_id, payload.run_id);
  assert.equal(payload.next_commands?.[1]?.origin_schema_version, payload.schema_version);
  assert.equal(payload.next_commands?.[1]?.origin_contract_id, payload.compat?.contract_id);
  assert.equal(payload.next_commands?.[1]?.id, 2);
  assert.equal(payload.next_commands?.[1]?.origin_tool, 'backlog-reconcile');
  assert.equal(payload.next_commands?.[1]?.label, 'apply');
  assert.equal(payload.next_commands?.[1]?.recommendation_type, 'reconcile_loop');
  assert.equal(payload.next_commands?.[1]?.priority, 'medium');
  assert.equal(payload.next_commands?.[1]?.mode, 'apply');
  assert.equal(payload.next_commands?.[1]?.safety, 'mutating');
  assert.equal(payload.next_commands?.[1]?.idempotent, true);
  assert.equal(payload.next_commands?.[1]?.max_retries, 0);
  assert.equal(payload.next_commands?.[1]?.retry_strategy, 'manual');
  assert.equal(payload.next_commands?.[1]?.estimated_duration_ms, 5000);
  assert.equal(payload.next_commands?.[1]?.requires_confirmation, true);
  assert.equal(payload.next_commands?.[1]?.depends_on, 'dry_run');
  assert.match(payload.next_commands?.[1]?.description ?? '', /Apply reconcile changes/);
  assert.match(payload.next_commands?.[1]?.expected_outcome ?? '', /reconciled and persisted/);
  assert.equal(payload.next_commands?.[1]?.success_criteria, 'backlog_reconciled_persisted');
  assert.match(payload.next_commands?.[1]?.success_probe ?? '', /action_required_reasons are reduced or none/);
  assert.equal(payload.next_commands?.[1]?.probe_kind, 'state_recheck');
  assert.equal(payload.next_commands?.[1]?.probe_timeout_ms, 4000);
  assert.match(payload.next_commands?.[1]?.failure_hint ?? '', /Run dry_run first/);
  assert.match(payload.next_commands?.[1]?.command ?? '', /--apply$/);
});

test('reconcile-consumer-backlog-issues salida humana incluye resumen de heading changes', () => {
  const scriptPath = resolveScriptPath('../reconcile-consumer-backlog-issues.ts');
  const backlogFile = createBacklogFile(
    `| ID | Estado | Referencia upstream |\n|---|---|---|\n| PUMUKI-011 | ✅ | Pendiente |\n\n### ⏳ PUMUKI-011\nDetalle.\n`
  );
  const result = runTsxScript(scriptPath, ['--file=' + backlogFile]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /heading_changes=1/);
  assert.match(result.stdout, /\[pumuki\]\[backlog-reconcile\] heading_changes:/);
  assert.match(result.stdout, /PUMUKI-011: ⏳ -> ✅/);
  assert.match(result.stdout, /action_required_reasons=heading_changes/);
  assert.match(result.stdout, /hint=run with --json first \(dry-run\), then rerun with --apply to persist changes/);
});

test('watch-consumer-backlog salida humana imprime action_required_reasons=none cuando está limpio', () => {
  const scriptPath = resolveScriptPath('../watch-consumer-backlog.ts');
  const backlogFile = createBacklogFile(
    `| ID | Estado | Referencia upstream |\n|---|---|---|\n| PUMUKI-200 | ✅ | #900 |\n`
  );
  const result = runTsxScript(scriptPath, ['--file=' + backlogFile, '--no-fail']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /action_required_reasons=none/);
  assert.match(result.stdout, /action_required=no/);
  assert.doesNotMatch(result.stdout, /hint=use --no-fail to inspect findings without exit code 1/);
});

test('reconcile-consumer-backlog-issues salida humana imprime action_required_reasons=none cuando no hay deltas', () => {
  const scriptPath = resolveScriptPath('../reconcile-consumer-backlog-issues.ts');
  const backlogFile = createBacklogFile(
    `| ID | Estado | Referencia upstream |\n|---|---|---|\n| PUMUKI-201 | ✅ | Pendiente |\n`
  );
  const result = runTsxScript(scriptPath, ['--file=' + backlogFile]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /action_required_reasons=none/);
  assert.doesNotMatch(result.stdout, /hint=run with --json first \(dry-run\), then rerun with --apply to persist changes/);
});
