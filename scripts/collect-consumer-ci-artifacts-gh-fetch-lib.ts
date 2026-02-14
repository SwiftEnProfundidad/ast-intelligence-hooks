import type {
  ConsumerCiArtifactsCliOptions,
  ConsumerCiRunArtifactsResult,
  ConsumerCiWorkflowRun,
} from './collect-consumer-ci-artifacts-contract';
import { runGhJson } from './collect-consumer-ci-artifacts-gh-command-lib';
import { loadConsumerCiRunArtifactsResult } from './collect-consumer-ci-artifacts-gh-run-fetch-lib';

export const loadConsumerCiWorkflowRuns = (
  options: ConsumerCiArtifactsCliOptions
): ConsumerCiWorkflowRun[] => {
  return runGhJson<ConsumerCiWorkflowRun[]>([
    'run',
    'list',
    '--repo',
    options.repo,
    '--limit',
    String(options.limit),
    '--json',
    [
      'databaseId',
      'displayTitle',
      'workflowName',
      'status',
      'conclusion',
      'url',
      'createdAt',
      'event',
      'headBranch',
      'headSha',
    ].join(','),
  ]);
};

export const loadConsumerCiRunArtifactsResults = (
  options: ConsumerCiArtifactsCliOptions,
  runs: ReadonlyArray<ConsumerCiWorkflowRun>
): ConsumerCiRunArtifactsResult[] => {
  return runs.map((run) =>
    loadConsumerCiRunArtifactsResult({
      options,
      run,
    })
  );
};
