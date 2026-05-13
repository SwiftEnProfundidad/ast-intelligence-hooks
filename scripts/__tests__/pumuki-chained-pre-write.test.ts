import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const {
  runChainedPreWriteIfNeeded,
  shouldRunChainedPreWrite,
} = require('../../bin/_chained-pre-write.js') as {
  runChainedPreWriteIfNeeded: (
    runTsEntry: (entry: string, args: string[]) => number,
    env?: Record<string, string | undefined>
  ) => number;
  shouldRunChainedPreWrite: (env?: Record<string, string | undefined>) => boolean;
};

test('pumuki hook binaries run PRE_WRITE before the main stage by default', () => {
  const env: Record<string, string | undefined> = {};
  const calls: Array<{ entry: string; args: string[] }> = [];

  const status = runChainedPreWriteIfNeeded((entry: string, args: string[]) => {
    calls.push({ entry, args });
    return 7;
  }, env);

  assert.equal(status, 7);
  assert.equal(env.PUMUKI_CHAINED_PRE_WRITE_DONE, '1');
  assert.deepEqual(calls, [
    {
      entry: 'integrations/lifecycle/cli.ts',
      args: ['sdd', 'validate', '--stage=PRE_WRITE'],
    },
  ]);
});

test('pumuki hook binaries do not run PRE_WRITE twice when the managed hook already did it', () => {
  const env: Record<string, string | undefined> = {
    PUMUKI_CHAINED_PRE_WRITE_DONE: '1',
  };
  let calls = 0;

  const status = runChainedPreWriteIfNeeded(() => {
    calls += 1;
    return 1;
  }, env);

  assert.equal(status, 0);
  assert.equal(calls, 0);
});

test('pumuki hook binaries preserve explicit PRE_WRITE opt-out', () => {
  assert.equal(
    shouldRunChainedPreWrite({
      PUMUKI_SKIP_CHAINED_PRE_WRITE: '1',
    }),
    false
  );
});
