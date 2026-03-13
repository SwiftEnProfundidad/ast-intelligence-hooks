import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePreWriteEnforcement } from '../preWriteEnforcement';

const withPreWriteEnforcementEnv = async <T>(
  value: string | undefined,
  callback: () => Promise<T> | T
): Promise<T> => {
  const previous = process.env.PUMUKI_PREWRITE_ENFORCEMENT;
  if (typeof value === 'undefined') {
    delete process.env.PUMUKI_PREWRITE_ENFORCEMENT;
  } else {
    process.env.PUMUKI_PREWRITE_ENFORCEMENT = value;
  }
  try {
    return await callback();
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env.PUMUKI_PREWRITE_ENFORCEMENT;
    } else {
      process.env.PUMUKI_PREWRITE_ENFORCEMENT = previous;
    }
  }
};

test('resolvePreWriteEnforcement defaults to advisory mode', async () => {
  await withPreWriteEnforcementEnv(undefined, () => {
    const resolved = resolvePreWriteEnforcement();

    assert.deepEqual(resolved, {
      mode: 'advisory',
      source: 'default',
      blocking: false,
    });
  });
});

test('resolvePreWriteEnforcement reads strict mode from environment', async () => {
  await withPreWriteEnforcementEnv('strict', () => {
    const resolved = resolvePreWriteEnforcement();

    assert.deepEqual(resolved, {
      mode: 'strict',
      source: 'env',
      blocking: true,
    });
  });
});

test('resolvePreWriteEnforcement falls back to advisory on invalid environment value', async () => {
  await withPreWriteEnforcementEnv('surprise', () => {
    const resolved = resolvePreWriteEnforcement();

    assert.deepEqual(resolved, {
      mode: 'advisory',
      source: 'default',
      blocking: false,
    });
  });
});
