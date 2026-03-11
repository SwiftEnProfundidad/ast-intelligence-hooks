import type { Severity } from '../rules/Severity';

export type HeuristicNode = {
  kind: 'class' | 'property' | 'call' | 'member';
  name: string;
  lines?: readonly number[];
};

export interface HeuristicFact {
  kind: 'Heuristic';
  ruleId: string;
  severity: Severity;
  code: string;
  message: string;
  filePath?: string;
  lines?: readonly number[];
  primary_node?: HeuristicNode;
  related_nodes?: readonly HeuristicNode[];
  why?: string;
  impact?: string;
  expected_fix?: string;
}
