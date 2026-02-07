import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  createSkillsLockDeterministicHash,
  isSkillsLockV1,
  loadSkillsLock,
  parseSkillsLock,
  type SkillsLockV1,
} from '../skillsLock';
import {
  createSkillsPolicyDeterministicHash,
  isSkillsPolicyV1,
  loadSkillsPolicy,
  parseSkillsPolicy,
  type SkillsPolicyV1,
} from '../skillsPolicy';

const sampleLock = (): SkillsLockV1 => {
  return {
    version: '1.0',
    compilerVersion: '1.0.0',
    generatedAt: '2026-02-07T21:00:00.000Z',
    bundles: [
      {
        name: 'ios-guidelines',
        version: '1.2.0',
        source: 'local-skill',
        hash: 'a'.repeat(64),
        rules: [
          {
            id: 'skills.ios.no-force-try',
            description: 'Avoid force try in production code.',
            severity: 'ERROR',
            platform: 'ios',
            sourceSkill: 'ios-guidelines',
            sourcePath: 'skills/ios/SKILL.md',
            confidence: 'HIGH',
            locked: true,
          },
          {
            id: 'skills.ios.no-force-unwrap',
            description: 'Avoid force unwrap in production code.',
            severity: 'ERROR',
            platform: 'ios',
            sourceSkill: 'ios-guidelines',
            sourcePath: 'skills/ios/SKILL.md',
            stage: 'PRE_PUSH',
          },
        ],
      },
      {
        name: 'backend-guidelines',
        version: '1.0.1',
        source: 'local-skill',
        hash: 'b'.repeat(64),
        rules: [
          {
            id: 'skills.backend.no-console-log',
            description: 'Disallow console.log in backend runtime code.',
            severity: 'WARN',
            platform: 'backend',
            sourceSkill: 'backend-guidelines',
            sourcePath: 'skills/backend/SKILL.md',
            stage: 'PRE_COMMIT',
          },
        ],
      },
    ],
  };
};

const samplePolicy = (): SkillsPolicyV1 => {
  return {
    version: '1.0',
    defaultBundleEnabled: true,
    stages: {
      PRE_COMMIT: {
        blockOnOrAbove: 'CRITICAL',
        warnOnOrAbove: 'ERROR',
      },
      PRE_PUSH: {
        blockOnOrAbove: 'ERROR',
        warnOnOrAbove: 'WARN',
      },
      CI: {
        blockOnOrAbove: 'ERROR',
        warnOnOrAbove: 'WARN',
      },
    },
    bundles: {
      'ios-guidelines': {
        enabled: true,
        promoteToErrorRuleIds: ['skills.ios.no-force-try', 'skills.ios.no-force-unwrap'],
      },
      'backend-guidelines': {
        enabled: true,
      },
    },
  };
};

test('accepts valid skills lock and policy contracts', () => {
  const lock = sampleLock();
  const policy = samplePolicy();

  assert.equal(isSkillsLockV1(lock), true);
  assert.equal(isSkillsPolicyV1(policy), true);
  assert.deepEqual(parseSkillsLock(lock), lock);
  assert.deepEqual(parseSkillsPolicy(policy), policy);
});

test('rejects invalid lock and policy payloads', () => {
  const invalidLock: unknown = {
    ...sampleLock(),
    bundles: [
      {
        ...sampleLock().bundles[0],
        rules: [
          {
            ...sampleLock().bundles[0]?.rules[0],
            severity: 'HIGH',
          },
        ],
      },
    ],
  };

  const invalidPolicy: unknown = {
    ...samplePolicy(),
    stages: {
      ...samplePolicy().stages,
      PRE_PUSH: {
        blockOnOrAbove: 'HIGH',
        warnOnOrAbove: 'WARN',
      },
    },
  };

  assert.equal(parseSkillsLock(invalidLock), undefined);
  assert.equal(parseSkillsPolicy(invalidPolicy), undefined);
});

test('creates deterministic lock hash independent from bundle/rule order', () => {
  const lockA = sampleLock();
  const lockB: SkillsLockV1 = {
    ...lockA,
    bundles: [
      {
        ...lockA.bundles[1],
      },
      {
        ...lockA.bundles[0],
        rules: [...lockA.bundles[0].rules].reverse(),
      },
    ],
  };

  const hashA = createSkillsLockDeterministicHash(lockA);
  const hashB = createSkillsLockDeterministicHash(lockB);
  assert.equal(hashA, hashB);

  const changedLock: SkillsLockV1 = {
    ...lockA,
    bundles: [
      {
        ...lockA.bundles[0],
        rules: [
          {
            ...lockA.bundles[0].rules[0],
            severity: 'CRITICAL',
          },
          ...lockA.bundles[0].rules.slice(1),
        ],
      },
      lockA.bundles[1],
    ],
  };

  const changedHash = createSkillsLockDeterministicHash(changedLock);
  assert.notEqual(hashA, changedHash);
});

test('creates deterministic policy hash independent from key and list order', () => {
  const policyA = samplePolicy();
  const policyB: SkillsPolicyV1 = {
    ...policyA,
    bundles: {
      'backend-guidelines': {
        enabled: true,
      },
      'ios-guidelines': {
        enabled: true,
        promoteToErrorRuleIds: [...(policyA.bundles['ios-guidelines']?.promoteToErrorRuleIds ?? [])].reverse(),
      },
    },
  };

  const hashA = createSkillsPolicyDeterministicHash(policyA);
  const hashB = createSkillsPolicyDeterministicHash(policyB);
  assert.equal(hashA, hashB);

  const changedPolicy: SkillsPolicyV1 = {
    ...policyA,
    bundles: {
      ...policyA.bundles,
      'backend-guidelines': {
        enabled: false,
      },
    },
  };

  const changedHash = createSkillsPolicyDeterministicHash(changedPolicy);
  assert.notEqual(hashA, changedHash);
});

test('loads lock and policy from repository files when valid', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'pumuki-skills-contracts-'));

  try {
    writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(sampleLock(), null, 2));
    writeFileSync(join(tempRoot, 'skills.policy.json'), JSON.stringify(samplePolicy(), null, 2));

    const loadedLock = loadSkillsLock(tempRoot);
    const loadedPolicy = loadSkillsPolicy(tempRoot);

    assert.deepEqual(loadedLock, sampleLock());
    assert.deepEqual(loadedPolicy, samplePolicy());
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('returns undefined for missing or invalid contract files', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'pumuki-skills-contracts-missing-'));

  try {
    assert.equal(loadSkillsLock(tempRoot), undefined);
    assert.equal(loadSkillsPolicy(tempRoot), undefined);

    writeFileSync(join(tempRoot, 'skills.lock.json'), '{invalid json');
    writeFileSync(join(tempRoot, 'skills.policy.json'), JSON.stringify({ version: '2.0' }));

    assert.equal(loadSkillsLock(tempRoot), undefined);
    assert.equal(loadSkillsPolicy(tempRoot), undefined);
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
