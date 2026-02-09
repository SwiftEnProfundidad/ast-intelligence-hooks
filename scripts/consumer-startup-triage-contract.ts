export type ConsumerStartupTriageOptions = {
  repo: string;
  limit: number;
  outDir: string;
  runWorkflowLint: boolean;
  includeAuthCheck?: boolean;
  repoPath?: string;
  actionlintBin?: string;
};

export type ConsumerStartupTriageOutputs = {
  authReport: string;
  artifactsReport: string;
  workflowLintReport: string;
  supportBundleReport: string;
  supportTicketDraft: string;
  startupUnblockStatus: string;
  triageReport: string;
};

export type ConsumerStartupTriageCommand = {
  id:
    | 'auth-check'
    | 'ci-artifacts'
    | 'workflow-lint'
    | 'support-bundle'
    | 'support-ticket-draft'
    | 'startup-unblock-status';
  description: string;
  script: string;
  args: string[];
  outputFile: string;
  required: boolean;
};

export type ConsumerStartupTriageExecution = {
  command: ConsumerStartupTriageCommand;
  exitCode: number;
  ok: boolean;
  error?: string;
};
