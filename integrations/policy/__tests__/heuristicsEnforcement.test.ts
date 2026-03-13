import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveHeuristicsEnforcement } from '../heuristicsEnforcement';

const withHeuristicsEnforcementEnv = async <T>(
  value: string | undefined,
  callback: () => Promise<T> | T
): Promise<T> => {
  const previous = process.env.PUMUKI_HEURISTICS_ENFORCEMENT;
  if (typeof value === 'undefined') {
    delete process.env.PUMUKI_HEURISTICS_ENFORCEMENT;
  } else {
    process.env.PUMUKI_HEURISTICS_ENFORCEMENT = value;
  }
  try {
    return await callback();
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env.PUMUKI_HEURISTICS_ENFORCEMENT;
    } else {
      process.env.PUMUKI_HEURISTICS_ENFORCEMENT = previous;
    }
  }
};

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

test('resolveHeuristicsEnforcement defaults to advisory mode', async () => {
  await withHeuristicsEnforcementEnv(undefined, () => {
    const resolved = resolveHeuristicsEnforcement();

    assert.deepEqual(resolved, {
      mode: 'advisory',
      source: 'default',
      blocking: false,
    });
  });
});

test('resolveHeuristicsEnforcement reads strict mode from environment', async () => {
  await withHeuristicsEnforcementEnv('strict', () => {
    const resolved = resolveHeuristicsEnforcement();

    assert.deepEqual(resolved, {
      mode: 'strict',
      source: 'env',
      blocking: true,
    });
  });
});

test('resolveHeuristicsEnforcement falls back to advisory on invalid environment value', async () => {
  await withHeuristicsEnforcementEnv('surprise', () => {
    const resolved = resolveHeuristicsEnforcement();

    assert.deepEqual(resolved, {
      mode: 'advisory',
      source: 'default',
      blocking: false,
    });
  });
});

test('resolveHeuristicsEnforcement inherits strict mode from PRE_WRITE enforcement when explicit heuristics env is absent', async () => {
  await withHeuristicsEnforcementEnv(undefined, async () => {
    await withPreWriteEnforcementEnv('strict', () => {
      const resolved = resolveHeuristicsEnforcement();

      assert.deepEqual(resolved, {
        mode: 'strict',
        source: 'prewrite',
        blocking: true,
      });
    });
  });
});
