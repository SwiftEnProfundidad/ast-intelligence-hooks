import type { Phase5ExecutionClosureCommandParams } from './framework-menu-builders-phase5-contract';
import { buildPhase5TsxCommandPrefix } from './framework-menu-builders-phase5-shared-lib';

export const buildPhase5ExecutionClosureCommandArgs = (
  params: Phase5ExecutionClosureCommandParams
): string[] => {
  const args = [
    ...buildPhase5TsxCommandPrefix(params.scriptPath),
    '--repo',
    params.repo,
    '--limit',
    String(params.limit),
    '--out-dir',
    params.outDir,
  ];

  if (!params.runWorkflowLint) {
    args.push('--skip-workflow-lint');
  } else {
    if (params.repoPath) {
      args.push('--repo-path', params.repoPath);
    }

    if (params.actionlintBin) {
      args.push('--actionlint-bin', params.actionlintBin);
    }
  }

  if (!params.includeAuthPreflight) {
    args.push('--skip-auth-preflight');
  }

  if (!params.includeAdapter) {
    args.push('--skip-adapter');
  }

  if (params.requireAdapterReadiness) {
    args.push('--require-adapter-readiness');
  }

  if (params.useMockConsumerTriage) {
    args.push('--mock-consumer');
  }

  return args;
};
