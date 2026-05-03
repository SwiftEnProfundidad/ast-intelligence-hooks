import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveSkillsEnforcement } from '../skillsEnforcement';

test('resolveSkillsEnforcement defaults to strict mode', async () => {
  const resolved = resolveSkillsEnforcement();

  assert.deepEqual(resolved, {
    blocking: true,
  });
});

test('resolveSkillsEnforcement mantiene bloqueo constante', async () => {
  const resolved = resolveSkillsEnforcement();

  assert.deepEqual(resolved, {
    blocking: true,
  });
});
