import { buildConsumerStartupTriageCommandArgs } from './framework-menu-builders';
import type { ConsumerStartupTriageParams } from './framework-menu-runners-consumer-contract';
import { resolveScriptOrReportMissing, runNpx } from './framework-menu-runner-common';

export const runConsumerStartupTriage = async (
  params: ConsumerStartupTriageParams
): Promise<void> => {
  const scriptPath = resolveScriptOrReportMissing('scripts/build-consumer-startup-triage.ts');
  if (!scriptPath) {
    return;
  }

  runNpx(
    buildConsumerStartupTriageCommandArgs({
      scriptPath,
      repo: params.repo,
      limit: params.limit,
      outDir: params.outDir,
      runWorkflowLint: params.runWorkflowLint,
      repoPath: params.repoPath,
      actionlintBin: params.actionlintBin,
    })
  );
};
