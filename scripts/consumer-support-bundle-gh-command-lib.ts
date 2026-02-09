import { execFileSync } from 'node:child_process';

export type ConsumerSupportBundleGhResult<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export const runGh = (args: ReadonlyArray<string>): string => {
  return execFileSync('gh', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
};

export const normalizeGhError = (error: unknown, fallback: string): string => {
  if (error instanceof Error) {
    return error.message.replace(/\s+/g, ' ').trim();
  }
  return fallback;
};

export const tryRunGh = (
  args: ReadonlyArray<string>
): { ok: boolean; output?: string; error?: string } => {
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

export const tryRunGhJson = <T>(args: ReadonlyArray<string>): ConsumerSupportBundleGhResult<T> => {
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

export const runGhJson = <T>(args: ReadonlyArray<string>): T => {
  return JSON.parse(runGh(args)) as T;
};
