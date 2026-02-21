import { execFileSync as runBinarySync } from 'node:child_process';
import type {
  CommandResult,
  JsonResult,
} from './consumer-ci-auth-check-contract';

export const runGh = (args: ReadonlyArray<string>): string => {
  return runBinarySync('gh', args, {
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
