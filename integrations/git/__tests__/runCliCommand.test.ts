import assert from 'node:assert/strict';
import test from 'node:test';
import { runCliCommand } from '../runCliCommand';

const flushAsync = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
};

test('runCliCommand finaliza con el codigo retornado por el runner', async () => {
  const exitCodes: number[] = [];
  const originalExit = process.exit;
  const mutableProcess = process as typeof process & {
    exit(code?: number): never;
  };
  mutableProcess.exit = ((code?: number): never => {
    exitCodes.push(code ?? 0);
    return undefined as never;
  }) as typeof process.exit;

  try {
    runCliCommand(async () => 7);
    await flushAsync();
  } finally {
    mutableProcess.exit = originalExit;
  }

  assert.deepEqual(exitCodes, [7]);
});

test('runCliCommand reporta mensaje de Error y finaliza con codigo 1 cuando el runner falla', async () => {
  const exitCodes: number[] = [];
  const errors: string[] = [];
  const originalExit = process.exit;
  const originalError = console.error;
  const mutableProcess = process as typeof process & {
    exit(code?: number): never;
  };
  mutableProcess.exit = ((code?: number): never => {
    exitCodes.push(code ?? 0);
    return undefined as never;
  }) as typeof process.exit;
  console.error = (...args: unknown[]): void => {
    errors.push(args.map((value) => String(value)).join(' '));
  };

  try {
    runCliCommand(async () => {
      throw new Error('runner failed');
    });
    await flushAsync();
  } finally {
    mutableProcess.exit = originalExit;
    console.error = originalError;
  }

  assert.deepEqual(errors, ['runner failed']);
  assert.deepEqual(exitCodes, [1]);
});

test('runCliCommand usa mensaje generico para errores no tipados y finaliza con codigo 1', async () => {
  const exitCodes: number[] = [];
  const errors: string[] = [];
  const originalExit = process.exit;
  const originalError = console.error;
  const mutableProcess = process as typeof process & {
    exit(code?: number): never;
  };
  mutableProcess.exit = ((code?: number): never => {
    exitCodes.push(code ?? 0);
    return undefined as never;
  }) as typeof process.exit;
  console.error = (...args: unknown[]): void => {
    errors.push(args.map((value) => String(value)).join(' '));
  };

  try {
    runCliCommand(async () => {
      throw 'non-error';
    });
    await flushAsync();
  } finally {
    mutableProcess.exit = originalExit;
    console.error = originalError;
  }

  assert.deepEqual(errors, ['Unexpected CLI runner error.']);
  assert.deepEqual(exitCodes, [1]);
});
