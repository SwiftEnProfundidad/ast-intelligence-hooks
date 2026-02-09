import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  buildConsumerSupportBundleMarkdown,
  extractRepoOwner,
  parseConsumerSupportBundleArgs,
  type ConsumerSupportBundleArtifactResponse,
  type ConsumerSupportBundleJobsResponse,
  type ConsumerSupportBundleRepoActionsPermissionsResponse,
  type ConsumerSupportBundleRepoResponse,
  type ConsumerSupportBundleRunDiagnostic,
  type ConsumerSupportBundleRunMetadata,
  type ConsumerSupportBundleUserActionsBillingResponse,
  type ConsumerSupportBundleWorkflowRun,
} from './consumer-startup-failure-support-bundle-lib';

const runGh = (args: ReadonlyArray<string>): string => {
  return execFileSync('gh', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
};

const tryRunGh = (args: ReadonlyArray<string>): {
  ok: boolean;
  output?: string;
  error?: string;
} => {
  try {
    return {
      ok: true,
      output: runGh(args),
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message.replace(/\s+/g, ' ').trim()
          : 'unknown gh command error',
    };
  }
};

const runGhJson = <T>(args: ReadonlyArray<string>): T => {
  return JSON.parse(runGh(args)) as T;
};

const tryRunGhJson = <T>(args: ReadonlyArray<string>): {
  ok: boolean;
  data?: T;
  error?: string;
} => {
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
      error:
        error instanceof Error
          ? error.message.replace(/\s+/g, ' ').trim()
          : 'failed to parse JSON output',
    };
  }
};

const collectRunDiagnostics = (params: {
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

const main = (): number => {
  const options = parseConsumerSupportBundleArgs(process.argv.slice(2));

  const auth = tryRunGh(['auth', 'status']);
  if (!auth.ok) {
    throw new Error(`gh auth status failed: ${auth.error}`);
  }

  const repoInfoResult = tryRunGhJson<ConsumerSupportBundleRepoResponse>([
    'api',
    `repos/${options.repo}`,
  ]);
  const actionsPermissionsResult =
    tryRunGhJson<ConsumerSupportBundleRepoActionsPermissionsResponse>([
      'api',
      `repos/${options.repo}/actions/permissions`,
    ]);
  const owner = extractRepoOwner(options.repo);
  const billingResult = owner
    ? tryRunGhJson<ConsumerSupportBundleUserActionsBillingResponse>([
        'api',
        `users/${owner}/settings/billing/actions`,
      ])
    : {
        ok: false,
        error:
          'Unable to detect repository owner for billing probe (expected owner/repo).',
      };

  const runs = runGhJson<ConsumerSupportBundleWorkflowRun[]>([
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

  const diagnostics = collectRunDiagnostics({
    repo: options.repo,
    runs,
  });

  const markdown = buildConsumerSupportBundleMarkdown({
    generatedAtIso: new Date().toISOString(),
    options,
    authStatus: auth.output ?? '',
    repoInfo: repoInfoResult.ok ? repoInfoResult.data : undefined,
    actionsPermissions: actionsPermissionsResult.ok
      ? actionsPermissionsResult.data
      : undefined,
    actionsPermissionsError: actionsPermissionsResult.ok
      ? undefined
      : actionsPermissionsResult.error,
    billingInfo: billingResult.ok ? billingResult.data : undefined,
    billingError: billingResult.ok ? undefined : billingResult.error,
    runs,
    diagnostics,
  });

  const outputPath = resolve(process.cwd(), options.outFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, markdown, 'utf8');
  process.stdout.write(
    `consumer startup-failure support bundle generated at ${outputPath}\n`
  );
  return 0;
};

process.exitCode = main();
