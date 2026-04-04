import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveGitAtomicityEnforcement } from '../gitAtomicityEnforcement';

const withGitAtomicityEnforcementEnv = async <T>(
  value: string | undefined,
  callback: () => Promise<T> | T
): Promise<T> => {
  const previous = process.env.PUMUKI_GIT_ATOMICITY_ENFORCEMENT;
  if (typeof value === 'undefined') {
    delete process.env.PUMUKI_GIT_ATOMICITY_ENFORCEMENT;
  } else {
    process.env.PUMUKI_GIT_ATOMICITY_ENFORCEMENT = value;
  }
  try {
    return await callback();
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env.PUMUKI_GIT_ATOMICITY_ENFORCEMENT;
    } else {
      process.env.PUMUKI_GIT_ATOMICITY_ENFORCEMENT = previous;
    }
  }
};

test('resolveGitAtomicityEnforcement defaults to advisory mode', async () => {
  await withGitAtomicityEnforcementEnv(undefined, () => {
    const resolved = resolveGitAtomicityEnforcement();

    assert.deepEqual(resolved, {
      mode: 'advisory',
      source: 'default',
      blocking: false,
    });
  });
});

test('resolveGitAtomicityEnforcement reads strict mode from environment', async () => {
  await withGitAtomicityEnforcementEnv('strict', () => {
    const resolved = resolveGitAtomicityEnforcement();

    assert.deepEqual(resolved, {
      mode: 'strict',
      source: 'env',
      blocking: true,
    });
  });
});

test('resolveGitAtomicityEnforcement falls back to advisory on invalid environment value', async () => {
  await withGitAtomicityEnforcementEnv('surprise', () => {
    const resolved = resolveGitAtomicityEnforcement();

    assert.deepEqual(resolved, {
      mode: 'advisory',
      source: 'default',
      blocking: false,
    });
  });
});
