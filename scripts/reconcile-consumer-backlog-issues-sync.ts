import { BACKLOG_SECTION_HEADING_PATTERN, STATUS_EMOJI_PATTERN } from './backlog-consumer-patterns';
import {
  collectBacklogIssueEntries,
  collectBacklogOperationalStatusEntries,
} from './reconcile-consumer-backlog-issues-parse';
import type {
  BacklogIssueChange,
  BacklogIssueState,
  BacklogSectionHeadingChange,
  BacklogStatusEmoji,
  BacklogStatusSummary,
} from './reconcile-consumer-backlog-issues-types';

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
    return { markdown, updated: false, summary };
  }

  const start = headerIndex + 1;
  let end = start;
  while (end < lines.length && /^- (✅|🚧|⏳|⛔) /.test(lines[end].trim())) {
    end += 1;
  }

  const nextLines = [
    formatSummaryLine({ emoji: '✅', label: 'Cerrados', count: summary.closed }),
    formatSummaryLine({
      emoji: '🚧',
      label: 'En construcción',
      count: summary.inProgress,
      ids: summary.inProgressIds,
    }),
    formatSummaryLine({ emoji: '⏳', label: 'Pendientes', count: summary.pending }),
    formatSummaryLine({
      emoji: '⛔',
      label: 'Bloqueados',
      count: summary.blocked,
      ids: summary.blockedIds,
    }),
  ];

  const current = lines.slice(start, end);
  if (current.join('\n') === nextLines.join('\n')) {
    return { markdown, updated: false, summary };
  }

  return {
    markdown: [...lines.slice(0, start), ...nextLines, ...lines.slice(end)].join('\n'),
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
  if (params.summary.inProgress !== 0 || params.summary.pending !== 0 || params.summary.blocked !== 0) {
    return { markdown: params.markdown, updated: false };
  }

  const lines = params.markdown.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => line.trim() === heading);
  if (headerIndex < 0) {
    return { markdown: params.markdown, updated: false };
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
  if (current.join('\n') === replacement.join('\n')) {
    return { markdown: params.markdown, updated: false };
  }

  return {
    markdown: [...lines.slice(0, start), ...replacement, ...lines.slice(end)].join('\n'),
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
    const targetEmoji = deriveTargetEmoji({ current: entry.currentEmoji, issueState });
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
    if (typeof current === 'string') {
      lines[index] = replaceFirstEmoji(current, change.to);
    }
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
