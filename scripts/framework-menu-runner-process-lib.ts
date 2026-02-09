import { execFileSync } from 'node:child_process';

export const runAndPrintExitCode = async (run: () => Promise<number>): Promise<void> => {
  const code = await run();
  process.stdout.write(`\nExit code: ${code}\n`);
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
