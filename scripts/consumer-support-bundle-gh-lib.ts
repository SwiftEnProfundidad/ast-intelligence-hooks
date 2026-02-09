import { execFileSync } from 'node:child_process';
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
import { extractRepoOwner } from './consumer-startup-failure-support-bundle-lib';

type ConsumerSupportBundleGhResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

const runGh = (args: ReadonlyArray<string>): string => {
  return execFileSync('gh', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
};

const normalizeGhError = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    return error.message.replace(/\s+/g, ' ').trim();
  }
  return fallback;
};

const tryRunGh = (args: ReadonlyArray<string>): { ok: boolean; output?: string; error?: string } => {
  try {
    return {
      ok: true,
      output: runGh(args),
    };
  } catch (error) {
    return {
      ok: false,
      error: normalizeGhError(error, 'unknown gh command error'),
    };
  }
};

const tryRunGhJson = <T>(args: ReadonlyArray<string>): ConsumerSupportBundleGhResult<T> => {
  const result = tryRunGh(args);
  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
    };
  }

  try {
    return {
      ok: true,
      data: JSON.parse(result.output ?? '') as T,
    };
  } catch (error) {
    return {
      ok: false,
      error: normalizeGhError(error, 'failed to parse JSON output'),
    };
  }
};

const runGhJson = <T>(args: ReadonlyArray<string>): T => {
  return JSON.parse(runGh(args)) as T;
};

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
