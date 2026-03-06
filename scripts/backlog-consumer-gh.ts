import { execFileSync } from 'node:child_process';
import { ISSUE_REF_PATTERN } from './backlog-consumer-patterns';
import type { BacklogIssueNumberResolver, BacklogIssueState } from './backlog-consumer-types';

type GhIssueSearchItem = {
  number?: unknown;
  title?: unknown;
  state?: unknown;
  updatedAt?: unknown;
};

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const parseFiniteIssueNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const resolveIssueStateWithGh = (issueNumber: number, repo?: string): BacklogIssueState => {
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
      const exactTitleMatch = tokenRegex.test(title) || ISSUE_REF_PATTERN.test(title);
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
