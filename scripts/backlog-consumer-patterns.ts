import type { BacklogStatusEmoji } from './backlog-consumer-types';

export const STATUS_EMOJI_PATTERN = /(✅|🚧|⏳|⛔)/;
export const ISSUE_REF_PATTERN = /#(\d+)/;
export const BACKLOG_ID_PATTERN = /^(PUMUKI-(?:M)?\d+|PUM-\d+|PUMUKI-INC-\d+|FP-\d+|AST-GAP-\d+)$/;
export const STATUS_TEXT_PATTERN = /^(OPEN|PENDING|REPORTED|IN_PROGRESS|BLOCKED|FIXED|CLOSED)\b/i;
export const BACKLOG_SECTION_HEADING_PATTERN =
  /^(\s*###\s*)(✅|🚧|⏳|⛔)(\s+)(PUMUKI-(?:M)?\d+|PUM-\d+|PUMUKI-INC-\d+|FP-\d+|AST-GAP-\d+)\b/;
export const PENDING_REFERENCE_PATTERN = /\|\s*Pendiente(?:\s*\(rel\.\s*#\d+\))?\s*\|/;

export const STATUS_TEXT_TO_EMOJI: Record<string, BacklogStatusEmoji> = {
  OPEN: '⏳',
  PENDING: '⏳',
  REPORTED: '🚧',
  IN_PROGRESS: '🚧',
  BLOCKED: '⛔',
  FIXED: '✅',
  CLOSED: '✅',
};

export const parseIssueNumberFromText = (text: string): number | null => {
  const match = ISSUE_REF_PATTERN.exec(text);
  if (!match?.[1]) {
    return null;
  }
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
};

export const parseBacklogIdFromCells = (cells: ReadonlyArray<string>): string | null => {
  const id = cells.find((cell) => BACKLOG_ID_PATTERN.test(cell));
  return id ?? null;
};

export const parseBacklogIdFromLine = (line: string): string | null =>
  parseBacklogIdFromCells(line.split('|').map((cell) => cell.trim()));
