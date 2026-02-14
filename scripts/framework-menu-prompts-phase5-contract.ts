export type Phase5BlockersReadinessPromptResult = {
  adapterReportFile: string;
  consumerTriageReportFile: string;
  outFile: string;
};

export type MockConsumerAbReportPromptResult = {
  repo: string;
  outFile: string;
  blockSummaryFile: string;
  minimalSummaryFile: string;
  blockEvidenceFile: string;
  minimalEvidenceFile: string;
};

export type Phase5ExecutionClosureStatusPromptResult = {
  phase5BlockersReportFile: string;
  consumerUnblockReportFile: string;
  adapterReadinessReportFile: string;
  outFile: string;
  requireAdapterReadiness: boolean;
};

export type Phase5ExternalHandoffPromptResult = {
  repo: string;
  phase5StatusReportFile: string;
  phase5BlockersReportFile: string;
  consumerUnblockReportFile: string;
  mockAbReportFile: string;
  runReportFile: string;
  outFile: string;
  artifactUrls: string[];
  requireArtifactUrls: boolean;
  requireMockAbReport: boolean;
};

export type Phase5ExecutionClosurePromptResult = {
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
