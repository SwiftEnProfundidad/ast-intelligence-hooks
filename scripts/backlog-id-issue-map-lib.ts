import type { BacklogIdIssueMapRecord } from './backlog-id-issue-map-types';

export {
  BACKLOG_ID_PATTERN,
  type BacklogIdIssueMapRecord,
} from './backlog-id-issue-map-types';
export {
  parseIdIssueMapRecord,
  parseIdIssueMapRecordFile,
} from './backlog-id-issue-map-parse';

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
