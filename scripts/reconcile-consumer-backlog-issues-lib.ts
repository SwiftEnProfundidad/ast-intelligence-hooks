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

export type BacklogStatusSummary = {
  closed: number;
  inProgress: number;
  pending: number;
  blocked: number;
  inProgressIds: ReadonlyArray<string>;
  blockedIds: ReadonlyArray<string>;
};

export type BacklogReconcileResult = {
  filePath: string;
  repo?: string;
  apply: boolean;
  entriesScanned: number;
  issuesResolved: number;
  referenceChanges: ReadonlyArray<BacklogIssueReferenceChange>;
  changes: ReadonlyArray<BacklogIssueChange>;
  summaryUpdated: boolean;
  nextStepUpdated: boolean;
  summary: BacklogStatusSummary;
  updated: boolean;
};

const STATUS_EMOJI_PATTERN = /(✅|🚧|⏳|⛔)/;
const ISSUE_REF_PATTERN = /#(\d+)/;
const BACKLOG_ID_PATTERN = /^PUMUKI-(?:M)?\d+$/;
const PENDING_REFERENCE_PATTERN = /\|\s*Pendiente(?:\s*\(rel\.\s*#\d+\))?\s*\|/;

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
  summary: BacklogStatusSummary;
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
    return {
      updatedMarkdown: syncedNarrative.markdown,
      changes: [],
      summaryUpdated: syncedOnlySummary.updated,
      nextStepUpdated: syncedNarrative.updated,
      summary: syncedOnlySummary.summary,
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
  return {
    updatedMarkdown: syncedNarrative.markdown,
    changes: Array.from(byLine.values()).sort((a, b) => a.lineNumber - b.lineNumber),
    summaryUpdated: syncedSummary.updated,
    nextStepUpdated: syncedNarrative.updated,
    summary: syncedSummary.summary,
  };
};

export const runBacklogIssuesReconcile = async (params: {
  filePath: string;
  repo?: string;
  apply?: boolean;
  idIssueMap?: ReadonlyMap<string, number>;
  readFile?: (path: string) => string;
  writeFile?: (path: string, contents: string) => void;
  resolveIssueState?: (issueNumber: number, repo?: string) => BacklogIssueState | Promise<BacklogIssueState>;
}): Promise<BacklogReconcileResult> => {
  const filePath = resolve(params.filePath);
  const readFile = params.readFile ?? ((path: string) => readFileSync(path, 'utf8'));
  const writeFile = params.writeFile ?? ((path: string, contents: string) => writeFileSync(path, contents, 'utf8'));
  const resolveIssueState = params.resolveIssueState ?? resolveIssueStateWithGh;

  const markdown = readFile(filePath);
  const mapped = applyBacklogIssueReferenceMapping({
    markdown,
    idIssueMap: params.idIssueMap,
  });
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
      reconciled.nextStepUpdated)
  ) {
    writeFile(filePath, reconciled.updatedMarkdown);
  }

  return {
    filePath,
    repo: params.repo,
    apply,
    entriesScanned: entries.length,
    issuesResolved: uniqueIssueNumbers.length,
    referenceChanges: mapped.changes,
    changes: reconciled.changes,
    summaryUpdated: reconciled.summaryUpdated,
    nextStepUpdated: reconciled.nextStepUpdated,
    summary: reconciled.summary,
    updated:
      apply &&
      (mapped.changes.length > 0 ||
        reconciled.changes.length > 0 ||
        reconciled.summaryUpdated ||
        reconciled.nextStepUpdated),
  };
};
