import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveSkillsEnforcement } from '../skillsEnforcement';

const withSkillsEnforcementEnv = async <T>(
  value: string | undefined,
  callback: () => Promise<T> | T
): Promise<T> => {
  const previous = process.env.PUMUKI_SKILLS_ENFORCEMENT;
  if (typeof value === 'undefined') {
    delete process.env.PUMUKI_SKILLS_ENFORCEMENT;
  } else {
    process.env.PUMUKI_SKILLS_ENFORCEMENT = value;
  }
  try {
    return await callback();
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env.PUMUKI_SKILLS_ENFORCEMENT;
    } else {
      process.env.PUMUKI_SKILLS_ENFORCEMENT = previous;
    }
  }
};

test('resolveSkillsEnforcement defaults to strict mode', async () => {
  await withSkillsEnforcementEnv(undefined, () => {
    const resolved = resolveSkillsEnforcement();

    assert.deepEqual(resolved, {
      mode: 'strict',
      source: 'default',
      blocking: true,
    });
  });
});

test('resolveSkillsEnforcement reads strict mode from environment', async () => {
  await withSkillsEnforcementEnv('strict', () => {
    const resolved = resolveSkillsEnforcement();

    assert.deepEqual(resolved, {
      mode: 'strict',
      source: 'env',
      blocking: true,
    });
  });
});

test('resolveSkillsEnforcement falls back to strict on invalid environment value', async () => {
  await withSkillsEnforcementEnv('surprise', () => {
    const resolved = resolveSkillsEnforcement();

    assert.deepEqual(resolved, {
      mode: 'strict',
      source: 'default',
      blocking: true,
    });
  });
});

test('resolveSkillsEnforcement no necesita env para mantener strict por defecto', async () => {
  await withSkillsEnforcementEnv(undefined, () => {
    const resolved = resolveSkillsEnforcement();

    assert.deepEqual(resolved, {
      mode: 'strict',
      source: 'default',
      blocking: true,
    });
  });
});
