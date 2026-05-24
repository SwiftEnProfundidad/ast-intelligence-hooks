import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Finding } from '../../core/gate/Finding';
import type { IGitService } from '../git/GitService';
import { hasAllowedExtension } from '../git/gitDiffUtils';
import { DEFAULT_FACT_FILE_EXTENSIONS } from '../git/runPlatformGateFacts';

export type PreWriteLease = {
  version: '1';
  kind: 'pumuki-pre-write-lease';
  validation_mode?: 'clean-prewrite' | 'validated-diff';
  repo_root: string;
  head: string;
  branch: string | null;
  issued_at: string;
  expires_at: string;
  pre_change_code_changes_count: number;
  pre_change_code_paths: string[];
};

export type PreWriteLeaseStatus =
  | {
      valid: true;
      code: 'PRE_WRITE_LEASE_VALID';
      path: string;
      lease: PreWriteLease;
      changedCodePaths: string[];
    }
  | {
      valid: false;
      code:
        | 'PRE_WRITE_LEASE_MISSING'
        | 'PRE_WRITE_LEASE_INVALID'
        | 'PRE_WRITE_LEASE_EXPIRED'
        | 'PRE_WRITE_LEASE_HEAD_MISMATCH'
        | 'PRE_WRITE_LEASE_DIRTY_AT_ISSUE';
      path: string;
      message: string;
      changedCodePaths: string[];
      lease?: PreWriteLease;
    };

export type PreWriteLeaseWriteResult = {
  path: string;
  written: boolean;
  valid: boolean;
  code: 'PRE_WRITE_LEASE_WRITTEN' | 'PRE_WRITE_LEASE_NOT_WRITTEN_DIRTY_CODE';
  message: string;
  lease?: PreWriteLease;
  changedCodePaths: string[];
};

const PRE_WRITE_LEASE_TTL_MS = 4 * 60 * 60 * 1000;

export const resolvePreWriteLeasePath = (repoRoot: string): string =>
  join(repoRoot, '.pumuki', 'prewrite-lease.json');

const runGitOrEmpty = (
  git: Pick<IGitService, 'runGit'>,
  repoRoot: string,
  args: ReadonlyArray<string>
): string => {
  try {
    return git.runGit([...args], repoRoot);
  } catch {
    return '';
  }
};

const collectCodePathsFromOutput = (output: string): string[] =>
  output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => hasAllowedExtension(line, DEFAULT_FACT_FILE_EXTENSIONS));

export const collectPreWriteCodeChangePaths = (params: {
  repoRoot: string;
  git: Pick<IGitService, 'runGit'>;
}): string[] => {
  const paths = new Set<string>();
  for (const output of [
    runGitOrEmpty(params.git, params.repoRoot, ['diff', '--name-only']),
    runGitOrEmpty(params.git, params.repoRoot, ['diff', '--cached', '--name-only']),
    runGitOrEmpty(params.git, params.repoRoot, ['ls-files', '--others', '--exclude-standard']),
  ]) {
    for (const path of collectCodePathsFromOutput(output)) {
      paths.add(path);
    }
  }
  return [...paths].sort((left, right) => left.localeCompare(right));
};

const resolveHead = (params: {
  repoRoot: string;
  git: Pick<IGitService, 'runGit'>;
}): string => runGitOrEmpty(params.git, params.repoRoot, ['rev-parse', 'HEAD']).trim();

const resolveBranch = (params: {
  repoRoot: string;
  git: Pick<IGitService, 'runGit'>;
}): string | null => {
  const branch = runGitOrEmpty(params.git, params.repoRoot, ['rev-parse', '--abbrev-ref', 'HEAD']).trim();
  return branch.length === 0 || branch === 'HEAD' ? null : branch;
};

const parseLease = (raw: string): PreWriteLease | undefined => {
  try {
    const value = JSON.parse(raw) as Partial<PreWriteLease>;
    if (
      value.version === '1' &&
      value.kind === 'pumuki-pre-write-lease' &&
      typeof value.repo_root === 'string' &&
      typeof value.head === 'string' &&
      typeof value.issued_at === 'string' &&
      typeof value.expires_at === 'string' &&
      typeof value.pre_change_code_changes_count === 'number' &&
      Array.isArray(value.pre_change_code_paths)
    ) {
      return {
        version: '1',
        kind: 'pumuki-pre-write-lease',
        validation_mode:
          value.validation_mode === 'validated-diff' || value.validation_mode === 'clean-prewrite'
            ? value.validation_mode
            : undefined,
        repo_root: value.repo_root,
        head: value.head,
        branch: typeof value.branch === 'string' ? value.branch : null,
        issued_at: value.issued_at,
        expires_at: value.expires_at,
        pre_change_code_changes_count: value.pre_change_code_changes_count,
        pre_change_code_paths: value.pre_change_code_paths.filter(
          (item): item is string => typeof item === 'string'
        ),
      };
    }
  } catch {
    return undefined;
  }
  return undefined;
};

export const readPreWriteLeaseStatus = (params: {
  repoRoot: string;
  git: Pick<IGitService, 'runGit'>;
  now?: Date;
}): PreWriteLeaseStatus => {
  const path = resolvePreWriteLeasePath(params.repoRoot);
  const changedCodePaths = collectPreWriteCodeChangePaths(params);
  if (!existsSync(path)) {
    return {
      valid: false,
      code: 'PRE_WRITE_LEASE_MISSING',
      path,
      changedCodePaths,
      message: 'No valid PRE_WRITE lease exists for this code diff.',
    };
  }

  const lease = parseLease(readFileSync(path, 'utf8'));
  if (!lease) {
    return {
      valid: false,
      code: 'PRE_WRITE_LEASE_INVALID',
      path,
      changedCodePaths,
      message: 'PRE_WRITE lease is invalid or unreadable.',
    };
  }

  if (Date.parse(lease.expires_at) <= (params.now ?? new Date()).getTime()) {
    return {
      valid: false,
      code: 'PRE_WRITE_LEASE_EXPIRED',
      path,
      lease,
      changedCodePaths,
      message: 'PRE_WRITE lease has expired.',
    };
  }

  if (lease.validation_mode === 'validated-diff') {
    const expectedPaths = [...lease.pre_change_code_paths].sort((left, right) => left.localeCompare(right));
    const currentPaths = [...changedCodePaths].sort((left, right) => left.localeCompare(right));
    if (
      lease.pre_change_code_changes_count !== expectedPaths.length ||
      expectedPaths.length !== currentPaths.length ||
      expectedPaths.some((path, index) => path !== currentPaths[index])
    ) {
      return {
        valid: false,
        code: 'PRE_WRITE_LEASE_DIRTY_AT_ISSUE',
        path,
        lease,
        changedCodePaths,
        message: 'PRE_WRITE lease was issued for a different validated code diff.',
      };
    }

    return {
      valid: true,
      code: 'PRE_WRITE_LEASE_VALID',
      path,
      lease,
      changedCodePaths,
    };
  }

  if (lease.head !== resolveHead(params)) {
    return {
      valid: false,
      code: 'PRE_WRITE_LEASE_HEAD_MISMATCH',
      path,
      lease,
      changedCodePaths,
      message: 'PRE_WRITE lease was issued for a different HEAD.',
    };
  }

  if (lease.pre_change_code_changes_count !== 0 || lease.pre_change_code_paths.length !== 0) {
    return {
      valid: false,
      code: 'PRE_WRITE_LEASE_DIRTY_AT_ISSUE',
      path,
      lease,
      changedCodePaths,
      message: 'PRE_WRITE lease was issued after code changes already existed.',
    };
  }

  return {
    valid: true,
    code: 'PRE_WRITE_LEASE_VALID',
    path,
    lease,
    changedCodePaths,
  };
};

export const writePreWriteLease = (params: {
  repoRoot: string;
  git: Pick<IGitService, 'runGit'>;
  now?: Date;
  allowExistingCodeChanges?: boolean;
}): PreWriteLeaseWriteResult => {
  const path = resolvePreWriteLeasePath(params.repoRoot);
  const changedCodePaths = collectPreWriteCodeChangePaths(params);
  if (changedCodePaths.length > 0 && !params.allowExistingCodeChanges) {
    return {
      path,
      written: false,
      valid: false,
      code: 'PRE_WRITE_LEASE_NOT_WRITTEN_DIRTY_CODE',
      changedCodePaths,
      message:
        `PRE_WRITE lease not written because code changes already exist: ${changedCodePaths.join(', ')}`,
    };
  }

  const issuedAt = params.now ?? new Date();
  const lease: PreWriteLease = {
    version: '1',
    kind: 'pumuki-pre-write-lease',
    validation_mode: changedCodePaths.length > 0 ? 'validated-diff' : 'clean-prewrite',
    repo_root: params.repoRoot,
    head: resolveHead(params),
    branch: resolveBranch(params),
    issued_at: issuedAt.toISOString(),
    expires_at: new Date(issuedAt.getTime() + PRE_WRITE_LEASE_TTL_MS).toISOString(),
    pre_change_code_changes_count: changedCodePaths.length,
    pre_change_code_paths: changedCodePaths,
  };
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(lease, null, 2)}\n`, 'utf8');
  return {
    path,
    written: true,
    valid: true,
    code: 'PRE_WRITE_LEASE_WRITTEN',
    changedCodePaths,
    message:
      changedCodePaths.length > 0
        ? 'PRE_WRITE lease written for validated code diff.'
        : 'PRE_WRITE lease written for clean code state.',
    lease,
  };
};

export const toPreWriteEnforcementGapFinding = (params: {
  stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
  status: PreWriteLeaseStatus;
}): Finding | undefined => {
  if (params.status.valid || params.status.changedCodePaths.length === 0) {
    return undefined;
  }
  return {
    ruleId: 'governance.prewrite.enforcement-gap',
    severity: 'ERROR',
    code: 'ENFORCEMENT_GAP_PRE_WRITE_LEASE_MISSING',
    message:
      `PRE_WRITE hard-stop lease is not valid at ${params.stage}: ${params.status.code}. ` +
      'User action: run `npx pumuki-pre-write` before editing code, then rerun the gate. ' +
      'AI agent instruction: STOP; do not edit files until a valid PRE_WRITE lease exists for this repo and diff.',
    expected_fix:
      'User: run `npx pumuki-pre-write` or `npx pumuki sdd validate --stage=PRE_WRITE --json` before editing. ' +
      'AI agent: stop immediately, do not apply patches or write files, and continue only after the command produces a valid clean or validated-diff PRE_WRITE lease.',
    filePath: '.pumuki/prewrite-lease.json',
    matchedBy: 'PreWriteLeaseGuard',
    source: 'prewrite-lease',
  };
};
