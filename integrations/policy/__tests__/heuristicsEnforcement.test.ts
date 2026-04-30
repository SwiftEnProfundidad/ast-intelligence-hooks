import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveHeuristicsEnforcement } from '../heuristicsEnforcement';

const withHeuristicsEnforcementEnv = async <T>(
  value: string | undefined,
  callback: () => Promise<T> | T
): Promise<T> => {
  const previous = process.env.PUMUKI_HEURISTICS_ENFORCEMENT;
  const previousExperimentalHeuristics = process.env.PUMUKI_EXPERIMENTAL_HEURISTICS;
  delete process.env.PUMUKI_EXPERIMENTAL_HEURISTICS;
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
    if (typeof previousExperimentalHeuristics === 'undefined') {
      delete process.env.PUMUKI_EXPERIMENTAL_HEURISTICS;
    } else {
      process.env.PUMUKI_EXPERIMENTAL_HEURISTICS = previousExperimentalHeuristics;
    }
  }
};

const withExperimentalHeuristicsEnv = async <T>(
  value: string | undefined,
  callback: () => Promise<T> | T
): Promise<T> => {
  const previous = process.env.PUMUKI_EXPERIMENTAL_HEURISTICS;
  if (typeof value === 'undefined') {
    delete process.env.PUMUKI_EXPERIMENTAL_HEURISTICS;
  } else {
    process.env.PUMUKI_EXPERIMENTAL_HEURISTICS = value;
  }
  try {
    return await callback();
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env.PUMUKI_EXPERIMENTAL_HEURISTICS;
    } else {
      process.env.PUMUKI_EXPERIMENTAL_HEURISTICS = previous;
    }
  }
};

test('resolveHeuristicsEnforcement defaults to strict mode from enabled heuristics feature', async () => {
  await withHeuristicsEnforcementEnv(undefined, () => {
    const resolved = resolveHeuristicsEnforcement();

    assert.deepEqual(resolved, {
      mode: 'strict',
      source: 'experimental:heuristics',
      blocking: true,
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
      mode: 'strict',
      source: 'experimental:heuristics',
      blocking: true,
    });
  });
});

test('resolveHeuristicsEnforcement inherits strict mode from heuristics experimental feature when explicit heuristics env is absent', async () => {
  await withHeuristicsEnforcementEnv(undefined, async () => {
    await withExperimentalHeuristicsEnv('strict', () => {
      const resolved = resolveHeuristicsEnforcement();

      assert.deepEqual(resolved, {
        mode: 'strict',
        source: 'experimental:heuristics',
        blocking: true,
      });
    });
  });
});

test('resolveHeuristicsEnforcement inherits advisory mode from heuristics experimental feature when explicit heuristics env is absent', async () => {
  await withHeuristicsEnforcementEnv(undefined, async () => {
    await withExperimentalHeuristicsEnv('advisory', () => {
      const resolved = resolveHeuristicsEnforcement();

      assert.deepEqual(resolved, {
        mode: 'advisory',
        source: 'experimental:heuristics',
        blocking: false,
      });
    });
  });
});
