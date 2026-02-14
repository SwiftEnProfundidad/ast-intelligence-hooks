import type { ConsumerStartupTriageCommandParams } from './framework-menu-builders-consumer-contract';
import { buildFrameworkMenuTsxCommandPrefix } from './framework-menu-builders-shared-lib';

export const buildConsumerStartupTriageCommandArgs = (
  params: ConsumerStartupTriageCommandParams
): string[] => {
  const args = [
    ...buildFrameworkMenuTsxCommandPrefix(params.scriptPath),
    '--repo',
    params.repo,
    '--limit',
    String(params.limit),
    '--out-dir',
    params.outDir,
  ];

  if (!params.runWorkflowLint) {
    args.push('--skip-workflow-lint');
    return args;
  }

  if (params.repoPath) {
    args.push('--repo-path', params.repoPath);
  }

  if (params.actionlintBin) {
    args.push('--actionlint-bin', params.actionlintBin);
  }

  return args;
};
