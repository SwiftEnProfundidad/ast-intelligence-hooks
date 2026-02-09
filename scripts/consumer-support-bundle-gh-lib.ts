import type {
  ConsumerSupportBundleArtifactResponse,
  ConsumerSupportBundleCliOptions,
  ConsumerSupportBundleJobsResponse,
  ConsumerSupportBundleRepoActionsPermissionsResponse,
  ConsumerSupportBundleRepoResponse,
  ConsumerSupportBundleRunDiagnostic,
  ConsumerSupportBundleRunMetadata,
  ConsumerSupportBundleUserActionsBillingResponse,
  ConsumerSupportBundleWorkflowRun,
} from './consumer-support-bundle-contract';
import type { ConsumerSupportBundleGhResult } from './consumer-support-bundle-gh-command-lib';
import {
  runGhJson,
  tryRunGh,
  tryRunGhJson,
} from './consumer-support-bundle-gh-command-lib';
import { extractRepoOwner } from './consumer-startup-failure-support-bundle-lib';

export const ensureConsumerSupportBundleAuth = (): string => {
  const auth = tryRunGh(['auth', 'status']);
  if (!auth.ok) {
    throw new Error(`gh auth status failed: ${auth.error}`);
  }

  return auth.output ?? '';
};

export const loadConsumerSupportBundleRepoInfo = (
  repo: string
): ConsumerSupportBundleGhResult<ConsumerSupportBundleRepoResponse> => {
  return tryRunGhJson<ConsumerSupportBundleRepoResponse>([
    'api',
    `repos/${repo}`,
  ]);
};

export const loadConsumerSupportBundleActionsPermissions = (
  repo: string
): ConsumerSupportBundleGhResult<ConsumerSupportBundleRepoActionsPermissionsResponse> => {
  return tryRunGhJson<ConsumerSupportBundleRepoActionsPermissionsResponse>([
    'api',
    `repos/${repo}/actions/permissions`,
  ]);
};

export const loadConsumerSupportBundleBillingInfo = (
  repo: string
): ConsumerSupportBundleGhResult<ConsumerSupportBundleUserActionsBillingResponse> => {
  const owner = extractRepoOwner(repo);
  if (!owner) {
    return {
      ok: false,
      error: 'Unable to detect repository owner for billing probe (expected owner/repo).',
    };
  }

  return tryRunGhJson<ConsumerSupportBundleUserActionsBillingResponse>([
    'api',
    `users/${owner}/settings/billing/actions`,
  ]);
};

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

export const collectConsumerSupportBundleRunDiagnostics = (params: {
  repo: string;
  runs: ReadonlyArray<ConsumerSupportBundleWorkflowRun>;
}): ReadonlyArray<ConsumerSupportBundleRunDiagnostic> => {
  const diagnostics: ConsumerSupportBundleRunDiagnostic[] = [];

  for (const run of params.runs.slice(0, 5)) {
    const metadataResult = tryRunGhJson<ConsumerSupportBundleRunMetadata>([
      'api',
      `repos/${params.repo}/actions/runs/${run.databaseId}`,
    ]);
    const jobsResult = tryRunGhJson<ConsumerSupportBundleJobsResponse>([
      'api',
      `repos/${params.repo}/actions/runs/${run.databaseId}/jobs`,
    ]);
    const artifactsResult = tryRunGhJson<ConsumerSupportBundleArtifactResponse>([
      'api',
      `repos/${params.repo}/actions/runs/${run.databaseId}/artifacts`,
    ]);

    const errors = [metadataResult, jobsResult, artifactsResult]
      .filter((result) => !result.ok)
      .map((result) => result.error)
      .filter((value): value is string => Boolean(value));

    diagnostics.push({
      run,
      metadata: metadataResult.data,
      jobsCount: jobsResult.data?.total_count,
      artifactsCount: artifactsResult.data?.total_count,
      error: errors.length > 0 ? errors.join(' | ') : undefined,
    });
  }

  return diagnostics;
};
