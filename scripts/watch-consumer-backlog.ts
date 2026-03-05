import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runBacklogWatch, type BacklogWatchIdIssueMap } from './watch-consumer-backlog-lib';

type ParsedArgs = {
  filePath: string;
  repo?: string;
  idIssueMapPath?: string;
  json: boolean;
  failOnFindings: boolean;
};

const HELP_TEXT = `Usage:
  npx --yes tsx@4.21.0 scripts/watch-consumer-backlog.ts --file=<markdown-path> [--repo=<owner/name>] [--id-issue-map=<json-path>] [--json] [--no-fail]

Options:
  --file=<path>       Ruta del backlog markdown consumidor a vigilar.
  --repo=<owner/name> Repositorio GitHub a consultar con gh CLI (default: repo remoto actual).
  --id-issue-map=<path> JSON con mapeo {"ID":"issueNumber"} para enlazar filas sin #issue.
  --json              Imprime resultado en JSON.
  --no-fail           No devuelve exit code 1 aunque existan findings accionables.`;

const parseArgs = (argv: ReadonlyArray<string>): ParsedArgs => {
  let filePath: string | undefined;
  let repo: string | undefined;
  let idIssueMapPath: string | undefined;
  let json = false;
  let failOnFindings = true;

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      throw new Error(HELP_TEXT);
    }
    if (arg === '--json') {
      json = true;
      continue;
    }
    if (arg === '--no-fail') {
      failOnFindings = false;
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
    throw new Error(`Unknown argument "${arg}"\n\n${HELP_TEXT}`);
  }

  if (!filePath) {
    throw new Error(`Missing --file\n\n${HELP_TEXT}`);
  }

  return {
    filePath: resolve(filePath),
    repo: repo && repo.length > 0 ? repo : undefined,
    idIssueMapPath: idIssueMapPath && idIssueMapPath.length > 0 ? resolve(idIssueMapPath) : undefined,
    json,
    failOnFindings,
  };
};

const parseIdIssueMapFile = (filePath: string): BacklogWatchIdIssueMap => {
  const raw = JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>;
  const normalized: Record<string, number> = {};
  for (const [id, value] of Object.entries(raw)) {
    const parsed =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number.parseInt(value, 10)
          : Number.NaN;
    if (!Number.isFinite(parsed)) {
      continue;
    }
    normalized[id] = Math.trunc(parsed);
  }
  return normalized;
};

const formatHumanOutput = (result: Awaited<ReturnType<typeof runBacklogWatch>>): string => {
  const lines: string[] = [];
  lines.push(`[pumuki][backlog-watch] file=${result.filePath}`);
  lines.push(
    `[pumuki][backlog-watch] entries=${result.entriesScanned} non_closed=${result.nonClosedEntries} issue_states_resolved=${result.issueStatesResolved}`
  );
  lines.push(
    `[pumuki][backlog-watch] needs_issue=${result.classification.needsIssue.length} drift_closed=${result.classification.driftClosedIssue.length} active_issue=${result.classification.activeIssue.length}`
  );
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
  lines.push(`[pumuki][backlog-watch] action_required=${result.hasActionRequired ? 'yes' : 'no'}`);
  return `${lines.join('\n')}\n`;
};

const main = async (): Promise<void> => {
  const parsed = parseArgs(process.argv.slice(2));
  const result = await runBacklogWatch({
    filePath: parsed.filePath,
    repo: parsed.repo,
    idIssueMap: parsed.idIssueMapPath ? parseIdIssueMapFile(parsed.idIssueMapPath) : undefined,
  });

  if (parsed.json) {
    writeFileSync(process.stdout.fd, `${JSON.stringify(result, null, 2)}\n`);
  } else {
    writeFileSync(process.stdout.fd, formatHumanOutput(result));
  }

  if (parsed.failOnFindings && result.hasActionRequired) {
    process.exitCode = 1;
  }
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  writeFileSync(process.stderr.fd, `${message}\n`);
  process.exitCode = 1;
});
