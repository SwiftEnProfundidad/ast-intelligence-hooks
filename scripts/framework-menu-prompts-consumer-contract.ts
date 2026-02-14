export type ConsumerCiScanPromptResult = {
  repo: string;
  limit: number;
  outFile: string;
};

export type ConsumerWorkflowLintPromptResult = {
  repoPath: string;
  actionlintBin: string;
  outFile: string;
};

export type ConsumerCiAuthCheckPromptResult = {
  repo: string;
  outFile: string;
};

export type ConsumerSupportBundlePromptResult = {
  repo: string;
  limit: number;
  outFile: string;
};

export type ConsumerSupportTicketDraftPromptResult = {
  repo: string;
  supportBundleFile: string;
  authReportFile: string;
  outFile: string;
};

export type ConsumerStartupUnblockStatusPromptResult = {
  repo: string;
  supportBundleFile: string;
  authReportFile: string;
  workflowLintReportFile: string;
  outFile: string;
};

export type ConsumerStartupTriagePromptResult = {
  repo: string;
  limit: number;
  outDir: string;
  runWorkflowLint: boolean;
  repoPath?: string;
  actionlintBin?: string;
};
