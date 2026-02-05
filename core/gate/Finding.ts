import type { Severity } from '../rules/Severity';

export type Finding = {
  ruleId: string;
  severity: Severity;
  code: string;
  message: string;
  filePath?: string;
};
