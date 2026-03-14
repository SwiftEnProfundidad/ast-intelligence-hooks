import assert from 'node:assert/strict';
import test from 'node:test';
import { resolvePreWriteEnforcement } from '../preWriteEnforcement';

const withPreWriteEnforcementEnv = async <T>(
  value: string | undefined,
  callback: () => Promise<T> | T
): Promise<T> => {
  const previous = process.env.PUMUKI_EXPERIMENTAL_PRE_WRITE;
  const previousLegacy = process.env.PUMUKI_PREWRITE_ENFORCEMENT;
  delete process.env.PUMUKI_PREWRITE_ENFORCEMENT;
  if (typeof value === 'undefined') {
    delete process.env.PUMUKI_EXPERIMENTAL_PRE_WRITE;
  } else {
    process.env.PUMUKI_EXPERIMENTAL_PRE_WRITE = value;
  }
  try {
    return await callback();
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env.PUMUKI_EXPERIMENTAL_PRE_WRITE;
    } else {
      process.env.PUMUKI_EXPERIMENTAL_PRE_WRITE = previous;
    }
    if (typeof previousLegacy === 'undefined') {
      delete process.env.PUMUKI_PREWRITE_ENFORCEMENT;
    } else {
      process.env.PUMUKI_PREWRITE_ENFORCEMENT = previousLegacy;
    }
  }
};

const withLegacyPreWriteEnforcementEnv = async <T>(
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

test('resolvePreWriteEnforcement defaults to off mode', async () => {
  await withPreWriteEnforcementEnv(undefined, () => {
    const resolved = resolvePreWriteEnforcement();

    assert.deepEqual(resolved, {
      mode: 'off',
      source: 'default',
      blocking: false,
      layer: 'experimental',
      activationVariable: 'PUMUKI_EXPERIMENTAL_PRE_WRITE',
      legacyActivationVariable: 'PUMUKI_PREWRITE_ENFORCEMENT',
    });
  });
});

test('resolvePreWriteEnforcement reads off aliases from environment', async () => {
  await withPreWriteEnforcementEnv('disabled', () => {
    const resolved = resolvePreWriteEnforcement();

    assert.deepEqual(resolved, {
      mode: 'off',
      source: 'env',
      blocking: false,
      layer: 'experimental',
      activationVariable: 'PUMUKI_EXPERIMENTAL_PRE_WRITE',
      legacyActivationVariable: 'PUMUKI_PREWRITE_ENFORCEMENT',
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
      layer: 'experimental',
      activationVariable: 'PUMUKI_EXPERIMENTAL_PRE_WRITE',
      legacyActivationVariable: 'PUMUKI_PREWRITE_ENFORCEMENT',
    });
  });
});

test('resolvePreWriteEnforcement accepts legacy environment as compatibility fallback', async () => {
  await withPreWriteEnforcementEnv(undefined, async () => {
    await withLegacyPreWriteEnforcementEnv('advisory', () => {
      const resolved = resolvePreWriteEnforcement();

      assert.deepEqual(resolved, {
        mode: 'advisory',
        source: 'legacy-env',
        blocking: false,
        layer: 'experimental',
        activationVariable: 'PUMUKI_EXPERIMENTAL_PRE_WRITE',
        legacyActivationVariable: 'PUMUKI_PREWRITE_ENFORCEMENT',
      });
    });
  });
});

test('resolvePreWriteEnforcement falls back to off on invalid environment value', async () => {
  await withPreWriteEnforcementEnv('surprise', () => {
    const resolved = resolvePreWriteEnforcement();

    assert.deepEqual(resolved, {
      mode: 'off',
      source: 'default',
      blocking: false,
      layer: 'experimental',
      activationVariable: 'PUMUKI_EXPERIMENTAL_PRE_WRITE',
      legacyActivationVariable: 'PUMUKI_PREWRITE_ENFORCEMENT',
    });
  });
});
