import { execFileSync } from 'node:child_process';

export type CliOptions = {
  repo: string;
  outFile: string;
};

export type RepoActionsPermissionsResponse = {
  enabled: boolean;
  allowed_actions: string;
  sha_pinning_required: boolean;
};

export type UserActionsBillingResponse = Record<string, unknown>;

export type CommandResult = {
  ok: boolean;
  output?: string;
  error?: string;
};

export type JsonResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export const DEFAULT_CONSUMER_CI_AUTH_OUT_FILE =
  '.audit-reports/consumer-triage/consumer-ci-auth-check.md';
export const REQUIRED_CONSUMER_CI_AUTH_SCOPES = ['repo', 'workflow', 'user'] as const;

export const parseConsumerCiAuthArgs = (
  args: ReadonlyArray<string>
): CliOptions => {
  const options: CliOptions = {
    repo: '',
    outFile: DEFAULT_CONSUMER_CI_AUTH_OUT_FILE,
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

export const runGh = (args: ReadonlyArray<string>): string => {
  return execFileSync('gh', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
};

export const tryRunGh = (args: ReadonlyArray<string>): CommandResult => {
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

export const tryRunGhJson = <T>(args: ReadonlyArray<string>): JsonResult<T> => {
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

export const parseAuthScopes = (
  authStatusOutput: string
): ReadonlyArray<string> => {
  const scopesLine = authStatusOutput
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('- Token scopes:'));

  if (!scopesLine) {
    return [];
  }

  const raw = scopesLine.replace('- Token scopes:', '').trim();
  const normalized = raw.replace(/'/g, '');
  return normalized
    .split(',')
    .map((scope) => scope.trim())
    .filter((scope) => scope.length > 0);
};

export const buildConsumerCiAuthMarkdown = (params: {
  options: CliOptions;
  authStatus: CommandResult;
  scopes: ReadonlyArray<string>;
  missingScopes: ReadonlyArray<string>;
  actionsPermissions: JsonResult<RepoActionsPermissionsResponse>;
  billing: JsonResult<UserActionsBillingResponse>;
  verdict: 'READY' | 'BLOCKED';
}): string => {
  const lines: string[] = [];
  const now = new Date().toISOString();

  lines.push('# Consumer CI Auth Check');
  lines.push('');
  lines.push(`- generated_at: ${now}`);
  lines.push(`- target_repo: \`${params.options.repo}\``);
  lines.push(`- required_scopes: ${REQUIRED_CONSUMER_CI_AUTH_SCOPES.join(', ')}`);
  lines.push(
    `- detected_scopes: ${params.scopes.length > 0 ? params.scopes.join(', ') : '(none)'}`
  );
  lines.push(
    `- missing_scopes: ${params.missingScopes.length > 0 ? params.missingScopes.join(', ') : '(none)'}`
  );
  lines.push(`- verdict: ${params.verdict}`);
  lines.push('');

  lines.push('## GH Auth Status');
  lines.push('');
  if (params.authStatus.ok) {
    lines.push('```text');
    lines.push((params.authStatus.output ?? '').trimEnd());
    lines.push('```');
  } else {
    lines.push(`- error: ${params.authStatus.error}`);
  }
  lines.push('');

  lines.push('## Repository Actions Permissions Probe');
  lines.push('');
  if (params.actionsPermissions.ok && params.actionsPermissions.data) {
    lines.push('```json');
    lines.push(JSON.stringify(params.actionsPermissions.data, null, 2));
    lines.push('```');
  } else {
    lines.push(`- error: ${params.actionsPermissions.error}`);
  }
  lines.push('');

  lines.push('## Billing Probe');
  lines.push('');
  if (params.billing.ok && params.billing.data) {
    lines.push('```json');
    lines.push(JSON.stringify(params.billing.data, null, 2));
    lines.push('```');
  } else {
    lines.push(`- error: ${params.billing.error}`);
  }
  lines.push('');

  lines.push('## Remediation');
  lines.push('');
  if (params.verdict === 'READY') {
    lines.push('- No remediation required.');
  } else {
    if (!params.authStatus.ok) {
      lines.push('- Authenticate GitHub CLI: `gh auth login`');
    }
    if (params.missingScopes.includes('user')) {
      lines.push('- Refresh auth adding `user` scope: `gh auth refresh -h github.com -s user`');
    }
    if (!params.actionsPermissions.ok) {
      lines.push(
        '- Verify repository Actions settings endpoint: `gh api repos/<owner>/<repo>/actions/permissions`'
      );
    }
    if (!params.billing.ok) {
      lines.push(
        '- Re-run billing probe after scope refresh: `gh api users/<owner>/settings/billing/actions`'
      );
    }
  }
  lines.push('');

  return `${lines.join('\n')}\n`;
};
