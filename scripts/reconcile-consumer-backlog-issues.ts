import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  mergeIdIssueMapRecords,
  parseIdIssueMapRecordFile,
  recordToIdIssueMap,
  type BacklogIdIssueMapRecord,
} from './backlog-id-issue-map-lib';
import { runBacklogIssuesReconcile } from './reconcile-consumer-backlog-issues-lib';
import { collectBacklogIdIssueMap, resolveIssueNumberByIdWithGh } from './watch-consumer-backlog-lib';

type ParsedArgs = {
  filePath: string;
  repo?: string;
  idIssueMapPath?: string;
  idIssueMapSourcePath?: string;
  idIssueMapRecord?: BacklogIdIssueMapRecord;
  idIssueMapFromSource?: BacklogIdIssueMapRecord;
  resolveMissingViaGh: boolean;
  apply: boolean;
  json: boolean;
};

const HELP_TEXT = `Usage:
  npx --yes tsx@4.21.0 scripts/reconcile-consumer-backlog-issues.ts --file=<markdown-path> [--repo=<owner/name>] [--id-issue-map=<json-path>] [--id-issue-map-from=<md-path>] [--resolve-missing-via-gh] [--apply] [--json]

Options:
  --file=<path>       Ruta del backlog markdown consumidor a reconciliar.
  --repo=<owner/name> Repositorio GitHub a consultar con gh CLI (default: repo remoto actual).
  --id-issue-map=<path> JSON con mapping {"PUMUKI-XXX": 123} para filas sin referencia upstream.
  --id-issue-map-from=<path> Markdown canónico para extraer mapping ID->issue automáticamente.
  --resolve-missing-via-gh Resolver IDs sin referencia upstream mediante búsqueda opcional en GitHub.
  --apply             Aplica cambios sobre el markdown (sin este flag es dry-run).
  --json              Imprime resultado en JSON.`;

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
  let idIssueMapRecord: BacklogIdIssueMapRecord | undefined;
  let idIssueMapFromSource: BacklogIdIssueMapRecord | undefined;
  let resolveMissingViaGh = false;
  let apply = false;
  let json = false;

  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') {
      throw new HelpRequestedError();
    }
    if (arg === '--apply') {
      apply = true;
      continue;
    }
    if (arg === '--json') {
      json = true;
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

  if (idIssueMapPath && idIssueMapPath.length > 0) {
    idIssueMapRecord = parseIdIssueMapRecordFile(idIssueMapPath);
  }
  if (idIssueMapSourcePath && idIssueMapSourcePath.length > 0) {
    const sourceMarkdown = readFileSync(resolve(idIssueMapSourcePath), 'utf8');
    idIssueMapFromSource = collectBacklogIdIssueMap(sourceMarkdown);
  }

  return {
    filePath: resolve(filePath),
    repo: repo && repo.length > 0 ? repo : undefined,
    idIssueMapPath: idIssueMapPath && idIssueMapPath.length > 0 ? resolve(idIssueMapPath) : undefined,
    idIssueMapSourcePath:
      idIssueMapSourcePath && idIssueMapSourcePath.length > 0
        ? resolve(idIssueMapSourcePath)
        : undefined,
    idIssueMapRecord,
    idIssueMapFromSource,
    resolveMissingViaGh,
    apply,
    json,
  };
};

const formatHumanOutput = (result: Awaited<ReturnType<typeof runBacklogIssuesReconcile>>): string => {
  const lines: string[] = [];
  lines.push(`[pumuki][backlog-reconcile] file=${result.filePath}`);
  lines.push(`[pumuki][backlog-reconcile] entries_scanned=${result.entriesScanned} issues_resolved=${result.issuesResolved}`);
  lines.push(
    `[pumuki][backlog-reconcile] mapping_source=${result.mappingSource} resolved_by_map=${result.referenceResolution.resolvedByProvidedMap.length} resolved_by_lookup=${result.referenceResolution.resolvedByLookup.length} unresolved_refs=${result.referenceResolution.unresolvedReferenceIds.length}`
  );
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
  if (result.referenceChanges.length > 0) {
    lines.push('[pumuki][backlog-reconcile] mapped_references:');
    for (const change of result.referenceChanges) {
      lines.push(`- line ${change.lineNumber} ${change.id}: ${change.from} -> ${change.to}`);
    }
  }
  if (result.referenceResolution.resolvedByProvidedMap.length > 0) {
    lines.push(
      `[pumuki][backlog-reconcile] resolved_by_map_ids=${result.referenceResolution.resolvedByProvidedMap.join(',')}`
    );
  }
  if (result.referenceResolution.resolvedByLookup.length > 0) {
    lines.push(
      `[pumuki][backlog-reconcile] resolved_by_lookup_ids=${result.referenceResolution.resolvedByLookup.join(',')}`
    );
  }
  if (result.referenceResolution.unresolvedReferenceIds.length > 0) {
    lines.push(
      `[pumuki][backlog-reconcile] unresolved_reference_ids=${result.referenceResolution.unresolvedReferenceIds.join(',')}`
    );
  }
  lines.push(`[pumuki][backlog-reconcile] next_step_updated=${result.nextStepUpdated ? 'yes' : 'no'}`);
  lines.push(
    `[pumuki][backlog-reconcile] summary closed=${result.summary.closed} in_progress=${result.summary.inProgress} pending=${result.summary.pending} blocked=${result.summary.blocked}`
  );
  return `${lines.join('\n')}\n`;
};

const main = async (): Promise<void> => {
  const parsed = parseArgs(process.argv.slice(2));
  const mergedIdIssueRecord = mergeIdIssueMapRecords(parsed.idIssueMapFromSource, parsed.idIssueMapRecord);
  const mergedIdIssueMap = recordToIdIssueMap(mergedIdIssueRecord);
  const hasMarkdownMap = Boolean(parsed.idIssueMapFromSource && Object.keys(parsed.idIssueMapFromSource).length > 0);
  const hasJsonMap = Boolean(parsed.idIssueMapRecord && Object.keys(parsed.idIssueMapRecord).length > 0);
  const mappingSource = hasMarkdownMap && hasJsonMap ? 'merged' : hasJsonMap ? 'json' : hasMarkdownMap ? 'markdown' : 'none';
  const result = await runBacklogIssuesReconcile({
    filePath: parsed.filePath,
    repo: parsed.repo,
    mappingSource,
    idIssueMap: mergedIdIssueMap,
    resolveIssueNumberById: parsed.resolveMissingViaGh ? resolveIssueNumberByIdWithGh : undefined,
    apply: parsed.apply,
  });

  if (parsed.json) {
    writeFileSync(process.stdout.fd, `${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  writeFileSync(process.stdout.fd, formatHumanOutput(result));
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
