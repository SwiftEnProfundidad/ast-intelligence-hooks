import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveSkillsEnforcement } from '../skillsEnforcement';

test('resolveSkillsEnforcement defaults to strict mode', async () => {
  const resolved = resolveSkillsEnforcement();

  assert.deepEqual(resolved, {
    mode: 'strict',
    source: 'default',
    blocking: true,
  });
});

test('resolveSkillsEnforcement ignora el entorno y sigue en strict', async () => {
  const previous = process.env.PUMUKI_SKILLS_ENFORCEMENT;
  process.env.PUMUKI_SKILLS_ENFORCEMENT = 'advisory';
  try {
    const resolved = resolveSkillsEnforcement();

    assert.deepEqual(resolved, {
      mode: 'strict',
      source: 'default',
      blocking: true,
    });
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env.PUMUKI_SKILLS_ENFORCEMENT;
    } else {
      process.env.PUMUKI_SKILLS_ENFORCEMENT = previous;
    }
  }
});
