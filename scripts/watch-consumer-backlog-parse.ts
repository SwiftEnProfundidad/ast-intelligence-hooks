import {
  BACKLOG_ID_PATTERN,
  BACKLOG_SECTION_HEADING_PATTERN,
  STATUS_EMOJI_PATTERN,
  STATUS_TEXT_PATTERN,
  STATUS_TEXT_TO_EMOJI,
  parseIssueNumberFromText,
} from './backlog-consumer-patterns';
import type {
  BacklogHeadingDriftEntry,
  BacklogStatusEmoji,
  BacklogWatchEntry,
  BacklogWatchIdIssueMap,
} from './watch-consumer-backlog-types';

const parseIssueNumberFromCells = (cells: ReadonlyArray<string>, fallbackLine: string): number | null => {
  const candidates: Array<{ issueNumber: number; score: number; index: number }> = [];
  cells.forEach((cell, index) => {
    const issueNumber = parseIssueNumberFromText(cell);
    if (issueNumber === null) {
      return;
    }
    let score = 0;
    if (STATUS_EMOJI_PATTERN.test(cell) || STATUS_TEXT_PATTERN.test(cell)) {
      score += 3;
    }
    if (/\b(ref|upstream|referencia|estado|issue)\b/i.test(cell)) {
      score += 2;
    }
    candidates.push({ issueNumber, score, index });
  });
  if (candidates.length > 0) {
    candidates.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.index - a.index;
    });
    return candidates[0]?.issueNumber ?? null;
  }
  return parseIssueNumberFromText(fallbackLine);
};

export const collectBacklogWatchEntries = (markdown: string): ReadonlyArray<BacklogWatchEntry> => {
  const lines = markdown.split(/\r?\n/);
  const entries: BacklogWatchEntry[] = [];

  lines.forEach((line, index) => {
    if (!line.trimStart().startsWith('|')) {
      return;
    }
    const cells = line.split('|').map((cell) => cell.trim());
    const id = cells.find((cell) => BACKLOG_ID_PATTERN.test(cell));
    const statusEmojiCell = cells.find((cell) => STATUS_EMOJI_PATTERN.test(cell));
    const statusEmojiMatch =
      typeof statusEmojiCell === 'string' ? STATUS_EMOJI_PATTERN.exec(statusEmojiCell) : null;
    const statusEmoji = statusEmojiMatch?.[1] as BacklogStatusEmoji | undefined;
    const statusTextCell = cells.find((cell) => STATUS_TEXT_PATTERN.test(cell));
    const statusTextMatch =
      typeof statusTextCell === 'string' ? STATUS_TEXT_PATTERN.exec(statusTextCell) : null;
    const normalizedText = statusTextMatch?.[1]?.toUpperCase().replace(/\s+/g, '_') ?? null;
    const mappedTextEmoji = normalizedText ? STATUS_TEXT_TO_EMOJI[normalizedText] : undefined;
    const status = statusEmoji ?? mappedTextEmoji;
    if (!id || !status) {
      return;
    }
    entries.push({
      id,
      status: (statusEmoji ?? mappedTextEmoji) as BacklogStatusEmoji,
      issueNumber: parseIssueNumberFromCells(cells, line),
      lineNumber: index + 1,
      line,
    });
  });

  return entries;
};

export const dedupeBacklogWatchEntriesById = (
  entries: ReadonlyArray<BacklogWatchEntry>
): ReadonlyArray<BacklogWatchEntry> => {
  const byId = new Map<string, BacklogWatchEntry>();

  const score = (entry: BacklogWatchEntry): number => {
    let value = 0;
    if (typeof entry.issueNumber === 'number') {
      value += 2;
    }
    if (entry.line.includes('REPORTED (#') || entry.line.includes('FIXED (#')) {
      value += 1;
    }
    return value;
  };

  for (const entry of entries) {
    const current = byId.get(entry.id);
    if (!current) {
      byId.set(entry.id, entry);
      continue;
    }
    const currentScore = score(current);
    const nextScore = score(entry);
    if (nextScore > currentScore || (nextScore === currentScore && entry.lineNumber > current.lineNumber)) {
      byId.set(entry.id, entry);
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.lineNumber - b.lineNumber);
};

export const collectBacklogIdIssueMap = (markdown: string): BacklogWatchIdIssueMap => {
  const entries = dedupeBacklogWatchEntriesById(collectBacklogWatchEntries(markdown));
  const map: Record<string, number> = {};
  for (const entry of entries) {
    if (typeof entry.issueNumber === 'number') {
      map[entry.id] = entry.issueNumber;
    }
  }
  return map;
};

const collectBacklogHeadingEntries = (
  markdown: string
): ReadonlyArray<{ id: string; status: BacklogStatusEmoji; lineNumber: number; line: string }> => {
  const lines = markdown.split(/\r?\n/);
  const entries: Array<{ id: string; status: BacklogStatusEmoji; lineNumber: number; line: string }> = [];
  lines.forEach((line, index) => {
    const match = BACKLOG_SECTION_HEADING_PATTERN.exec(line);
    if (!match?.[2] || !match[4]) {
      return;
    }
    entries.push({
      id: match[4],
      status: match[2] as BacklogStatusEmoji,
      lineNumber: index + 1,
      line,
    });
  });
  return entries;
};

export const collectBacklogHeadingDrift = (markdown: string): ReadonlyArray<BacklogHeadingDriftEntry> => {
  const effectiveEntries = dedupeBacklogWatchEntriesById(collectBacklogWatchEntries(markdown));
  const effectiveStatusById = new Map<string, BacklogStatusEmoji>();
  for (const entry of effectiveEntries) {
    if (!effectiveStatusById.has(entry.id)) {
      effectiveStatusById.set(entry.id, entry.status);
    }
  }

  const headingEntries = collectBacklogHeadingEntries(markdown);
  const drift: BacklogHeadingDriftEntry[] = [];
  for (const heading of headingEntries) {
    const effectiveStatus = effectiveStatusById.get(heading.id);
    if (!effectiveStatus || effectiveStatus === heading.status) {
      continue;
    }
    drift.push({
      id: heading.id,
      lineNumber: heading.lineNumber,
      headingStatus: heading.status,
      effectiveStatus,
      line: heading.line,
    });
  }

  return drift;
};
