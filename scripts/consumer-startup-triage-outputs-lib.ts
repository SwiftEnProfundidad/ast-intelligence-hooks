import type { ConsumerStartupTriageOutputs } from './consumer-startup-triage-contract';

const joinPath = (base: string, leaf: string): string => {
  return `${base.replace(/\/$/, '')}/${leaf}`;
};

export const resolveConsumerStartupTriageOutputs = (
  outDir: string
): ConsumerStartupTriageOutputs => {
  return {
    authReport: joinPath(outDir, 'consumer-ci-auth-check.md'),
    artifactsReport: joinPath(outDir, 'consumer-ci-artifacts-report.md'),
    workflowLintReport: joinPath(outDir, 'consumer-workflow-lint-report.md'),
    supportBundleReport: joinPath(outDir, 'consumer-startup-failure-support-bundle.md'),
    supportTicketDraft: joinPath(outDir, 'consumer-support-ticket-draft.md'),
    startupUnblockStatus: joinPath(outDir, 'consumer-startup-unblock-status.md'),
    triageReport: joinPath(outDir, 'consumer-startup-triage-report.md'),
  };
};
