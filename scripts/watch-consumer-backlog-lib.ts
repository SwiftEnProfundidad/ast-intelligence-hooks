import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type BacklogIssueState = 'OPEN' | 'CLOSED';
export type BacklogStatusEmoji = '✅' | '🚧' | '⏳' | '⛔';

export type BacklogWatchEntry = {
  id: string;
  status: BacklogStatusEmoji;
  issueNumber: number | null;
  lineNumber: number;
  line: string;
};

export type BacklogWatchClassification = {
  needsIssue: ReadonlyArray<BacklogWatchEntry>;
  driftClosedIssue: ReadonlyArray<BacklogWatchEntry>;
  activeIssue: ReadonlyArray<BacklogWatchEntry>;
};

export type BacklogWatchResult = {
  filePath: string;
  repo?: string;
  entriesScanned: number;
  nonClosedEntries: number;
  issueStatesResolved: number;
  classification: BacklogWatchClassification;
  hasActionRequired: boolean;
};

export type BacklogWatchIdIssueMap = Readonly<Record<string, number>>;
export type BacklogIssueNumberResolver = (
  backlogId: string,
  repo?: string
) => number | null | Promise<number | null>;

const STATUS_EMOJI_PATTERN = /(✅|🚧|⏳|⛔)/;
const ISSUE_REF_PATTERN = /#(\d+)/;
const BACKLOG_ID_PATTERN = /^(PUMUKI-(?:M)?\d+|PUMUKI-INC-\d+|FP-\d+|AST-GAP-\d+)$/;
const STATUS_TEXT_PATTERN = /^(OPEN|PENDING|REPORTED|IN_PROGRESS|BLOCKED|FIXED|CLOSED)\b/i;
const STATUS_TEXT_TO_EMOJI: Record<string, BacklogStatusEmoji> = {
  OPEN: '⏳',
  PENDING: '⏳',
  REPORTED: '🚧',
  IN_PROGRESS: '🚧',
  BLOCKED: '⛔',
  FIXED: '✅',
  CLOSED: '✅',
};

const parseIssueNumberFromText = (text: string): number | null => {
  const match = ISSUE_REF_PATTERN.exec(text);
  if (!match?.[1]) {
    return null;
  }
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
};

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
    candidates.push({
      issueNumber,
      score,
      index,
    });
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
    if (nextScore > currentScore) {
      byId.set(entry.id, entry);
      continue;
    }
    if (nextScore === currentScore && entry.lineNumber > current.lineNumber) {
      byId.set(entry.id, entry);
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.lineNumber - b.lineNumber);
};

export const collectBacklogIdIssueMap = (
  markdown: string
): BacklogWatchIdIssueMap => {
  const entries = dedupeBacklogWatchEntriesById(collectBacklogWatchEntries(markdown));
  const map: Record<string, number> = {};
  for (const entry of entries) {
    if (typeof entry.issueNumber !== 'number') {
      continue;
    }
    map[entry.id] = entry.issueNumber;
  }
  return map;
};

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

type GhIssueSearchItem = {
  number?: unknown;
  title?: unknown;
  state?: unknown;
  updatedAt?: unknown;
};

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseFiniteIssueNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const resolveIssueNumberByIdWithGh: BacklogIssueNumberResolver = (backlogId, repo) => {
  const normalizedId = backlogId.trim();
  if (normalizedId.length === 0) {
    return null;
  }
  const args = [
    'issue',
    'list',
    '--state',
    'all',
    '--limit',
    '20',
    '--search',
    `${normalizedId} in:title,body`,
    '--json',
    'number,title,state,updatedAt',
  ];
  if (typeof repo === 'string' && repo.trim().length > 0) {
    args.push('--repo', repo.trim());
  }
  const stdout = execFileSync('gh', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const parsed = JSON.parse(stdout) as unknown;
  if (!Array.isArray(parsed)) {
    return null;
  }

  const tokenRegex = new RegExp(`\\b${escapeRegex(normalizedId)}\\b`, 'i');
  const candidates = parsed
    .map((item) => item as GhIssueSearchItem)
    .map((item, index) => {
      const issueNumber = parseFiniteIssueNumber(item.number);
      const title = typeof item.title === 'string' ? item.title : '';
      const state = item.state === 'OPEN' ? 'OPEN' : item.state === 'CLOSED' ? 'CLOSED' : 'OPEN';
      const updatedAt = typeof item.updatedAt === 'string' ? item.updatedAt : '';
      const exactTitleMatch = tokenRegex.test(title);
      const updatedAtMs = Number.isFinite(Date.parse(updatedAt)) ? Date.parse(updatedAt) : 0;
      if (issueNumber === null) {
        return null;
      }
      let score = 0;
      if (exactTitleMatch) {
        score += 4;
      }
      if (state === 'OPEN') {
        score += 2;
      }
      return {
        issueNumber,
        score,
        updatedAtMs,
        index,
      };
    })
    .filter(
      (entry): entry is { issueNumber: number; score: number; updatedAtMs: number; index: number } =>
        entry !== null
    );

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.updatedAtMs !== a.updatedAtMs) {
      return b.updatedAtMs - a.updatedAtMs;
    }
    if (b.issueNumber !== a.issueNumber) {
      return b.issueNumber - a.issueNumber;
    }
    return a.index - b.index;
  });

  return candidates[0]?.issueNumber ?? null;
};

export const runBacklogWatch = async (params: {
  filePath: string;
  repo?: string;
  idIssueMap?: BacklogWatchIdIssueMap;
  readFile?: (path: string) => string;
  resolveIssueNumberById?: BacklogIssueNumberResolver;
  resolveIssueState?: (issueNumber: number, repo?: string) => BacklogIssueState | Promise<BacklogIssueState>;
}): Promise<BacklogWatchResult> => {
  const filePath = resolve(params.filePath);
  const readFile = params.readFile ?? ((path: string) => readFileSync(path, 'utf8'));
  const resolveIssueState = params.resolveIssueState ?? resolveIssueStateWithGh;

  const markdown = readFile(filePath);
  const entries = collectBacklogWatchEntries(markdown);
  const nonClosedRaw = entries.filter((entry) => entry.status !== '✅');
  const nonClosed = dedupeBacklogWatchEntriesById(nonClosedRaw);
  const nonClosedWithIssueMap = nonClosed.map((entry) => {
    if (entry.issueNumber !== null) {
      return entry;
    }
    const mappedIssue = params.idIssueMap?.[entry.id];
    if (typeof mappedIssue !== 'number' || !Number.isFinite(mappedIssue)) {
      return entry;
    }
    return {
      ...entry,
      issueNumber: Math.trunc(mappedIssue),
    };
  });
  const resolveIssueNumberById = params.resolveIssueNumberById;
  const resolvedIssueById = new Map<string, number>();
  if (typeof resolveIssueNumberById === 'function') {
    const unresolvedIds = Array.from(
      new Set(nonClosedWithIssueMap.filter((entry) => entry.issueNumber === null).map((entry) => entry.id))
    );
    for (const backlogId of unresolvedIds) {
      const resolvedIssue = await resolveIssueNumberById(backlogId, params.repo);
      const parsedIssue = parseFiniteIssueNumber(resolvedIssue);
      if (parsedIssue === null) {
        continue;
      }
      resolvedIssueById.set(backlogId, parsedIssue);
    }
  }
  const nonClosedWithIssueResolution = nonClosedWithIssueMap.map((entry) => {
    if (entry.issueNumber !== null) {
      return entry;
    }
    const resolvedIssue = resolvedIssueById.get(entry.id);
    if (typeof resolvedIssue !== 'number') {
      return entry;
    }
    return {
      ...entry,
      issueNumber: resolvedIssue,
    };
  });

  const issueNumbers = Array.from(
    new Set(
      nonClosedWithIssueResolution
        .map((entry) => entry.issueNumber)
        .filter((value): value is number => typeof value === 'number')
    )
  ).sort((a, b) => a - b);

  const issueStates = new Map<number, BacklogIssueState>();
  for (const issueNumber of issueNumbers) {
    issueStates.set(issueNumber, await resolveIssueState(issueNumber, params.repo));
  }

  const needsIssue = nonClosedWithIssueResolution.filter((entry) => entry.issueNumber === null);
  const driftClosedIssue = nonClosedWithIssueResolution.filter(
    (entry) => typeof entry.issueNumber === 'number' && issueStates.get(entry.issueNumber) === 'CLOSED'
  );
  const activeIssue = nonClosedWithIssueResolution.filter(
    (entry) => typeof entry.issueNumber === 'number' && issueStates.get(entry.issueNumber) === 'OPEN'
  );

  return {
    filePath,
    repo: params.repo,
    entriesScanned: entries.length,
    nonClosedEntries: nonClosed.length,
    issueStatesResolved: issueNumbers.length,
    classification: {
      needsIssue,
      driftClosedIssue,
      activeIssue,
    },
    hasActionRequired: needsIssue.length > 0 || driftClosedIssue.length > 0,
  };
};
