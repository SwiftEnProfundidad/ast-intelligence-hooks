import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const BACKLOG_ID_PATTERN = /^(PUMUKI-(?:M)?\d+|PUMUKI-INC-\d+|FP-\d+|AST-GAP-\d+)$/;

export type BacklogIdIssueMapRecord = Readonly<Record<string, number>>;

const parsePositiveIssueNumber = (value: unknown): number | null => {
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

export const parseIdIssueMapRecord = (raw: string): BacklogIdIssueMapRecord => {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const normalized: Record<string, number> = {};
  for (const [id, value] of Object.entries(parsed)) {
    if (!BACKLOG_ID_PATTERN.test(id)) {
      throw new Error(`Invalid id in --id-issue-map: "${id}"`);
    }
    const issueNumber = parsePositiveIssueNumber(value);
    if (issueNumber === null) {
      throw new Error(`Invalid issue number for "${id}" in --id-issue-map`);
    }
    normalized[id] = issueNumber;
  }
  return normalized;
};

export const parseIdIssueMapRecordFile = (
  filePath: string,
  readFile: (path: string) => string = (path) => readFileSync(path, 'utf8')
): BacklogIdIssueMapRecord => {
  const resolvedPath = resolve(filePath);
  return parseIdIssueMapRecord(readFile(resolvedPath));
};

export const mergeIdIssueMapRecords = (
  base?: BacklogIdIssueMapRecord,
  override?: BacklogIdIssueMapRecord
): BacklogIdIssueMapRecord | undefined => {
  if (!base && !override) {
    return undefined;
  }
  return {
    ...(base ?? {}),
    ...(override ?? {}),
  };
};

export const recordToIdIssueMap = (
  record?: BacklogIdIssueMapRecord
): ReadonlyMap<string, number> | undefined => {
  if (!record) {
    return undefined;
  }
  const map = new Map<string, number>();
  for (const [id, issue] of Object.entries(record)) {
    map.set(id, Math.trunc(issue));
  }
  return map;
};
