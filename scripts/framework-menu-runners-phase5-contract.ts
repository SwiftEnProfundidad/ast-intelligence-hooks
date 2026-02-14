export type Phase5BlockersReadinessRunnerParams = {
  adapterReportFile: string;
  consumerTriageReportFile: string;
  outFile: string;
};

export type Phase5ExecutionClosureStatusRunnerParams = {
  phase5BlockersReportFile: string;
  consumerUnblockReportFile: string;
  adapterReadinessReportFile: string;
  outFile: string;
  requireAdapterReadiness: boolean;
};

export type Phase5ExternalHandoffRunnerParams = {
  repo: string;
  phase5StatusReportFile: string;
  phase5BlockersReportFile: string;
  consumerUnblockReportFile: string;
  mockAbReportFile: string;
  runReportFile: string;
  outFile: string;
  artifactUrls: ReadonlyArray<string>;
  requireArtifactUrls: boolean;
  requireMockAbReport: boolean;
};

export type Phase5ExecutionClosureRunnerParams = {
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
};
