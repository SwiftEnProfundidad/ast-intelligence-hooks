import assert from 'node:assert/strict';
import test from 'node:test';
import { runCliCommand } from '../runCliCommand';

const flushAsync = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
};

test('runCliCommand fija process.exitCode con el código retornado por el runner', async () => {
  const originalExitCode = process.exitCode;

  try {
    process.exitCode = undefined;
    runCliCommand(async () => 7);
    await flushAsync();
    assert.equal(process.exitCode, 7);
  } finally {
    process.exitCode = originalExitCode;
  }
});

test('runCliCommand escribe error en stderr y fija process.exitCode=1 cuando el runner falla', async () => {
  const errors: string[] = [];
  const originalExitCode = process.exitCode;
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = ((chunk: unknown): boolean => {
    errors.push(String(chunk).trimEnd());
    return true;
  }) as typeof process.stderr.write;

  try {
    process.exitCode = undefined;
    runCliCommand(async () => {
      throw new Error('runner failed');
    });
    await flushAsync();
    assert.deepEqual(errors, ['runner failed']);
    assert.equal(process.exitCode, 1);
  } finally {
    process.stderr.write = originalStderrWrite;
    process.exitCode = originalExitCode;
  }
});

test('runCliCommand usa mensaje genérico para errores no tipados y fija process.exitCode=1', async () => {
  const errors: string[] = [];
  const originalExitCode = process.exitCode;
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = ((chunk: unknown): boolean => {
    errors.push(String(chunk).trimEnd());
    return true;
  }) as typeof process.stderr.write;

  try {
    process.exitCode = undefined;
    runCliCommand(async () => {
      throw 'non-error';
    });
    await flushAsync();
    assert.deepEqual(errors, ['Unexpected CLI runner error.']);
    assert.equal(process.exitCode, 1);
  } finally {
    process.stderr.write = originalStderrWrite;
    process.exitCode = originalExitCode;
  }
});
