import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

type CliOptions = {
  repo: string;
  limit: number;
  outFile: string;
};

type WorkflowRun = {
  databaseId: number;
  workflowName: string;
  status: string;
  conclusion: string | null;
  url: string;
  event: string;
  createdAt: string;
  headBranch: string;
  headSha: string;
};

type RunMetadata = {
  id: number;
  name: string;
  path: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  referenced_workflows: ReadonlyArray<unknown>;
};

type JobsResponse = {
  total_count: number;
};

type ArtifactResponse = {
  total_count: number;
};

type RepoResponse = {
  full_name: string;
  private: boolean;
  visibility: string;
};

type RepoActionsPermissionsResponse = {
  enabled: boolean;
  allowed_actions: string;
  sha_pinning_required: boolean;
};

type UserActionsBillingResponse = Record<string, unknown>;

type RunDiagnostic = {
  run: WorkflowRun;
  metadata?: RunMetadata;
  jobsCount?: number;
  artifactsCount?: number;
  error?: string;
};

const DEFAULT_LIMIT = 20;
const DEFAULT_OUT_FILE =
  '.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md';

const parseArgs = (args: ReadonlyArray<string>): CliOptions => {
  const options: CliOptions = {
    repo: '',
    limit: DEFAULT_LIMIT,
    outFile: DEFAULT_OUT_FILE,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--repo') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --repo');
      }
      options.repo = value;
      index += 1;
      continue;
    }

    if (arg === '--limit') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --limit');
      }
      const parsed = Number.parseInt(value, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`Invalid --limit value: ${value}`);
      }
      options.limit = parsed;
      index += 1;
      continue;
    }

    if (arg === '--out') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --out');
      }
      options.outFile = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.repo) {
    throw new Error('Missing required argument --repo <owner/repo>');
  }

  return options;
};

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

const buildMarkdown = (params: {
  options: CliOptions;
  authStatus: string;
  repoInfo?: RepoResponse;
  actionsPermissions?: RepoActionsPermissionsResponse;
  actionsPermissionsError?: string;
  billingInfo?: UserActionsBillingResponse;
  billingError?: string;
  runs: ReadonlyArray<WorkflowRun>;
  diagnostics: ReadonlyArray<RunDiagnostic>;
}): string => {
  const now = new Date().toISOString();
  const startupFailures = params.runs.filter(
    (run) => run.conclusion === 'startup_failure'
  );

  const lines: string[] = [];
  lines.push('# Consumer Startup Failure Support Bundle');
  lines.push('');
  lines.push(`- generated_at: ${now}`);
  lines.push(`- target_repo: \`${params.options.repo}\``);
  if (params.repoInfo) {
    lines.push(
      `- repo_visibility: \`${params.repoInfo.visibility}\` (private=${String(params.repoInfo.private)})`
    );
  }
  lines.push(`- runs_checked: ${params.runs.length}`);
  lines.push(`- startup_failure_runs: ${startupFailures.length}`);
  lines.push('');

  lines.push('## GH Auth Status');
  lines.push('');
  lines.push('```text');
  lines.push(params.authStatus.trimEnd());
  lines.push('```');
  lines.push('');

  lines.push('## Repository Actions Policy');
  lines.push('');
  if (params.actionsPermissions) {
    lines.push(`- enabled: ${String(params.actionsPermissions.enabled)}`);
    lines.push(`- allowed_actions: ${params.actionsPermissions.allowed_actions}`);
    lines.push(
      `- sha_pinning_required: ${String(params.actionsPermissions.sha_pinning_required)}`
    );
  } else if (params.actionsPermissionsError) {
    lines.push(`- error: ${params.actionsPermissionsError}`);
  } else {
    lines.push('- not available');
  }
  lines.push('');

  lines.push('## Billing Scope Probe');
  lines.push('');
  if (params.billingInfo) {
    lines.push('```json');
    lines.push(JSON.stringify(params.billingInfo, null, 2));
    lines.push('```');
  } else if (params.billingError) {
    lines.push(`- error: ${params.billingError}`);
    lines.push(
      '- remediation: `gh auth refresh -h github.com -s user` and rerun this command.'
    );
  } else {
    lines.push('- not available');
  }
  lines.push('');

  lines.push('## Run Summary');
  lines.push('');
  lines.push('| run_id | workflow | event | branch | status | conclusion | url |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');
  for (const run of params.runs) {
    lines.push(
      `| ${run.databaseId} | ${run.workflowName || '(empty)'} | ${run.event} | ${run.headBranch} | ${run.status} | ${run.conclusion ?? 'null'} | ${run.url} |`
    );
  }
  lines.push('');

  lines.push('## Run Diagnostics');
  lines.push('');
  for (const diagnostic of params.diagnostics) {
    lines.push(`### Run ${diagnostic.run.databaseId}`);
    lines.push('');
    lines.push(`- url: ${diagnostic.run.url}`);
    lines.push(`- workflowName: ${diagnostic.run.workflowName || '(empty)'}`);
    lines.push(`- event: ${diagnostic.run.event}`);
    lines.push(`- conclusion: ${diagnostic.run.conclusion ?? 'null'}`);
    if (diagnostic.metadata) {
      lines.push(`- path: ${diagnostic.metadata.path}`);
      lines.push(`- referenced_workflows: ${diagnostic.metadata.referenced_workflows.length}`);
    }
    if (typeof diagnostic.jobsCount === 'number') {
      lines.push(`- jobs.total_count: ${diagnostic.jobsCount}`);
    }
    if (typeof diagnostic.artifactsCount === 'number') {
      lines.push(`- artifacts.total_count: ${diagnostic.artifactsCount}`);
    }
    if (diagnostic.error) {
      lines.push(`- error: ${diagnostic.error}`);
    }
    lines.push('');
  }

  const sampleRuns = startupFailures.slice(0, 3);

  lines.push('## Support Payload (Copy/Paste)');
  lines.push('');
  lines.push('```text');
  lines.push('Persistent GitHub Actions startup_failure in private repository.');
  lines.push('');
  lines.push(`Repository: ${params.options.repo}`);
  if (params.repoInfo) {
    lines.push(`Visibility: ${params.repoInfo.visibility}`);
  }
  if (params.actionsPermissions) {
    lines.push(
      `Repo Actions policy: enabled=${String(params.actionsPermissions.enabled)}, allowed_actions=${params.actionsPermissions.allowed_actions}, sha_pinning_required=${String(params.actionsPermissions.sha_pinning_required)}`
    );
  }
  if (params.billingInfo) {
    lines.push('Billing probe: available (see JSON payload in report).');
  } else if (params.billingError) {
    lines.push(`Billing probe: unavailable (${params.billingError}).`);
  }
  lines.push(`Runs checked: ${params.runs.length}`);
  lines.push(`startup_failure runs: ${startupFailures.length}`);
  lines.push('');
  lines.push('Sample run URLs:');
  for (const run of sampleRuns) {
    lines.push(`- ${run.url}`);
  }
  lines.push('');
  lines.push(
    'Observed pattern: workflow startup fails before jobs are created (jobs.total_count=0) and artifacts are absent (artifacts.total_count=0).'
  );
  lines.push(
    'Please verify account/repo-level restrictions for private Actions execution (policy, billing, quotas, or platform controls).'
  );
  lines.push('```');
  lines.push('');

  return `${lines.join('\n')}\n`;
};

const main = (): number => {
  const options = parseArgs(process.argv.slice(2));

  const auth = tryRunGh(['auth', 'status']);
  if (!auth.ok) {
    throw new Error(`gh auth status failed: ${auth.error}`);
  }

  const repoInfoResult = tryRunGhJson<RepoResponse>([
    'api',
    `repos/${options.repo}`,
  ]);
  const actionsPermissionsResult =
    tryRunGhJson<RepoActionsPermissionsResponse>([
      'api',
      `repos/${options.repo}/actions/permissions`,
    ]);
  const owner = options.repo.split('/')[0]?.trim();
  const billingResult = owner
    ? tryRunGhJson<UserActionsBillingResponse>([
        'api',
        `users/${owner}/settings/billing/actions`,
      ])
    : {
        ok: false,
        error:
          'Unable to detect repository owner for billing probe (expected owner/repo).',
      };

  const runs = runGhJson<WorkflowRun[]>([
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

  const diagnostics: RunDiagnostic[] = [];
  for (const run of runs.slice(0, 5)) {
    const metadataResult = tryRunGhJson<RunMetadata>([
      'api',
      `repos/${options.repo}/actions/runs/${run.databaseId}`,
    ]);
    const jobsResult = tryRunGhJson<JobsResponse>([
      'api',
      `repos/${options.repo}/actions/runs/${run.databaseId}/jobs`,
    ]);
    const artifactsResult = tryRunGhJson<ArtifactResponse>([
      'api',
      `repos/${options.repo}/actions/runs/${run.databaseId}/artifacts`,
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

  const markdown = buildMarkdown({
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
  process.stdout.write(`consumer startup-failure support bundle generated at ${outputPath}\n`);
  return 0;
};

process.exitCode = main();
