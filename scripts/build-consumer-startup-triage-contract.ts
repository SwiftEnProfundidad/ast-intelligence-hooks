export type BuildConsumerStartupTriageCliOptions = {
  repo: string;
  limit: number;
  outDir: string;
  runWorkflowLint: boolean;
  includeAuthCheck: boolean;
  repoPath?: string;
  actionlintBin?: string;
  dryRun: boolean;
};

export const DEFAULT_CONSUMER_STARTUP_TRIAGE_LIMIT = 20;
export const DEFAULT_CONSUMER_STARTUP_TRIAGE_OUT_DIR = '.audit-reports/consumer-triage';

export const createDefaultBuildConsumerStartupTriageCliOptions =
  (): BuildConsumerStartupTriageCliOptions => {
    return {
      repo: '',
      limit: DEFAULT_CONSUMER_STARTUP_TRIAGE_LIMIT,
      outDir: DEFAULT_CONSUMER_STARTUP_TRIAGE_OUT_DIR,
      runWorkflowLint: true,
      includeAuthCheck: true,
      dryRun: false,
    };
  };
