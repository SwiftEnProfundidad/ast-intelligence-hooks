import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import { resolveLegacyRulesetFile } from '../resolveLegacyRulesetFile';

const createRuleset = (root: string, directory: string, fileName: string): string => {
  const rulesDir = join(root, 'legacy', 'tooling', directory, 'rules');
  mkdirSync(rulesDir, { recursive: true });
  const path = join(rulesDir, fileName);
  writeFileSync(path, `# ${directory}/${fileName}\n`, 'utf8');
  return path;
};

test('resolveLegacyRulesetFile prioritizes .cursor then .adapter before discovered directories', async () => {
  await withTempDir('pumuki-legacy-rules-priority-', async (tempRoot) => {
    const expected = createRuleset(tempRoot, '.cursor', 'rulesgold.mdc');
    createRuleset(tempRoot, '.adapter', 'rulesgold.mdc');
    createRuleset(tempRoot, '.windsurf', 'rulesgold.mdc');

    const resolved = resolveLegacyRulesetFile('rulesgold.mdc', tempRoot);
    assert.equal(resolved, expected);
  });
});

test('resolveLegacyRulesetFile supports provider-agnostic discovered legacy directories', async () => {
  await withTempDir('pumuki-legacy-rules-discovered-', async (tempRoot) => {
    const expected = createRuleset(tempRoot, '.acme', 'rulesbackend.mdc');
    createRuleset(tempRoot, '.zed', 'rulesbackend.mdc');

    const resolved = resolveLegacyRulesetFile('rulesbackend.mdc', tempRoot);
    assert.equal(resolved, expected);
  });
});

test('resolveLegacyRulesetFile returns undefined when no matching file exists', async () => {
  await withTempDir('pumuki-legacy-rules-missing-', async (tempRoot) => {
    mkdirSync(join(tempRoot, 'legacy', 'tooling', '.adapter', 'rules'), {
      recursive: true,
    });

    const resolved = resolveLegacyRulesetFile('rulesgold.mdc', tempRoot);
    assert.equal(resolved, undefined);
  });
});
