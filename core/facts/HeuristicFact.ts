import type { Severity } from '../rules/Severity';

export interface HeuristicFact {
  kind: 'Heuristic';
  ruleId: string;
  severity: Severity;
  code: string;
  message: string;
  filePath?: string;
}
