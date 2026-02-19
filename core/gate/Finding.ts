import type { Severity } from '../rules/Severity';

export type FindingLines = string | number | readonly number[];

export type Finding = {
  ruleId: string;
  severity: Severity;
  code: string;
  message: string;
  filePath?: string;
  lines?: FindingLines;
  matchedBy?: string;
  source?: string;
};
