import { spawnSync as runSpawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { OpenSpecValidationSummary } from './types';

export const OPENSPEC_NPM_PACKAGE_NAME = '@fission-ai/openspec';
export const OPENSPEC_COMPATIBILITY_MATRIX = {
  packageName: OPENSPEC_NPM_PACKAGE_NAME,
  minimumVersion: '1.1.1',
  recommendedVersion: '1.1.1',
} as const;

type OpenSpecCommandResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

const resolveOpenSpecBinary = (repoRoot: string): string => {
  const binaryName = process.platform === 'win32' ? 'openspec.cmd' : 'openspec';
  const localBinaryPath = join(repoRoot, 'node_modules', '.bin', binaryName);
  if (existsSync(localBinaryPath)) {
    return localBinaryPath;
  }
  return 'openspec';
};

const runOpenSpecCommand = (
  args: ReadonlyArray<string>,
  cwd: string
): OpenSpecCommandResult => {
  const result = runSpawnSync(resolveOpenSpecBinary(cwd), [...args], {
    cwd,
    encoding: 'utf8',
  });
  return {
    exitCode: typeof result.status === 'number' ? result.status : 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
};

const extractSemver = (raw: string | undefined): string | undefined => {
  if (typeof raw !== 'string') {
    return undefined;
  }
  const match = raw.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return undefined;
  }
  return `${match[1]}.${match[2]}.${match[3]}`;
};

const compareSemver = (left: string, right: string): number => {
  const leftParts = left.split('.').map((value) => Number.parseInt(value, 10));
  const rightParts = right.split('.').map((value) => Number.parseInt(value, 10));
  for (let index = 0; index < 3; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;
    if (leftPart > rightPart) {
      return 1;
    }
    if (leftPart < rightPart) {
      return -1;
    }
  }
  return 0;
};

export type OpenSpecCompatibilityStatus = {
  minimumVersion: string;
  recommendedVersion: string;
  detectedVersion?: string;
  parsedVersion?: string;
  compatible: boolean;
};

export const evaluateOpenSpecCompatibility = (params: {
  installed: boolean;
  version?: string;
}): OpenSpecCompatibilityStatus => {
  const parsedVersion = extractSemver(params.version);
  if (!params.installed || !parsedVersion) {
    return {
      minimumVersion: OPENSPEC_COMPATIBILITY_MATRIX.minimumVersion,
      recommendedVersion: OPENSPEC_COMPATIBILITY_MATRIX.recommendedVersion,
      detectedVersion: params.version,
      parsedVersion,
      compatible: false,
    };
  }

  return {
    minimumVersion: OPENSPEC_COMPATIBILITY_MATRIX.minimumVersion,
    recommendedVersion: OPENSPEC_COMPATIBILITY_MATRIX.recommendedVersion,
    detectedVersion: params.version,
    parsedVersion,
    compatible:
      compareSemver(parsedVersion, OPENSPEC_COMPATIBILITY_MATRIX.minimumVersion) >= 0,
  };
};

const parseValidationJson = (stdout: string): {
  totals: { items: number; failed: number; passed: number };
  issues: { errors: number; warnings: number; infos: number };
} => {
  try {
    const parsed: unknown = JSON.parse(stdout);
    const summary = (parsed as { summary?: unknown }).summary;
    const totals = (summary as { totals?: unknown })?.totals as
      | { items?: unknown; failed?: unknown; passed?: unknown }
      | undefined;
    const byLevel = (summary as { byLevel?: unknown })?.byLevel as
      | { ERROR?: unknown; WARNING?: unknown; INFO?: unknown }
      | undefined;

    return {
      totals: {
        items: Number(totals?.items ?? 0) || 0,
        failed: Number(totals?.failed ?? 0) || 0,
        passed: Number(totals?.passed ?? 0) || 0,
      },
      issues: {
        errors: Number(byLevel?.ERROR ?? 0) || 0,
        warnings: Number(byLevel?.WARNING ?? 0) || 0,
        infos: Number(byLevel?.INFO ?? 0) || 0,
      },
    };
  } catch {
    return {
      totals: {
        items: 0,
        failed: 0,
        passed: 0,
      },
      issues: {
        errors: 0,
        warnings: 0,
        infos: 0,
      },
    };
  }
};

export const detectOpenSpecInstallation = (
  repoRoot: string
): { installed: boolean; version?: string } => {
  const result = runOpenSpecCommand(['--version'], repoRoot);
  if (result.exitCode !== 0) {
    return {
      installed: false,
    };
  }
  return {
    installed: true,
    version: result.stdout.trim() || undefined,
  };
};

export const isOpenSpecProjectInitialized = (repoRoot: string): boolean =>
  existsSync(resolve(repoRoot, 'openspec'));

export const validateOpenSpecChanges = (
  repoRoot: string
): OpenSpecValidationSummary => {
  const result = runOpenSpecCommand(
    ['validate', '--changes', '--json', '--no-interactive'],
    repoRoot
  );
  const parsed = parseValidationJson(result.stdout);
  const hasErrors = parsed.totals.failed > 0 || parsed.issues.errors > 0;
  return {
    ok: result.exitCode === 0 && !hasErrors,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
    totals: parsed.totals,
    issues: parsed.issues,
  };
};
