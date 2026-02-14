import type { Phase5ExecutionClosureOutputs } from './phase5-execution-closure-plan-contract';

const joinPath = (base: string, leaf: string): string => {
  return `${base.replace(/\/$/, '')}/${leaf}`;
};

export const resolvePhase5ExecutionClosureOutputs = (
  outDir: string
): Phase5ExecutionClosureOutputs => {
  return {
    adapterSessionStatus: joinPath(outDir, 'adapter-session-status.md'),
    adapterRealSessionReport: joinPath(outDir, 'adapter-real-session-report.md'),
    adapterReadiness: joinPath(outDir, 'adapter-readiness.md'),
    consumerCiAuthCheck: joinPath(outDir, 'consumer-ci-auth-check.md'),
    mockConsumerAbReport: joinPath(outDir, 'mock-consumer-ab-report.md'),
    consumerStartupTriageReport: joinPath(outDir, 'consumer-startup-triage-report.md'),
    consumerStartupUnblockStatus: joinPath(outDir, 'consumer-startup-unblock-status.md'),
    phase5BlockersReadiness: joinPath(outDir, 'phase5-blockers-readiness.md'),
    phase5ExecutionClosureStatus: joinPath(
      outDir,
      'phase5-execution-closure-status.md'
    ),
    closureRunReport: joinPath(outDir, 'phase5-execution-closure-run-report.md'),
  };
};
