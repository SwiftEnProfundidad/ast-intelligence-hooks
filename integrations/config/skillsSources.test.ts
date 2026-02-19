import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../__tests__/helpers/tempDir';
import {
  isSkillsSourcesV1,
  loadSkillsSources,
  parseSkillsSources,
  type SkillsSourcesV1,
} from './skillsSources';

const sampleSources = (): SkillsSourcesV1 => ({
  version: '1.0',
  bundles: [
    {
      name: 'ios-guidelines',
      version: '1.0.0',
      sourcePath: 'docs/codex-skills/windsurf-rules-ios.md',
      template: 'ios-guidelines',
      source: '/Users/example/.codex/skills/public/windsurf-rules-ios/SKILL.md',
      enabled: true,
    },
    {
      name: 'backend-guidelines',
      version: '1.2.3-beta.1',
      sourcePath: 'docs/codex-skills/windsurf-rules-backend.md',
      template: 'backend-guidelines',
    },
  ],
});

test('parseSkillsSources acepta un manifiesto válido', () => {
  const sources = sampleSources();
  assert.equal(isSkillsSourcesV1(sources), true);
  assert.deepEqual(parseSkillsSources(sources), sources);
});

test('parseSkillsSources rechaza bundles con semver inválido', () => {
  const invalid: unknown = {
    ...sampleSources(),
    bundles: [{ ...sampleSources().bundles[0], version: '1.0' }],
  };

  assert.equal(isSkillsSourcesV1(invalid), false);
  assert.equal(parseSkillsSources(invalid), undefined);
});

test('parseSkillsSources rechaza bundles con source vacío o enabled no boolean', () => {
  const invalidSource: unknown = {
    ...sampleSources(),
    bundles: [{ ...sampleSources().bundles[0], source: '   ' }],
  };
  const invalidEnabled: unknown = {
    ...sampleSources(),
    bundles: [{ ...sampleSources().bundles[0], enabled: 'yes' }],
  };

  assert.equal(isSkillsSourcesV1(invalidSource), false);
  assert.equal(parseSkillsSources(invalidSource), undefined);
  assert.equal(isSkillsSourcesV1(invalidEnabled), false);
  assert.equal(parseSkillsSources(invalidEnabled), undefined);
});

test('parseSkillsSources rechaza payload sin bundles array', () => {
  const invalid: unknown = {
    version: '1.0',
    bundles: { name: 'ios-guidelines' },
  };

  assert.equal(isSkillsSourcesV1(invalid), false);
  assert.equal(parseSkillsSources(invalid), undefined);
});

test('loadSkillsSources carga skills.sources.json válido y respeta manifestFile custom', async () => {
  await withTempDir('pumuki-skills-sources-', async (tempRoot) => {
    const payload = sampleSources();
    writeFileSync(join(tempRoot, 'skills.sources.json'), JSON.stringify(payload, null, 2), 'utf8');
    writeFileSync(join(tempRoot, 'custom.sources.json'), JSON.stringify(payload, null, 2), 'utf8');

    assert.deepEqual(loadSkillsSources(tempRoot), payload);
    assert.deepEqual(loadSkillsSources(tempRoot, 'custom.sources.json'), payload);
  });
});

test('loadSkillsSources devuelve undefined para archivo ausente o json inválido', async () => {
  await withTempDir('pumuki-skills-sources-invalid-', async (tempRoot) => {
    assert.equal(loadSkillsSources(tempRoot), undefined);

    writeFileSync(join(tempRoot, 'skills.sources.json'), '{ invalid json', 'utf8');
    assert.equal(loadSkillsSources(tempRoot), undefined);
  });
});

test('loadSkillsSources devuelve undefined si el schema del manifiesto es inválido', async () => {
  await withTempDir('pumuki-skills-sources-schema-invalid-', async (tempRoot) => {
    writeFileSync(
      join(tempRoot, 'skills.sources.json'),
      JSON.stringify(
        {
          version: '1.0',
          bundles: [
            {
              name: 'ios-guidelines',
              version: '1.0',
              sourcePath: 'docs/codex-skills/windsurf-rules-ios.md',
              template: 'ios-guidelines',
            },
          ],
        },
        null,
        2
      ),
      'utf8'
    );

    assert.equal(loadSkillsSources(tempRoot), undefined);
  });
});
