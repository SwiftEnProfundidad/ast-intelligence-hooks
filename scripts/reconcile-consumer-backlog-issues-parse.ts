import {
  BACKLOG_ID_PATTERN,
  PENDING_REFERENCE_PATTERN,
  STATUS_EMOJI_PATTERN,
  parseBacklogIdFromLine,
  parseIssueNumberFromText,
} from './backlog-consumer-patterns';
import type {
  BacklogIssueEntry,
  BacklogIssueReferenceChange,
  BacklogStatusEmoji,
} from './reconcile-consumer-backlog-issues-types';

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
    const issueNumber = parseIssueNumberFromText(line);
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

export const collectPendingReferenceIds = (markdown: string): ReadonlyArray<string> => {
  const lines = markdown.split(/\r?\n/);
  const ids = new Set<string>();
  for (const line of lines) {
    if (!line.includes('|')) {
      continue;
    }
    if (parseIssueNumberFromText(line) !== null) {
      continue;
    }
    if (!PENDING_REFERENCE_PATTERN.test(line)) {
      continue;
    }
    const id = parseBacklogIdFromLine(line);
    if (!id) {
      continue;
    }
    ids.add(id);
  }
  return Array.from(ids).sort();
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
    if (parseIssueNumberFromText(line) !== null) {
      return;
    }
    const id = parseBacklogIdFromLine(line);
    if (!id) {
      return;
    }
    const issueNumber = params.idIssueMap?.get(id);
    if (!issueNumber || !PENDING_REFERENCE_PATTERN.test(line)) {
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

export const resolveBacklogIdIssueMap = async (params: {
  markdown: string;
  providedIssueMap?: ReadonlyMap<string, number>;
  resolveIssueNumberById?: (backlogId: string, repo?: string) => number | null | Promise<number | null>;
  repo?: string;
}): Promise<{
  idIssueMap: ReadonlyMap<string, number>;
  resolvedByProvidedMap: ReadonlyArray<string>;
  resolvedByLookup: ReadonlyArray<string>;
  unresolvedReferenceIds: ReadonlyArray<string>;
}> => {
  const providedIssueMap = new Map<string, number>(
    params.providedIssueMap ? Array.from(params.providedIssueMap.entries()) : []
  );
  const pendingIds = collectPendingReferenceIds(params.markdown);
  const resolvedByProvidedMapSet = new Set<string>(pendingIds.filter((id) => providedIssueMap.has(id)));
  const idIssueMap = new Map<string, number>(providedIssueMap);
  const resolvedByLookupSet = new Set<string>();

  if (typeof params.resolveIssueNumberById === 'function') {
    for (const backlogId of pendingIds) {
      if (idIssueMap.has(backlogId)) {
        continue;
      }
      const resolvedIssue = await params.resolveIssueNumberById(backlogId, params.repo);
      const parsedIssue = parseResolvedIssueNumber(resolvedIssue);
      if (parsedIssue === null) {
        continue;
      }
      idIssueMap.set(backlogId, parsedIssue);
      resolvedByLookupSet.add(backlogId);
    }
  }

  const mapped = applyBacklogIssueReferenceMapping({
    markdown: params.markdown,
    idIssueMap,
  });

  return {
    idIssueMap,
    resolvedByProvidedMap: Array.from(resolvedByProvidedMapSet).sort(),
    resolvedByLookup: Array.from(resolvedByLookupSet).sort(),
    unresolvedReferenceIds: collectPendingReferenceIds(mapped.updatedMarkdown),
  };
};
