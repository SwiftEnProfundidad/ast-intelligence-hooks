import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildWatchActionRequiredReasons,
  formatActionReasonsForHuman,
} from './backlog-action-reasons-lib';
import {
  mergeIdIssueMapRecords,
  parseIdIssueMapRecordFile,
} from './backlog-id-issue-map-lib';
import {
  BACKLOG_JSON_COMPAT_CONTRACT_ID,
  BACKLOG_JSON_COMPAT_MIN_READER_VERSION,
  BACKLOG_JSON_SCHEMA_VERSION,
} from './backlog-json-contract-lib';
import {
  collectBacklogIdIssueMap,
  resolveIssueNumberByIdWithGh,
  runBacklogWatch,
} from './watch-consumer-backlog-lib';

type ParsedArgs = {
  filePath: string;
  repo?: string;
  idIssueMapPath?: string;
  idIssueMapSourcePath?: string;
  resolveMissingViaGh: boolean;
  json: boolean;
  failOnFindings: boolean;
};

const JSON_TOOL_NAME = 'backlog-watch';

const shellQuote = (value: string): string => `'${value.replace(/'/g, `'\\''`)}'`;

const HELP_TEXT = `Usage:
  npx --yes tsx@4.21.0 scripts/watch-consumer-backlog.ts --file=<markdown-path> [--repo=<owner/name>] [--id-issue-map=<json-path>] [--id-issue-map-from=<md-path>] [--resolve-missing-via-gh] [--json] [--no-fail]

Options:
  --file=<path>       Ruta del backlog markdown consumidor a vigilar.
  --repo=<owner/name> Repositorio GitHub a consultar con gh CLI (default: repo remoto actual).
  --id-issue-map=<path> JSON con mapeo {"ID":"issueNumber"} para enlazar filas sin #issue.
  --id-issue-map-from=<path> Markdown canónico desde el que extraer mapeo ID->issue automáticamente.
  --resolve-missing-via-gh Enriquecer IDs sin issue buscando en GitHub por token (title/body).
  --json              Imprime resultado en JSON.
  --no-fail           No devuelve exit code 1 aunque existan findings accionables.`;

class HelpRequestedError extends Error {
  constructor() {
    super(HELP_TEXT);
    this.name = 'HelpRequestedError';
  }
}

const parseArgs = (argv: ReadonlyArray<string>): ParsedArgs => {
  let filePath: string | undefined;
  let repo: string | undefined;
  let idIssueMapPath: string | undefined;
  let idIssueMapSourcePath: string | undefined;
  let resolveMissingViaGh = false;
  let json = false;
  let failOnFindings = true;

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      throw new HelpRequestedError();
    }
    if (arg === '--json') {
      json = true;
      continue;
    }
    if (arg === '--no-fail') {
      failOnFindings = false;
      continue;
    }
    if (arg === '--resolve-missing-via-gh') {
      resolveMissingViaGh = true;
      continue;
    }
    if (arg.startsWith('--file=')) {
      filePath = arg.slice('--file='.length).trim();
      continue;
    }
    if (arg.startsWith('--repo=')) {
      repo = arg.slice('--repo='.length).trim();
      continue;
    }
    if (arg.startsWith('--id-issue-map=')) {
      idIssueMapPath = arg.slice('--id-issue-map='.length).trim();
      continue;
    }
    if (arg.startsWith('--id-issue-map-from=')) {
      idIssueMapSourcePath = arg.slice('--id-issue-map-from='.length).trim();
      continue;
    }
    throw new Error(`Unknown argument "${arg}"\n\n${HELP_TEXT}`);
  }

  if (!filePath) {
    throw new Error(`Missing --file\n\n${HELP_TEXT}`);
  }

  return {
    filePath: resolve(filePath),
    repo: repo && repo.length > 0 ? repo : undefined,
    idIssueMapPath: idIssueMapPath && idIssueMapPath.length > 0 ? resolve(idIssueMapPath) : undefined,
    idIssueMapSourcePath:
      idIssueMapSourcePath && idIssueMapSourcePath.length > 0
        ? resolve(idIssueMapSourcePath)
        : undefined,
    resolveMissingViaGh,
    json,
    failOnFindings,
  };
};

const formatHumanOutput = (result: Awaited<ReturnType<typeof runBacklogWatch>>): string => {
  const lines: string[] = [];
  const actionRequiredReasons = buildWatchActionRequiredReasons({
    needsIssueCount: result.classification.needsIssue.length,
    driftClosedIssueCount: result.classification.driftClosedIssue.length,
    headingDriftCount: result.headingDrift.length,
  });
  lines.push(`[pumuki][backlog-watch] file=${result.filePath}`);
  lines.push(
    `[pumuki][backlog-watch] entries=${result.entriesScanned} non_closed=${result.nonClosedEntries} issue_states_resolved=${result.issueStatesResolved}`
  );
  lines.push(
    `[pumuki][backlog-watch] needs_issue=${result.classification.needsIssue.length} drift_closed=${result.classification.driftClosedIssue.length} active_issue=${result.classification.activeIssue.length}`
  );
  lines.push(`[pumuki][backlog-watch] heading_drift=${result.headingDrift.length}`);
  lines.push(
    `[pumuki][backlog-watch] resolved_by_map=${result.resolution.resolvedByMap.length} resolved_by_gh_lookup=${result.resolution.resolvedByGhLookup.length} unresolved_ids=${result.resolution.unresolvedIds.length}`
  );
  if (result.resolution.resolvedByMap.length > 0) {
    lines.push(`[pumuki][backlog-watch] resolved_by_map_ids=${result.resolution.resolvedByMap.join(',')}`);
  }
  if (result.resolution.resolvedByGhLookup.length > 0) {
    lines.push(
      `[pumuki][backlog-watch] resolved_by_gh_lookup_ids=${result.resolution.resolvedByGhLookup.join(',')}`
    );
  }
  if (result.resolution.unresolvedIds.length > 0) {
    lines.push(`[pumuki][backlog-watch] unresolved_ids_list=${result.resolution.unresolvedIds.join(',')}`);
  }
  if (result.classification.needsIssue.length > 0) {
    lines.push('[pumuki][backlog-watch] needs_issue_entries:');
    for (const entry of result.classification.needsIssue) {
      lines.push(`- line ${entry.lineNumber} ${entry.id} status=${entry.status} upstream=missing`);
    }
  }
  if (result.classification.driftClosedIssue.length > 0) {
    lines.push('[pumuki][backlog-watch] drift_closed_entries:');
    for (const entry of result.classification.driftClosedIssue) {
      lines.push(`- line ${entry.lineNumber} ${entry.id} status=${entry.status} issue=#${entry.issueNumber}`);
    }
  }
  if (result.classification.activeIssue.length > 0) {
    lines.push('[pumuki][backlog-watch] active_issue_entries:');
    for (const entry of result.classification.activeIssue) {
      lines.push(`- line ${entry.lineNumber} ${entry.id} status=${entry.status} issue=#${entry.issueNumber}`);
    }
  }
  if (result.headingDrift.length > 0) {
    lines.push('[pumuki][backlog-watch] heading_drift_entries:');
    for (const drift of result.headingDrift) {
      lines.push(
        `- line ${drift.lineNumber} ${drift.id}: heading=${drift.headingStatus} effective=${drift.effectiveStatus}`
      );
    }
  }
  lines.push(
    `[pumuki][backlog-watch] action_required_reasons=${formatActionReasonsForHuman(actionRequiredReasons)}`
  );
  if (result.hasActionRequired) {
    lines.push('[pumuki][backlog-watch] hint=use --no-fail to inspect findings without exit code 1');
  }
  lines.push(`[pumuki][backlog-watch] action_required=${result.hasActionRequired ? 'yes' : 'no'}`);
  return `${lines.join('\n')}\n`;
};

const main = async (): Promise<void> => {
  const parsed = parseArgs(process.argv.slice(2));
  const fileMap = parsed.idIssueMapPath ? parseIdIssueMapRecordFile(parsed.idIssueMapPath) : undefined;
  const markdownMap = parsed.idIssueMapSourcePath
    ? collectBacklogIdIssueMap(readFileSync(parsed.idIssueMapSourcePath, 'utf8'))
    : undefined;
  const idIssueMap = mergeIdIssueMapRecords(markdownMap, fileMap);

  const result = await runBacklogWatch({
    filePath: parsed.filePath,
    repo: parsed.repo,
    idIssueMap,
    resolveIssueNumberById: parsed.resolveMissingViaGh ? resolveIssueNumberByIdWithGh : undefined,
  });
  const actionRequiredReasons = buildWatchActionRequiredReasons({
    needsIssueCount: result.classification.needsIssue.length,
    driftClosedIssueCount: result.classification.driftClosedIssue.length,
    headingDriftCount: result.headingDrift.length,
  });
  const dryRunCommand = `npx --yes tsx@4.21.0 scripts/reconcile-consumer-backlog-issues.ts --file=${shellQuote(
    parsed.filePath
  )} --json`;
  const applyCommand = `npx --yes tsx@4.21.0 scripts/reconcile-consumer-backlog-issues.ts --file=${shellQuote(
    parsed.filePath
  )} --apply`;
  const nextCommands = result.hasActionRequired
    ? [
        {
          id: 1,
          origin_tool: JSON_TOOL_NAME,
          label: 'dry_run',
          mode: 'dry-run',
          safety: 'read_only',
          idempotent: true,
          estimated_duration_ms: 3000,
          requires_confirmation: false,
          depends_on: null,
          description: 'Inspect planned reconcile changes without mutating files.',
          command: dryRunCommand,
        },
        {
          id: 2,
          origin_tool: JSON_TOOL_NAME,
          label: 'apply',
          mode: 'apply',
          safety: 'mutating',
          idempotent: true,
          estimated_duration_ms: 5000,
          requires_confirmation: true,
          depends_on: 'dry_run',
          description: 'Apply reconcile changes to the backlog markdown file.',
          command: applyCommand,
        },
      ]
    : undefined;
  const nextCommand = nextCommands ? `${dryRunCommand} && ${applyCommand}` : undefined;
  const nextCommandReason = nextCommand ? actionRequiredReasons[0] : undefined;

  if (parsed.json) {
    const generatedAt = new Date().toISOString();
    const runId = randomUUID();
    const nextCommandsWithExecutionGroup = nextCommands?.map((step) => ({
      ...step,
      execution_group_id: runId,
    }));
    writeFileSync(
      process.stdout.fd,
      `${JSON.stringify(
        {
          tool: JSON_TOOL_NAME,
          schema_version: BACKLOG_JSON_SCHEMA_VERSION,
          generated_at: generatedAt,
          run_id: runId,
          invocation: {
            mode: 'json',
            repo: parsed.repo ?? null,
            resolve_missing_via_gh: parsed.resolveMissingViaGh,
            id_issue_map: parsed.idIssueMapPath ? 'provided' : 'none',
            id_issue_map_from: parsed.idIssueMapSourcePath ? 'provided' : 'none',
          },
          compat: {
            contract_id: BACKLOG_JSON_COMPAT_CONTRACT_ID,
            min_reader_version: BACKLOG_JSON_COMPAT_MIN_READER_VERSION,
            is_backward_compatible: true,
            breaking_changes: [],
          },
          classification_counts: {
            needs_issue: result.classification.needsIssue.length,
            drift_closed_issue: result.classification.driftClosedIssue.length,
            active_issue: result.classification.activeIssue.length,
            heading_drift: result.headingDrift.length,
          },
          action_required_reasons: actionRequiredReasons,
          ...(nextCommand ? { next_command: nextCommand } : {}),
          ...(nextCommandReason ? { next_command_reason: nextCommandReason } : {}),
          ...(nextCommandsWithExecutionGroup ? { next_commands: nextCommandsWithExecutionGroup } : {}),
          heading_drift_count: result.headingDrift.length,
          ...result,
        },
        null,
        2
      )}\n`
    );
  } else {
    writeFileSync(process.stdout.fd, formatHumanOutput(result));
  }

  if (parsed.failOnFindings && result.hasActionRequired) {
    process.exitCode = 1;
  }
};

main().catch((error: unknown) => {
  if (error instanceof HelpRequestedError) {
    writeFileSync(process.stdout.fd, `${HELP_TEXT}\n`);
    process.exitCode = 0;
    return;
  }
  const message = error instanceof Error ? error.message : String(error);
  writeFileSync(process.stderr.fd, `${message}\n`);
  process.exitCode = 1;
});
