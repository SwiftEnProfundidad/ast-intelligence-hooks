import { buildPhase5ExecutionClosureCommandArgs } from './framework-menu-builders';
import type { Phase5ExecutionClosureRunnerParams } from './framework-menu-runners-phase5-contract';
import { runPhase5BuiltCommand } from './framework-menu-runners-phase5-exec-lib';

export const runPhase5ExecutionClosure = async (
  params: Phase5ExecutionClosureRunnerParams
): Promise<void> => {
  runPhase5BuiltCommand({
    relativeScriptPath: 'scripts/run-phase5-execution-closure.ts',
    buildArgs: (scriptPath) =>
      buildPhase5ExecutionClosureCommandArgs({
        scriptPath,
        repo: params.repo,
        limit: params.limit,
        outDir: params.outDir,
        runWorkflowLint: params.runWorkflowLint,
        includeAuthPreflight: params.includeAuthPreflight,
        repoPath: params.repoPath,
        actionlintBin: params.actionlintBin,
        includeAdapter: params.includeAdapter,
        requireAdapterReadiness: params.requireAdapterReadiness,
        useMockConsumerTriage: params.useMockConsumerTriage,
      }),
  });
};
