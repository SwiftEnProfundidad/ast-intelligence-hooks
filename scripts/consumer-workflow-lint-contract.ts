export type ConsumerWorkflowLintCliOptions = {
  repoPath: string;
  outFile: string;
  actionlintBin: string;
};

export type ConsumerWorkflowLintResult = {
  exitCode: number;
  output: string;
  workflowPath: string;
};

export const DEFAULT_CONSUMER_WORKFLOW_LINT_OUT_FILE =
  '.audit-reports/consumer-triage/consumer-workflow-lint-report.md';
