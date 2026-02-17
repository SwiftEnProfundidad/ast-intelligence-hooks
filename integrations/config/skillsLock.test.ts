import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../__tests__/helpers/tempDir';
import {
  createSkillsLockDeterministicHash,
  isSkillsLockV1,
  loadSkillsLock,
  parseSkillsLock,
  type SkillsLockV1,
} from './skillsLock';

const sampleLock = (): SkillsLockV1 => ({
  version: '1.0',
  compilerVersion: '1.2.3',
  generatedAt: '2026-02-17T10:00:00.000Z',
  bundles: [
    {
      name: 'ios-guidelines',
      version: '1.0.0',
      source: 'file:docs/codex-skills/windsurf-rules-ios.md',
      hash: 'a'.repeat(64),
      rules: [
        {
          id: 'skills.ios.no-force-unwrap',
          description: 'Disallow force unwrap in production iOS code.',
          severity: 'ERROR',
          platform: 'ios',
          sourceSkill: 'ios-guidelines',
          sourcePath: 'docs/codex-skills/windsurf-rules-ios.md',
          stage: 'PRE_PUSH',
          confidence: 'HIGH',
          locked: true,
        },
      ],
    },
  ],
});

test('parseSkillsLock rechaza generatedAt no parseable', () => {
  const invalid: unknown = {
    ...sampleLock(),
    generatedAt: 'not-a-date',
  };

  assert.equal(isSkillsLockV1(invalid), false);
  assert.equal(parseSkillsLock(invalid), undefined);
});

test('parseSkillsLock rechaza reglas con plataforma fuera del contrato', () => {
  const invalid: unknown = {
    ...sampleLock(),
    bundles: [
      {
        ...sampleLock().bundles[0],
        rules: [
          {
            ...sampleLock().bundles[0].rules[0],
            platform: 'desktop',
          },
        ],
      },
    ],
  };

  assert.equal(isSkillsLockV1(invalid), false);
  assert.equal(parseSkillsLock(invalid), undefined);
});

test('loadSkillsLock devuelve undefined para hash de bundle inválido en archivo', async () => {
  await withTempDir('pumuki-skills-lock-invalid-hash-', async (tempRoot) => {
    const invalid = {
      ...sampleLock(),
      bundles: [{ ...sampleLock().bundles[0], hash: 'abc123' }],
    };
    writeFileSync(join(tempRoot, 'skills.lock.json'), JSON.stringify(invalid, null, 2), 'utf8');

    assert.equal(loadSkillsLock(tempRoot), undefined);
  });
});

test('parseSkillsLock acepta payload válido', () => {
  const parsed = parseSkillsLock(sampleLock());
  assert.ok(parsed);
  assert.equal(parsed?.version, '1.0');
  assert.equal(parsed?.bundles.length, 1);
});

test('createSkillsLockDeterministicHash es estable ante reordenación de bundles y rules', () => {
  const lockA = sampleLock();
  const lockB: SkillsLockV1 = {
    ...lockA,
    bundles: [
      {
        ...lockA.bundles[0],
        rules: [
          {
            ...lockA.bundles[0].rules[0],
            id: 'skills.ios.no-force-try',
          },
          lockA.bundles[0].rules[0],
        ],
      },
      {
        name: 'backend-guidelines',
        version: '1.0.0',
        source: 'file:docs/codex-skills/windsurf-rules-backend.md',
        hash: 'b'.repeat(64),
        rules: [],
      },
    ],
  };
  const lockC: SkillsLockV1 = {
    ...lockB,
    bundles: [...lockB.bundles].reverse().map((bundle) =>
      bundle.name === 'ios-guidelines'
        ? { ...bundle, rules: [...bundle.rules].reverse() }
        : bundle
    ),
  };

  const hashB = createSkillsLockDeterministicHash(lockB);
  const hashC = createSkillsLockDeterministicHash(lockC);
  assert.equal(hashB, hashC);
});

test('createSkillsLockDeterministicHash cambia cuando cambia la política efectiva del lock', () => {
  const lockA = sampleLock();
  const lockB: SkillsLockV1 = {
    ...lockA,
    compilerVersion: '1.2.4',
  };

  const hashA = createSkillsLockDeterministicHash(lockA);
  const hashB = createSkillsLockDeterministicHash(lockB);
  assert.notEqual(hashA, hashB);
});

test('loadSkillsLock carga archivo válido y rechaza JSON malformado', async () => {
  await withTempDir('pumuki-skills-lock-load-', async (tempRoot) => {
    writeFileSync(
      join(tempRoot, 'skills.lock.json'),
      JSON.stringify(sampleLock(), null, 2),
      'utf8'
    );
    const loaded = loadSkillsLock(tempRoot);
    assert.ok(loaded);
    assert.equal(loaded?.bundles[0]?.name, 'ios-guidelines');

    writeFileSync(join(tempRoot, 'skills.lock.json'), '{ invalid json', 'utf8');
    assert.equal(loadSkillsLock(tempRoot), undefined);
  });
});
