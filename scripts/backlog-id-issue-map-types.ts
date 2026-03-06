export const BACKLOG_ID_PATTERN =
  /^(PUMUKI-(?:M)?\d+|PUM-\d+|PUMUKI-INC-\d+|FP-\d+|AST-GAP-\d+)$/;

export type BacklogIdIssueMapRecord = Readonly<Record<string, number>>;
