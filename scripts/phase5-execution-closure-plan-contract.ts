export type Phase5ExecutionClosureOptions = {
  repo: string;
  limit: number;
  outDir: string;
  runWorkflowLint: boolean;
  includeAuthPreflight: boolean;
  repoPath?: string;
  actionlintBin?: string;
  includeAdapter: boolean;
  requireAdapterReadiness: boolean;
  useMockConsumerTriage?: boolean;
};

export type Phase5ExecutionClosureOutputs = {
  adapterSessionStatus: string;
  adapterRealSessionReport: string;
  adapterReadiness: string;
  consumerCiAuthCheck: string;
  mockConsumerAbReport: string;
  consumerStartupTriageReport: string;
  consumerStartupUnblockStatus: string;
  phase5BlockersReadiness: string;
  phase5ExecutionClosureStatus: string;
  closureRunReport: string;
};

export type Phase5ExecutionClosureCommand = {
  id:
    | 'adapter-session-status'
    | 'adapter-real-session-report'
    | 'adapter-readiness'
    | 'consumer-auth-preflight'
    | 'mock-consumer-ab-report'
    | 'consumer-startup-triage'
    | 'phase5-blockers-readiness'
    | 'phase5-execution-closure-status';
  description: string;
  script: string;
  args: string[];
  required: boolean;
  outputFiles: string[];
};
