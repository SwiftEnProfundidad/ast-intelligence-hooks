import type {
  ConsumerSupportBundleCliOptions,
  ConsumerSupportBundleWorkflowRun,
} from './consumer-support-bundle-contract';
import { runGhJson } from './consumer-support-bundle-gh-command-lib';

export const loadConsumerSupportBundleWorkflowRuns = (
  options: ConsumerSupportBundleCliOptions
): ConsumerSupportBundleWorkflowRun[] => {
  return runGhJson<ConsumerSupportBundleWorkflowRun[]>([
    'run',
    'list',
    '--repo',
    options.repo,
    '--limit',
    String(options.limit),
    '--json',
    [
      'databaseId',
      'workflowName',
      'status',
      'conclusion',
      'url',
      'event',
      'createdAt',
      'headBranch',
      'headSha',
    ].join(','),
  ]);
};
