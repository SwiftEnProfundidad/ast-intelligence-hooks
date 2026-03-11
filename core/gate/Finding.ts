import type { Severity } from '../rules/Severity';

export type FindingLines = string | number | readonly number[];

export type FindingNode = {
  kind: 'class' | 'property' | 'call' | 'member';
  name: string;
  lines?: readonly number[];
};

export type Finding = {
  ruleId: string;
  severity: Severity;
  code: string;
  message: string;
  filePath?: string;
  lines?: FindingLines;
  matchedBy?: string;
  source?: string;
  blocking?: boolean;
  primary_node?: FindingNode;
  related_nodes?: readonly FindingNode[];
  why?: string;
  impact?: string;
  expected_fix?: string;
};
