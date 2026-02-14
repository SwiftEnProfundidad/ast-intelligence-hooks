export type ConsumerCiArtifactsScanParams = {
  repo: string;
  limit: number;
  outFile: string;
};

export type ConsumerCiAuthCheckParams = {
  repo: string;
  outFile: string;
};

export type ConsumerWorkflowLintScanParams = {
  repoPath: string;
  actionlintBin: string;
  outFile: string;
};

export type ConsumerSupportBundleParams = {
  repo: string;
  limit: number;
  outFile: string;
};

export type ConsumerSupportTicketDraftParams = {
  repo: string;
  supportBundleFile: string;
  authReportFile: string;
  outFile: string;
};

export type ConsumerStartupUnblockStatusParams = {
  repo: string;
  supportBundleFile: string;
  authReportFile: string;
  workflowLintReportFile: string;
  outFile: string;
};

export type ConsumerStartupTriageParams = {
  repo: string;
  limit: number;
  outDir: string;
  runWorkflowLint: boolean;
  repoPath?: string;
  actionlintBin?: string;
};

export type MockConsumerAbReportParams = {
  repo: string;
  outFile: string;
  blockSummaryFile: string;
  minimalSummaryFile: string;
  blockEvidenceFile: string;
  minimalEvidenceFile: string;
};
