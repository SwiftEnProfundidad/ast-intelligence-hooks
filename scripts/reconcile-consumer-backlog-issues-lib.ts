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

export type BacklogReconcileResult = {
  filePath: string;
  repo?: string;
  apply: boolean;
  entriesScanned: number;
  issuesResolved: number;
  changes: ReadonlyArray<BacklogIssueChange>;
  updated: boolean;
};

const STATUS_EMOJI_PATTERN = /(✅|🚧|⏳|⛔)/;
const ISSUE_REF_PATTERN = /#(\d+)/;

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
    return {
      updatedMarkdown: params.markdown,
      changes: [],
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

  return {
    updatedMarkdown: lines.join('\n'),
    changes: Array.from(byLine.values()).sort((a, b) => a.lineNumber - b.lineNumber),
  };
};

export const runBacklogIssuesReconcile = async (params: {
  filePath: string;
  repo?: string;
  apply?: boolean;
  readFile?: (path: string) => string;
  writeFile?: (path: string, contents: string) => void;
  resolveIssueState?: (issueNumber: number, repo?: string) => BacklogIssueState | Promise<BacklogIssueState>;
}): Promise<BacklogReconcileResult> => {
  const filePath = resolve(params.filePath);
  const readFile = params.readFile ?? ((path: string) => readFileSync(path, 'utf8'));
  const writeFile = params.writeFile ?? ((path: string, contents: string) => writeFileSync(path, contents, 'utf8'));
  const resolveIssueState = params.resolveIssueState ?? resolveIssueStateWithGh;

  const markdown = readFile(filePath);
  const entries = collectBacklogIssueEntries(markdown);
  const uniqueIssueNumbers = Array.from(new Set(entries.map((entry) => entry.issueNumber))).sort((a, b) => a - b);

  const issueStates = new Map<number, BacklogIssueState>();
  for (const issueNumber of uniqueIssueNumbers) {
    issueStates.set(issueNumber, await resolveIssueState(issueNumber, params.repo));
  }

  const reconciled = reconcileBacklogMarkdown({
    markdown,
    issueStates,
  });

  const apply = params.apply === true;
  if (apply && reconciled.changes.length > 0) {
    writeFile(filePath, reconciled.updatedMarkdown);
  }

  return {
    filePath,
    repo: params.repo,
    apply,
    entriesScanned: entries.length,
    issuesResolved: uniqueIssueNumbers.length,
    changes: reconciled.changes,
    updated: apply && reconciled.changes.length > 0,
  };
};
