export type Phase5BlockersReadinessCommandParams = {
  scriptPath: string;
  adapterReportFile: string;
  consumerTriageReportFile: string;
  outFile: string;
};

export type Phase5ExecutionClosureStatusCommandParams = {
  scriptPath: string;
  phase5BlockersReportFile: string;
  consumerUnblockReportFile: string;
  adapterReadinessReportFile: string;
  outFile: string;
  requireAdapterReadiness: boolean;
};

export type Phase5ExternalHandoffCommandParams = {
  scriptPath: string;
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

export type Phase5ExecutionClosureCommandParams = {
  scriptPath: string;
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
