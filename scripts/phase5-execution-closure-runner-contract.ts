export type Phase5ExecutionClosureCliOptions = {
  repo: string;
  limit: number;
  outDir: string;
  runWorkflowLint: boolean;
  includeAuthPreflight: boolean;
  repoPath?: string;
  actionlintBin?: string;
  includeAdapter: boolean;
  requireAdapterReadiness: boolean;
  useMockConsumerTriage: boolean;
  dryRun: boolean;
};

export const DEFAULT_PHASE5_EXECUTION_CLOSURE_LIMIT = 20;
export const DEFAULT_PHASE5_EXECUTION_CLOSURE_OUT_DIR = '.audit-reports/phase5';
