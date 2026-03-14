import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  __resetCoreSkillsLockCacheForTests,
  loadCoreSkillsLock,
  resolveCoreSkillsLockForPackageRoot,
} from '../coreSkillsLock';

test('loadCoreSkillsLock incluye todos los bundles core esperados con reglas compiladas', () => {
  __resetCoreSkillsLockCacheForTests();
  const lock = loadCoreSkillsLock();
  assert.ok(lock);

  const bundleNames = lock.bundles.map((bundle) => bundle.name).sort();
  assert.deepEqual(bundleNames, [
    'android-guidelines',
    'backend-guidelines',
    'frontend-guidelines',
    'ios-concurrency-guidelines',
    'ios-guidelines',
    'ios-swiftui-expert-guidelines',
  ]);

  for (const bundle of lock.bundles) {
    assert.equal(bundle.rules.length > 0, true);
  }
});

test('resolveCoreSkillsLockForPackageRoot usa skills.lock empaquetado como fallback si sources no se pueden compilar', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'pumuki-core-skills-lock-'));
  try {
    writeFileSync(
      join(tempRoot, 'skills.sources.json'),
      JSON.stringify(
        {
          version: '1.0',
          bundles: [
            {
              name: 'backend-guidelines',
              version: '1.0.0',
              template: 'backend-guidelines',
              sourcePath: 'vendor/skills/backend-enterprise-rules/SKILL.md',
              enabled: true,
            },
          ],
        },
        null,
        2
      ),
      'utf8'
    );
    writeFileSync(
      join(tempRoot, 'skills.lock.json'),
      JSON.stringify(
        {
          version: '1.0',
          compilerVersion: '1.0.0',
          generatedAt: '2026-03-14T00:00:00.000Z',
          bundles: [
            {
              name: 'backend-guidelines',
              version: '1.0.0',
              source: 'file:docs/codex-skills/backend-enterprise-rules.md',
              hash: 'c'.repeat(64),
              rules: [
                {
                  id: 'skills.backend.no-empty-catch',
                  description: 'Disallow empty catch blocks in backend runtime code.',
                  severity: 'CRITICAL',
                  platform: 'backend',
                  sourceSkill: 'backend-guidelines',
                  sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
                  confidence: 'HIGH',
                  locked: true,
                  evaluationMode: 'AUTO',
                  origin: 'core',
                  astNodeIds: ['heuristics.typescript.empty-catch.ast'],
                },
              ],
            },
          ],
        },
        null,
        2
      ),
      'utf8'
    );

    const lock = resolveCoreSkillsLockForPackageRoot(tempRoot);

    assert.ok(lock);
    assert.deepEqual(lock.bundles.map((bundle) => bundle.name), ['backend-guidelines']);
    assert.equal(lock.bundles[0]?.rules[0]?.id, 'skills.backend.no-empty-catch');
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});
