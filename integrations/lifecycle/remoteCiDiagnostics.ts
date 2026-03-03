import { spawnSync } from 'node:child_process';

export type RemoteCiCheckState = 'PENDING' | 'SUCCESS' | 'FAILURE' | 'ERROR' | 'SKIPPING' | string;

export type RemoteCiCheck = {
  name: string;
  state: RemoteCiCheckState;
  bucket?: string;
  link?: string;
  description?: string;
};

export type RemoteCiBlockerCode = 'REMOTE_CI_BILLING_LOCK' | 'REMOTE_CI_PROVIDER_QUOTA';

export type RemoteCiBlocker = {
  code: RemoteCiBlockerCode;
  severity: 'error';
  message: string;
  remediation: string;
  affectedChecks: ReadonlyArray<string>;
  evidence: ReadonlyArray<string>;
};

export type RemoteCiDiagnosticsStatus = 'healthy' | 'blocked' | 'skipped' | 'degraded';

export type RemoteCiDiagnostics = {
  enabled: boolean;
  provider: 'github';
  status: RemoteCiDiagnosticsStatus;
  repoRoot: string;
  checkedAt: string;
  branch?: string;
  pr?: {
    number: number;
    url: string;
    headRefName: string;
  };
  checks: {
    total: number;
    failing: number;
  };
  blockers: ReadonlyArray<RemoteCiBlocker>;
  reason?: string;
};

export type RemoteCiCommandResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export type RunRemoteCiCommand = (params: {
  cwd: string;
  command: string;
  args: ReadonlyArray<string>;
}) => RemoteCiCommandResult;

const BILLING_SIGNATURES: ReadonlyArray<RegExp> = [
  /account is locked due to a billing issue/i,
  /locked due to a billing issue/i,
  /billing issue/i,
];

const QUOTA_SIGNATURES: ReadonlyArray<RegExp> = [
  /used your limit of private tests/i,
  /quota/i,
  /out of credits/i,
  /rate limit/i,
  /payment required/i,
  /credits exhausted/i,
  /exceeded.*(quota|limit)/i,
];

const normalizeEvidence = (value: string): string => value.trim().replace(/\s+/g, ' ');

const isFailingCheck = (check: RemoteCiCheck): boolean => {
  const normalizedState = String(check.state ?? '').toUpperCase();
  const normalizedBucket = String(check.bucket ?? '').toLowerCase();
  if (normalizedBucket === 'fail') {
    return true;
  }
  return normalizedState === 'FAILURE' || normalizedState === 'ERROR' || normalizedState === 'TIMED_OUT';
};

type BlockerAccumulator = {
  checks: Set<string>;
  evidence: Set<string>;
};

const appendBlockerSignal = (params: {
  accumulator: Map<RemoteCiBlockerCode, BlockerAccumulator>;
  code: RemoteCiBlockerCode;
  checkName: string;
  evidence: string;
}): void => {
  const current = params.accumulator.get(params.code) ?? {
    checks: new Set<string>(),
    evidence: new Set<string>(),
  };
  current.checks.add(params.checkName);
  current.evidence.add(normalizeEvidence(params.evidence));
  params.accumulator.set(params.code, current);
};

export const detectRemoteCiBlockers = (
  checks: ReadonlyArray<RemoteCiCheck>
): ReadonlyArray<RemoteCiBlocker> => {
  const failingChecks = checks.filter(isFailingCheck);
  const blockers = new Map<RemoteCiBlockerCode, BlockerAccumulator>();

  for (const check of failingChecks) {
    const checkName = check.name.trim().length > 0 ? check.name.trim() : 'unnamed-check';
    const description = check.description ?? '';
    const searchable = `${checkName}\n${description}\n${check.state ?? ''}\n${check.bucket ?? ''}`;

    for (const signature of BILLING_SIGNATURES) {
      if (!signature.test(searchable)) {
        continue;
      }
      appendBlockerSignal({
        accumulator: blockers,
        code: 'REMOTE_CI_BILLING_LOCK',
        checkName,
        evidence: `${checkName}: ${description || 'missing description'}`,
      });
    }

    for (const signature of QUOTA_SIGNATURES) {
      if (!signature.test(searchable)) {
        continue;
      }
      appendBlockerSignal({
        accumulator: blockers,
        code: 'REMOTE_CI_PROVIDER_QUOTA',
        checkName,
        evidence: `${checkName}: ${description || 'missing description'}`,
      });
    }
  }

  const rendered: RemoteCiBlocker[] = [];

  if (blockers.has('REMOTE_CI_BILLING_LOCK')) {
    const payload = blockers.get('REMOTE_CI_BILLING_LOCK');
    rendered.push({
      code: 'REMOTE_CI_BILLING_LOCK',
      severity: 'error',
      message: 'Remote CI blocked by billing/account lock before running real jobs.',
      remediation:
        'Resolve billing lock at GitHub account/organization level and rerun checks.',
      affectedChecks: payload ? [...payload.checks].sort((left, right) => left.localeCompare(right)) : [],
      evidence: payload ? [...payload.evidence].sort((left, right) => left.localeCompare(right)) : [],
    });
  }

  if (blockers.has('REMOTE_CI_PROVIDER_QUOTA')) {
    const payload = blockers.get('REMOTE_CI_PROVIDER_QUOTA');
    rendered.push({
      code: 'REMOTE_CI_PROVIDER_QUOTA',
      severity: 'error',
      message: 'Remote CI blocked by external provider quota/credits limit.',
      remediation:
        'Restore provider quota/credits (for example Snyk private checks) and rerun checks.',
      affectedChecks: payload ? [...payload.checks].sort((left, right) => left.localeCompare(right)) : [],
      evidence: payload ? [...payload.evidence].sort((left, right) => left.localeCompare(right)) : [],
    });
  }

  return rendered;
};

const parseChecksPayload = (raw: string): RemoteCiCheck[] => {
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('Invalid gh pr checks payload: expected array.');
  }
  return parsed
    .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
    .map((entry) => ({
      name: String(entry.name ?? ''),
      state: String(entry.state ?? ''),
      bucket: typeof entry.bucket === 'string' ? entry.bucket : undefined,
      link: typeof entry.link === 'string' ? entry.link : undefined,
      description: typeof entry.description === 'string' ? entry.description : undefined,
    }));
};

type RemoteCiPrPayload = {
  number: number;
  url: string;
  headRefName: string;
};

const parsePrPayload = (raw: string): RemoteCiPrPayload => {
  const parsed = JSON.parse(raw) as {
    number?: unknown;
    url?: unknown;
    headRefName?: unknown;
  };
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof parsed.number !== 'number' ||
    typeof parsed.url !== 'string' ||
    typeof parsed.headRefName !== 'string'
  ) {
    throw new Error('Invalid gh pr view payload.');
  }
  return {
    number: parsed.number,
    url: parsed.url,
    headRefName: parsed.headRefName,
  };
};

const defaultRunRemoteCiCommand: RunRemoteCiCommand = (params) => {
  const result = spawnSync(params.command, [...params.args], {
    cwd: params.cwd,
    encoding: 'utf8',
  });
  return {
    exitCode: typeof result.status === 'number' ? result.status : 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
};

const readCurrentBranch = (params: {
  repoRoot: string;
  runCommand: RunRemoteCiCommand;
}): string | undefined => {
  const response = params.runCommand({
    cwd: params.repoRoot,
    command: 'git',
    args: ['rev-parse', '--abbrev-ref', 'HEAD'],
  });
  if (response.exitCode !== 0) {
    return undefined;
  }
  const branch = response.stdout.trim();
  return branch.length === 0 ? undefined : branch;
};

export const collectRemoteCiDiagnostics = (params: {
  repoRoot: string;
  runCommand?: RunRemoteCiCommand;
  now?: () => Date;
}): RemoteCiDiagnostics => {
  const runCommand = params.runCommand ?? defaultRunRemoteCiCommand;
  const now = params.now ?? (() => new Date());
  const base: Omit<RemoteCiDiagnostics, 'status' | 'checks' | 'blockers'> = {
    enabled: true,
    provider: 'github',
    repoRoot: params.repoRoot,
    checkedAt: now().toISOString(),
    branch: readCurrentBranch({
      repoRoot: params.repoRoot,
      runCommand,
    }),
  };

  const ghVersion = runCommand({
    cwd: params.repoRoot,
    command: 'gh',
    args: ['--version'],
  });
  if (ghVersion.exitCode !== 0) {
    return {
      ...base,
      status: 'skipped',
      checks: {
        total: 0,
        failing: 0,
      },
      blockers: [],
      reason: 'gh_unavailable',
    };
  }

  const prResponse = runCommand({
    cwd: params.repoRoot,
    command: 'gh',
    args: ['pr', 'view', '--json', 'number,url,headRefName'],
  });
  if (prResponse.exitCode !== 0) {
    const merged = `${prResponse.stdout}\n${prResponse.stderr}`.toLowerCase();
    if (merged.includes('no pull requests found')) {
      return {
        ...base,
        status: 'skipped',
        checks: {
          total: 0,
          failing: 0,
        },
        blockers: [],
        reason: 'no_open_pr_for_branch',
      };
    }
    return {
      ...base,
      status: 'degraded',
      checks: {
        total: 0,
        failing: 0,
      },
      blockers: [],
      reason: 'pr_lookup_failed',
    };
  }

  let pr: RemoteCiDiagnostics['pr'];
  try {
    pr = parsePrPayload(prResponse.stdout);
  } catch {
    return {
      ...base,
      status: 'degraded',
      checks: {
        total: 0,
        failing: 0,
      },
      blockers: [],
      reason: 'pr_payload_invalid',
    };
  }

  const checksResponse = runCommand({
    cwd: params.repoRoot,
    command: 'gh',
    args: [
      'pr',
      'checks',
      String(pr.number),
      '--json',
      'name,state,bucket,link,description',
    ],
  });

  if (checksResponse.exitCode !== 0) {
    return {
      ...base,
      pr,
      status: 'degraded',
      checks: {
        total: 0,
        failing: 0,
      },
      blockers: [],
      reason: 'checks_lookup_failed',
    };
  }

  let checks: RemoteCiCheck[] = [];
  try {
    checks = parseChecksPayload(checksResponse.stdout);
  } catch {
    return {
      ...base,
      pr,
      status: 'degraded',
      checks: {
        total: 0,
        failing: 0,
      },
      blockers: [],
      reason: 'checks_payload_invalid',
    };
  }

  const blockers = detectRemoteCiBlockers(checks);
  const failing = checks.filter(isFailingCheck).length;
  return {
    ...base,
    pr,
    status: blockers.length > 0 ? 'blocked' : 'healthy',
    checks: {
      total: checks.length,
      failing,
    },
    blockers,
  };
};
