import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const DEFAULT_ACTIONLINT_BIN = '/tmp/actionlint-bin/actionlint';
export const DEFAULT_CONSUMER_REPO_PATH =
  process.env.PUMUKI_CONSUMER_REPO_PATH?.trim() || '/path/to/consumer-repo';

const runGit = (args: ReadonlyArray<string>): string => {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
};

export const resolveDefaultRangeFrom = (): string => {
  try {
    return runGit(['rev-parse', '@{u}']);
  } catch {
    return 'HEAD~1';
  }
};

export const runAndPrintExitCode = async (run: () => Promise<number>): Promise<void> => {
  const code = await run();
  process.stdout.write(`\nExit code: ${code}\n`);
};

export const resolveScriptOrReportMissing = (relativePath: string): string | undefined => {
  const scriptPath = resolve(process.cwd(), relativePath);
  if (existsSync(scriptPath)) {
    return scriptPath;
  }

  process.stdout.write(`\nCould not find ${relativePath} in current repository.\n`);
  return undefined;
};

export const runNpx = (args: string[]): void => {
  execFileSync('npx', args, {
    stdio: 'inherit',
  });
};

export const runNpm = (args: string[]): void => {
  execFileSync('npm', args, {
    stdio: 'inherit',
  });
};

export const getExitCode = (error: unknown): number => {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = Number((error as { status?: number }).status ?? 1);
    return Number.isFinite(status) ? status : 1;
  }

  return 1;
};

export const printEvidence = (): void => {
  const evidencePath = resolve(process.cwd(), '.ai_evidence.json');
  if (!existsSync(evidencePath)) {
    process.stdout.write('\n.ai_evidence.json not found in repository root.\n');
    return;
  }

  process.stdout.write('\n');
  process.stdout.write(readFileSync(evidencePath, 'utf8'));
  process.stdout.write('\n');
};
