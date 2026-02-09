import type {
  ConsumerCiArtifactsScanParams,
  ConsumerCiAuthCheckParams,
  ConsumerWorkflowLintScanParams,
} from './framework-menu-runners-consumer-contract';
import { runConsumerMenuScript } from './framework-menu-runners-consumer-exec-lib';

export const runConsumerCiArtifactsScan = async (
  params: ConsumerCiArtifactsScanParams
): Promise<void> => {
  runConsumerMenuScript({
    relativeScriptPath: 'scripts/collect-consumer-ci-artifacts.ts',
    args: ['--repo', params.repo, '--limit', String(params.limit), '--out', params.outFile],
  });
};

export const runConsumerCiAuthCheck = async (
  params: ConsumerCiAuthCheckParams
): Promise<void> => {
  runConsumerMenuScript({
    relativeScriptPath: 'scripts/check-consumer-ci-auth.ts',
    args: ['--repo', params.repo, '--out', params.outFile],
  });
};

export const runConsumerWorkflowLintScan = async (
  params: ConsumerWorkflowLintScanParams
): Promise<void> => {
  runConsumerMenuScript({
    relativeScriptPath: 'scripts/lint-consumer-workflows.ts',
    args: [
      '--repo-path',
      params.repoPath,
      '--actionlint-bin',
      params.actionlintBin,
      '--out',
      params.outFile,
    ],
  });
};
