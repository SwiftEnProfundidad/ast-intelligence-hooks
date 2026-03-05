import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runBacklogIssuesReconcile } from './reconcile-consumer-backlog-issues-lib';

type ParsedArgs = {
  filePath: string;
  repo?: string;
  apply: boolean;
  json: boolean;
};

const HELP_TEXT = `Usage:
  npx --yes tsx@4.21.0 scripts/reconcile-consumer-backlog-issues.ts --file=<markdown-path> [--repo=<owner/name>] [--apply] [--json]

Options:
  --file=<path>       Ruta del backlog markdown consumidor a reconciliar.
  --repo=<owner/name> Repositorio GitHub a consultar con gh CLI (default: repo remoto actual).
  --apply             Aplica cambios sobre el markdown (sin este flag es dry-run).
  --json              Imprime resultado en JSON.`;

const parseArgs = (argv: ReadonlyArray<string>): ParsedArgs => {
  let filePath: string | undefined;
  let repo: string | undefined;
  let apply = false;
  let json = false;

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      throw new Error(HELP_TEXT);
    }
    if (arg === '--apply') {
      apply = true;
      continue;
    }
    if (arg === '--json') {
      json = true;
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
    throw new Error(`Unknown argument "${arg}"\n\n${HELP_TEXT}`);
  }

  if (!filePath) {
    throw new Error(`Missing --file\n\n${HELP_TEXT}`);
  }

  return {
    filePath: resolve(filePath),
    repo: repo && repo.length > 0 ? repo : undefined,
    apply,
    json,
  };
};

const formatHumanOutput = (result: Awaited<ReturnType<typeof runBacklogIssuesReconcile>>): string => {
  const lines: string[] = [];
  lines.push(`[pumuki][backlog-reconcile] file=${result.filePath}`);
  lines.push(`[pumuki][backlog-reconcile] entries_scanned=${result.entriesScanned} issues_resolved=${result.issuesResolved}`);
  lines.push(
    `[pumuki][backlog-reconcile] changes=${result.changes.length} mode=${result.apply ? 'apply' : 'dry-run'}`
  );
  if (result.changes.length > 0) {
    lines.push('[pumuki][backlog-reconcile] planned_changes:');
    for (const change of result.changes) {
      lines.push(
        `- line ${change.lineNumber} issue #${change.issueNumber}: ${change.from} -> ${change.to} (state=${change.issueState})`
      );
    }
  }
  return `${lines.join('\n')}\n`;
};

const main = async (): Promise<void> => {
  const parsed = parseArgs(process.argv.slice(2));
  const result = await runBacklogIssuesReconcile({
    filePath: parsed.filePath,
    repo: parsed.repo,
    apply: parsed.apply,
  });

  if (parsed.json) {
    writeFileSync(process.stdout.fd, `${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  writeFileSync(process.stdout.fd, formatHumanOutput(result));
};

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  writeFileSync(process.stderr.fd, `${message}\n`);
  process.exitCode = 1;
});
