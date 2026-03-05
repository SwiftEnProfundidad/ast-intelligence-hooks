import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type BacklogIssueState = 'OPEN' | 'CLOSED';
export type BacklogStatusEmoji = '✅' | '🚧' | '⏳' | '⛔';

export type BacklogIssueEntry = {
  issueNumber: number;
  lineNumber: number;
  currentEmoji: BacklogStatusEmoji;
  line: string;
};

export type BacklogIssueChange = {
  issueNumber: number;
  lineNumber: number;
  from: BacklogStatusEmoji;
  to: BacklogStatusEmoji;
  issueState: BacklogIssueState;
  line: string;
};

export type BacklogIssueReferenceChange = {
  id: string;
  issueNumber: number;
  lineNumber: number;
  from: string;
  to: string;
  line: string;
};

export type BacklogSectionHeadingChange = {
  id: string;
  lineNumber: number;
  from: BacklogStatusEmoji;
  to: BacklogStatusEmoji;
  line: string;
};

export type BacklogStatusSummary = {
  closed: number;
  inProgress: number;
  pending: number;
  blocked: number;
  inProgressIds: ReadonlyArray<string>;
  blockedIds: ReadonlyArray<string>;
};

export type BacklogMappingSource = 'none' | 'json' | 'markdown' | 'merged';

export type BacklogReferenceResolution = {
  resolvedByProvidedMap: ReadonlyArray<string>;
  resolvedByLookup: ReadonlyArray<string>;
  unresolvedReferenceIds: ReadonlyArray<string>;
};

export type BacklogReconcileResult = {
  filePath: string;
  repo?: string;
  apply: boolean;
  mappingSource: BacklogMappingSource;
  entriesScanned: number;
  issuesResolved: number;
  referenceChanges: ReadonlyArray<BacklogIssueReferenceChange>;
  referenceResolution: BacklogReferenceResolution;
  changes: ReadonlyArray<BacklogIssueChange>;
  summaryUpdated: boolean;
  nextStepUpdated: boolean;
  headingUpdated: boolean;
  summary: BacklogStatusSummary;
  updated: boolean;
  headingChanges: ReadonlyArray<BacklogSectionHeadingChange>;
};

const STATUS_EMOJI_PATTERN = /(✅|🚧|⏳|⛔)/;
const ISSUE_REF_PATTERN = /#(\d+)/;
const BACKLOG_ID_PATTERN = /^(PUMUKI-(?:M)?\d+|PUMUKI-INC-\d+|FP-\d+|AST-GAP-\d+)$/;
const PENDING_REFERENCE_PATTERN = /\|\s*Pendiente(?:\s*\(rel\.\s*#\d+\))?\s*\|/;
const BACKLOG_SECTION_HEADING_PATTERN =
  /^(\s*###\s*)(✅|🚧|⏳|⛔)(\s+)(PUMUKI-(?:M)?\d+|PUMUKI-INC-\d+|FP-\d+|AST-GAP-\d+)\b/;

export type BacklogIssueNumberResolver = (
  backlogId: string,
  repo?: string
) => number | null | Promise<number | null>;

const parseIssueNumber = (line: string): number | null => {
  const match = ISSUE_REF_PATTERN.exec(line);
  if (!match?.[1]) {
    return null;
  }
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
};

export const collectBacklogIssueEntries = (markdown: string): ReadonlyArray<BacklogIssueEntry> => {
  const lines = markdown.split(/\r?\n/);
  const entries: BacklogIssueEntry[] = [];

  lines.forEach((line, index) => {
    if (!line.includes('|')) {
      return;
    }
    const emojiMatch = STATUS_EMOJI_PATTERN.exec(line);
    if (!emojiMatch?.[1]) {
      return;
    }
    const issueNumber = parseIssueNumber(line);
    if (issueNumber === null) {
      return;
    }
    entries.push({
      issueNumber,
      lineNumber: index + 1,
      currentEmoji: emojiMatch[1] as BacklogStatusEmoji,
      line,
    });
  });

  return entries;
};

const parseBacklogId = (line: string): string | null => {
  const cells = line.split('|').map((cell) => cell.trim());
  const id = cells.find((cell) => BACKLOG_ID_PATTERN.test(cell));
  return id ?? null;
};

export const collectBacklogOperationalStatusEntries = (
  markdown: string
): ReadonlyArray<{ id: string; status: BacklogStatusEmoji }> => {
  const lines = markdown.split(/\r?\n/);
  const entries: Array<{ id: string; status: BacklogStatusEmoji }> = [];
  for (const line of lines) {
    if (!line.trimStart().startsWith('|')) {
      continue;
    }
    const cells = line.split('|').map((cell) => cell.trim());
    const id = cells.find((cell) => BACKLOG_ID_PATTERN.test(cell));
    const status = cells.find((cell) => STATUS_EMOJI_PATTERN.test(cell));
    if (!id || !status) {
      continue;
    }
    entries.push({
      id,
      status: status as BacklogStatusEmoji,
    });
  }
  return entries;
};

export const buildBacklogStatusSummary = (markdown: string): BacklogStatusSummary => {
  const entries = collectBacklogOperationalStatusEntries(markdown);
  const closedIds = entries.filter((entry) => entry.status === '✅').map((entry) => entry.id);
  const inProgressIds = entries.filter((entry) => entry.status === '🚧').map((entry) => entry.id);
  const pendingIds = entries.filter((entry) => entry.status === '⏳').map((entry) => entry.id);
  const blockedIds = entries.filter((entry) => entry.status === '⛔').map((entry) => entry.id);
  return {
    closed: closedIds.length,
    inProgress: inProgressIds.length,
    pending: pendingIds.length,
    blocked: blockedIds.length,
    inProgressIds: inProgressIds.sort(),
    blockedIds: blockedIds.sort(),
  };
};

export const applyBacklogIssueReferenceMapping = (params: {
  markdown: string;
  idIssueMap?: ReadonlyMap<string, number>;
}): {
  updatedMarkdown: string;
  changes: ReadonlyArray<BacklogIssueReferenceChange>;
} => {
  if (!params.idIssueMap || params.idIssueMap.size === 0) {
    return {
      updatedMarkdown: params.markdown,
      changes: [],
    };
  }

  const lines = params.markdown.split(/\r?\n/);
  const changes: BacklogIssueReferenceChange[] = [];

  lines.forEach((line, index) => {
    if (!line.includes('|')) {
      return;
    }
    if (parseIssueNumber(line) !== null) {
      return;
    }
    const id = parseBacklogId(line);
    if (!id) {
      return;
    }
    const issueNumber = params.idIssueMap?.get(id);
    if (!issueNumber) {
      return;
    }
    if (!PENDING_REFERENCE_PATTERN.test(line)) {
      return;
    }
    const next = line.replace(PENDING_REFERENCE_PATTERN, `| #${issueNumber} |`);
    if (next === line) {
      return;
    }
    lines[index] = next;
    changes.push({
      id,
      issueNumber,
      lineNumber: index + 1,
      from: 'Pendiente',
      to: `#${issueNumber}`,
      line,
    });
  });

  return {
    updatedMarkdown: lines.join('\n'),
    changes,
  };
};

const parseResolvedIssueNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
};

const collectPendingReferenceIds = (markdown: string): ReadonlyArray<string> => {
  const lines = markdown.split(/\r?\n/);
  const ids = new Set<string>();
  for (const line of lines) {
    if (!line.includes('|')) {
      continue;
    }
    if (parseIssueNumber(line) !== null) {
      continue;
    }
    if (!PENDING_REFERENCE_PATTERN.test(line)) {
      continue;
    }
    const id = parseBacklogId(line);
    if (!id) {
      continue;
    }
    ids.add(id);
  }
  return Array.from(ids).sort();
};

const formatSummaryLine = (params: {
  emoji: BacklogStatusEmoji;
  label: string;
  count: number;
  ids?: ReadonlyArray<string>;
}): string => {
  const ids = params.ids ?? [];
  if (ids.length === 0) {
    return `- ${params.emoji} ${params.label}: ${params.count}`;
  }
  return `- ${params.emoji} ${params.label}: ${params.count} (${ids.map((id) => `\`${id}\``).join(', ')})`;
};

export const syncBacklogStatusSummary = (
  markdown: string
): { markdown: string; updated: boolean; summary: BacklogStatusSummary } => {
  const lines = markdown.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => line.trim() === '## Estado de este backlog');
  const summary = buildBacklogStatusSummary(markdown);
  if (headerIndex < 0) {
    return {
      markdown,
      updated: false,
      summary,
    };
  }

  const start = headerIndex + 1;
  let end = start;
  while (end < lines.length && /^- (✅|🚧|⏳|⛔) /.test(lines[end].trim())) {
    end += 1;
  }

  const nextLines = [
    formatSummaryLine({
      emoji: '✅',
      label: 'Cerrados',
      count: summary.closed,
    }),
    formatSummaryLine({
      emoji: '🚧',
      label: 'En construcción',
      count: summary.inProgress,
      ids: summary.inProgressIds,
    }),
    formatSummaryLine({
      emoji: '⏳',
      label: 'Pendientes',
      count: summary.pending,
    }),
    formatSummaryLine({
      emoji: '⛔',
      label: 'Bloqueados',
      count: summary.blocked,
      ids: summary.blockedIds,
    }),
  ];

  const current = lines.slice(start, end);
  const changed = current.join('\n') !== nextLines.join('\n');
  if (!changed) {
    return {
      markdown,
      updated: false,
      summary,
    };
  }

  const updatedLines = [...lines.slice(0, start), ...nextLines, ...lines.slice(end)];
  return {
    markdown: updatedLines.join('\n'),
    updated: true,
    summary,
  };
};

export const syncBacklogSectionHeadingStatus = (
  markdown: string
): {
  markdown: string;
  updated: boolean;
  changes: ReadonlyArray<BacklogSectionHeadingChange>;
} => {
  const lines = markdown.split(/\r?\n/);
  const statusEntries = collectBacklogOperationalStatusEntries(markdown);
  const idToStatus = new Map<string, BacklogStatusEmoji>();
  for (const entry of statusEntries) {
    if (!idToStatus.has(entry.id)) {
      idToStatus.set(entry.id, entry.status);
    }
  }

  const changes: BacklogSectionHeadingChange[] = [];
  lines.forEach((line, index) => {
    const match = BACKLOG_SECTION_HEADING_PATTERN.exec(line);
    if (!match?.[2] || !match[4]) {
      return;
    }
    const currentEmoji = match[2] as BacklogStatusEmoji;
    const id = match[4];
    const targetEmoji = idToStatus.get(id);
    if (!targetEmoji || targetEmoji === currentEmoji) {
      return;
    }
    const next = line.replace(BACKLOG_SECTION_HEADING_PATTERN, `$1${targetEmoji}$3$4`);
    if (next === line) {
      return;
    }
    lines[index] = next;
    changes.push({
      id,
      lineNumber: index + 1,
      from: currentEmoji,
      to: targetEmoji,
      line,
    });
  });

  return {
    markdown: lines.join('\n'),
    updated: changes.length > 0,
    changes,
  };
};

export const syncBacklogNextStepNarrative = (params: {
  markdown: string;
  summary: BacklogStatusSummary;
}): { markdown: string; updated: boolean } => {
  const heading = '## Próximo paso operativo (sin intervención manual en el seguimiento)';
  if (
    params.summary.inProgress !== 0 ||
    params.summary.pending !== 0 ||
    params.summary.blocked !== 0
  ) {
    return {
      markdown: params.markdown,
      updated: false,
    };
  }

  const lines = params.markdown.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => line.trim() === heading);
  if (headerIndex < 0) {
    return {
      markdown: params.markdown,
      updated: false,
    };
  }

  const start = headerIndex + 1;
  let end = start;
  while (end < lines.length && !lines[end].trimStart().startsWith('## ')) {
    end += 1;
  }

  const replacement = [
    '- Objetivo inmediato:',
    '  - Backlog cerrado al 100% (sin tareas activas).',
    '- Entregables de este estado:',
    '  - Mantener monitorización de nuevos hallazgos y abrir issue upstream al primer incidente real.',
    '  - Reejecutar reconciliación automática cuando entren nuevas filas en el backlog consumidor.',
    '- Regla de continuidad:',
    '  - Si entra una incidencia nueva, marcar exactamente una `🚧` y mantener el resto en `⏳` o `✅` según estado real.',
  ];

  const current = lines.slice(start, end);
  const changed = current.join('\n') !== replacement.join('\n');
  if (!changed) {
    return {
      markdown: params.markdown,
      updated: false,
    };
  }

  const updatedLines = [...lines.slice(0, start), ...replacement, ...lines.slice(end)];
  return {
    markdown: updatedLines.join('\n'),
    updated: true,
  };
};

const deriveTargetEmoji = (params: {
  current: BacklogStatusEmoji;
  issueState: BacklogIssueState;
}): BacklogStatusEmoji | null => {
  if (params.issueState === 'CLOSED') {
    return params.current === '✅' ? null : '✅';
  }
  if (params.current === '✅') {
    return '⏳';
  }
  return null;
};

const replaceFirstEmoji = (line: string, emoji: BacklogStatusEmoji): string =>
  line.replace(STATUS_EMOJI_PATTERN, emoji);

const resolveIssueStateWithGh = (issueNumber: number, repo?: string): BacklogIssueState => {
  const args = ['issue', 'view', String(issueNumber), '--json', 'state'];
  if (typeof repo === 'string' && repo.trim().length > 0) {
    args.push('--repo', repo.trim());
  }
  const stdout = execFileSync('gh', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const parsed = JSON.parse(stdout) as { state?: unknown };
  return parsed.state === 'CLOSED' ? 'CLOSED' : 'OPEN';
};

export const reconcileBacklogMarkdown = (params: {
  markdown: string;
  issueStates: ReadonlyMap<number, BacklogIssueState>;
}): {
  updatedMarkdown: string;
  changes: ReadonlyArray<BacklogIssueChange>;
  summaryUpdated: boolean;
  nextStepUpdated: boolean;
  headingUpdated: boolean;
  summary: BacklogStatusSummary;
  headingChanges: ReadonlyArray<BacklogSectionHeadingChange>;
} => {
  const entries = collectBacklogIssueEntries(params.markdown);
  const byLine = new Map<number, BacklogIssueChange>();

  for (const entry of entries) {
    const issueState = params.issueStates.get(entry.issueNumber);
    if (!issueState) {
      continue;
    }
    const targetEmoji = deriveTargetEmoji({
      current: entry.currentEmoji,
      issueState,
    });
    if (!targetEmoji || targetEmoji === entry.currentEmoji) {
      continue;
    }
    byLine.set(entry.lineNumber, {
      issueNumber: entry.issueNumber,
      lineNumber: entry.lineNumber,
      from: entry.currentEmoji,
      to: targetEmoji,
      issueState,
      line: entry.line,
    });
  }

  if (byLine.size === 0) {
    const syncedOnlySummary = syncBacklogStatusSummary(params.markdown);
    const syncedNarrative = syncBacklogNextStepNarrative({
      markdown: syncedOnlySummary.markdown,
      summary: syncedOnlySummary.summary,
    });
    const syncedHeadings = syncBacklogSectionHeadingStatus(syncedNarrative.markdown);
    return {
      updatedMarkdown: syncedHeadings.markdown,
      changes: [],
      summaryUpdated: syncedOnlySummary.updated,
      nextStepUpdated: syncedNarrative.updated,
      headingUpdated: syncedHeadings.updated,
      summary: syncedOnlySummary.summary,
      headingChanges: syncedHeadings.changes,
    };
  }

  const lines = params.markdown.split(/\r?\n/);
  for (const change of byLine.values()) {
    const index = change.lineNumber - 1;
    const current = lines[index];
    if (typeof current !== 'string') {
      continue;
    }
    lines[index] = replaceFirstEmoji(current, change.to);
  }

  const reconciledMarkdown = lines.join('\n');
  const syncedSummary = syncBacklogStatusSummary(reconciledMarkdown);
  const syncedNarrative = syncBacklogNextStepNarrative({
    markdown: syncedSummary.markdown,
    summary: syncedSummary.summary,
  });
  const syncedHeadings = syncBacklogSectionHeadingStatus(syncedNarrative.markdown);
  return {
    updatedMarkdown: syncedHeadings.markdown,
    changes: Array.from(byLine.values()).sort((a, b) => a.lineNumber - b.lineNumber),
    summaryUpdated: syncedSummary.updated,
    nextStepUpdated: syncedNarrative.updated,
    headingUpdated: syncedHeadings.updated,
    summary: syncedSummary.summary,
    headingChanges: syncedHeadings.changes,
  };
};

export const runBacklogIssuesReconcile = async (params: {
  filePath: string;
  repo?: string;
  apply?: boolean;
  mappingSource?: BacklogMappingSource;
  idIssueMap?: ReadonlyMap<string, number>;
  resolveIssueNumberById?: BacklogIssueNumberResolver;
  readFile?: (path: string) => string;
  writeFile?: (path: string, contents: string) => void;
  resolveIssueState?: (issueNumber: number, repo?: string) => BacklogIssueState | Promise<BacklogIssueState>;
}): Promise<BacklogReconcileResult> => {
  const filePath = resolve(params.filePath);
  const readFile = params.readFile ?? ((path: string) => readFileSync(path, 'utf8'));
  const writeFile = params.writeFile ?? ((path: string, contents: string) => writeFileSync(path, contents, 'utf8'));
  const resolveIssueState = params.resolveIssueState ?? resolveIssueStateWithGh;

  const markdown = readFile(filePath);
  const providedIssueMap = new Map<string, number>(
    params.idIssueMap ? Array.from(params.idIssueMap.entries()) : []
  );
  const pendingIds = collectPendingReferenceIds(markdown);
  const resolvedByProvidedMapSet = new Set<string>(pendingIds.filter((id) => providedIssueMap.has(id)));
  const idIssueMap = new Map<string, number>(providedIssueMap);
  const resolveIssueNumberById = params.resolveIssueNumberById;
  const resolvedByLookupSet = new Set<string>();
  if (typeof resolveIssueNumberById === 'function') {
    for (const backlogId of pendingIds) {
      if (idIssueMap.has(backlogId)) {
        continue;
      }
      const resolvedIssue = await resolveIssueNumberById(backlogId, params.repo);
      const parsedIssue = parseResolvedIssueNumber(resolvedIssue);
      if (parsedIssue === null) {
        continue;
      }
      idIssueMap.set(backlogId, parsedIssue);
      resolvedByLookupSet.add(backlogId);
    }
  }
  const mapped = applyBacklogIssueReferenceMapping({
    markdown,
    idIssueMap,
  });
  const unresolvedReferenceIds = collectPendingReferenceIds(mapped.updatedMarkdown);
  const referenceResolution: BacklogReferenceResolution = {
    resolvedByProvidedMap: Array.from(resolvedByProvidedMapSet).sort(),
    resolvedByLookup: Array.from(resolvedByLookupSet).sort(),
    unresolvedReferenceIds,
  };
  const entries = collectBacklogIssueEntries(mapped.updatedMarkdown);
  const uniqueIssueNumbers = Array.from(new Set(entries.map((entry) => entry.issueNumber))).sort((a, b) => a - b);

  const issueStates = new Map<number, BacklogIssueState>();
  for (const issueNumber of uniqueIssueNumbers) {
    issueStates.set(issueNumber, await resolveIssueState(issueNumber, params.repo));
  }

  const reconciled = reconcileBacklogMarkdown({
    markdown: mapped.updatedMarkdown,
    issueStates,
  });

  const apply = params.apply === true;
  if (
    apply &&
    (mapped.changes.length > 0 ||
      reconciled.changes.length > 0 ||
      reconciled.summaryUpdated ||
      reconciled.nextStepUpdated ||
      reconciled.headingUpdated)
  ) {
    writeFile(filePath, reconciled.updatedMarkdown);
  }

  return {
    filePath,
    repo: params.repo,
    apply,
    mappingSource: params.mappingSource ?? (providedIssueMap.size > 0 ? 'json' : 'none'),
    entriesScanned: entries.length,
    issuesResolved: uniqueIssueNumbers.length,
    referenceChanges: mapped.changes,
    referenceResolution,
    changes: reconciled.changes,
    summaryUpdated: reconciled.summaryUpdated,
    nextStepUpdated: reconciled.nextStepUpdated,
    headingUpdated: reconciled.headingUpdated,
    summary: reconciled.summary,
    headingChanges: reconciled.headingChanges,
    updated:
      apply &&
      (mapped.changes.length > 0 ||
        reconciled.changes.length > 0 ||
        reconciled.summaryUpdated ||
        reconciled.nextStepUpdated ||
        reconciled.headingUpdated),
  };
};
