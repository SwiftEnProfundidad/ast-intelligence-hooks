import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../__tests__/helpers/tempDir';
import {
  createSkillsPolicyDeterministicHash,
  isSkillsPolicyV1,
  loadSkillsPolicy,
  parseSkillsPolicy,
  type SkillsPolicyV1,
} from './skillsPolicy';

const buildPolicy = (): SkillsPolicyV1 => ({
  version: '1.0',
  defaultBundleEnabled: true,
  stages: {
    PRE_COMMIT: { blockOnOrAbove: 'CRITICAL', warnOnOrAbove: 'ERROR' },
    PRE_PUSH: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
    CI: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
  },
  bundles: {
    'ios-guidelines': {
      enabled: true,
      promoteToErrorRuleIds: ['skills.ios.a', 'skills.ios.b'],
    },
    'backend-guidelines': {
      enabled: false,
    },
  },
});

test('isSkillsPolicyV1 rechaza payloads sin stages requeridos', () => {
  const invalid = {
    ...buildPolicy(),
    stages: {
      PRE_COMMIT: { blockOnOrAbove: 'CRITICAL', warnOnOrAbove: 'ERROR' },
      PRE_PUSH: { blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
    },
  };

  assert.equal(isSkillsPolicyV1(invalid), false);
  assert.equal(parseSkillsPolicy(invalid), undefined);
});

test('createSkillsPolicyDeterministicHash es estable ante orden de bundles y rule ids', () => {
  const policyA = buildPolicy();
  const policyB: SkillsPolicyV1 = {
    ...policyA,
    bundles: {
      'backend-guidelines': { enabled: false },
      'ios-guidelines': {
        enabled: true,
        promoteToErrorRuleIds: ['skills.ios.b', 'skills.ios.a'],
      },
    },
  };

  const hashA = createSkillsPolicyDeterministicHash(policyA);
  const hashB = createSkillsPolicyDeterministicHash(policyB);
  assert.equal(hashA, hashB);
});

test('createSkillsPolicyDeterministicHash cambia cuando cambia la política efectiva', () => {
  const policyA = buildPolicy();
  const policyB: SkillsPolicyV1 = {
    ...policyA,
    defaultBundleEnabled: false,
  };

  const hashA = createSkillsPolicyDeterministicHash(policyA);
  const hashB = createSkillsPolicyDeterministicHash(policyB);
  assert.notEqual(hashA, hashB);
});

test('parseSkillsPolicy acepta payload válido', () => {
  const parsed = parseSkillsPolicy(buildPolicy());
  assert.ok(parsed);
  assert.equal(parsed?.version, '1.0');
  assert.equal(parsed?.stages.CI.blockOnOrAbove, 'ERROR');
});

test('loadSkillsPolicy carga skills.policy.json válido desde repoRoot explícito', async () => {
  await withTempDir('pumuki-skills-policy-load-', async (tempRoot) => {
    writeFileSync(
      join(tempRoot, 'skills.policy.json'),
      JSON.stringify(buildPolicy(), null, 2),
      'utf8'
    );

    const loaded = loadSkillsPolicy(tempRoot);
    assert.ok(loaded);
    assert.equal(loaded?.version, '1.0');
    assert.equal(loaded?.bundles['ios-guidelines']?.enabled, true);
  });
});

test('loadSkillsPolicy devuelve undefined para JSON malformado o schema inválido', async () => {
  await withTempDir('pumuki-skills-policy-invalid-', async (tempRoot) => {
    writeFileSync(join(tempRoot, 'skills.policy.json'), '{ invalid json', 'utf8');
    assert.equal(loadSkillsPolicy(tempRoot), undefined);

    writeFileSync(
      join(tempRoot, 'skills.policy.json'),
      JSON.stringify({
        ...buildPolicy(),
        bundles: {
          'ios-guidelines': {
            enabled: true,
            promoteToErrorRuleIds: [123],
          },
        },
      }),
      'utf8'
    );
    assert.equal(loadSkillsPolicy(tempRoot), undefined);
  });
});
