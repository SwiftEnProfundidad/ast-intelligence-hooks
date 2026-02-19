import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SKILLS_LOCK_COMPILER_VERSION,
  skillsCompilerTemplates,
} from './skillsCompilerTemplates';

test('skillsCompilerTemplates mantiene versión de compilador en semver y nombres coherentes', () => {
  assert.match(SKILLS_LOCK_COMPILER_VERSION, /^\d+\.\d+\.\d+$/);

  for (const [key, template] of Object.entries(skillsCompilerTemplates)) {
    assert.equal(template.name, key);
    assert.ok(template.description.length > 0);
  }
});

test('skillsCompilerTemplates no contiene ids de regla duplicados entre bundles', () => {
  const seen = new Set<string>();
  for (const template of Object.values(skillsCompilerTemplates)) {
    for (const rule of template.rules) {
      assert.equal(seen.has(rule.id), false, `Duplicated rule id: ${rule.id}`);
      seen.add(rule.id);
    }
  }
});

test('skillsCompilerTemplates define reglas locked con severidades y plataformas válidas', () => {
  const validSeverities = new Set(['WARN', 'ERROR', 'CRITICAL']);
  const validPlatforms = new Set(['ios', 'android', 'backend', 'frontend']);

  for (const template of Object.values(skillsCompilerTemplates)) {
    assert.ok(template.rules.length > 0);
    for (const rule of template.rules) {
      assert.equal(rule.locked, true);
      assert.equal(validSeverities.has(rule.severity), true);
      assert.equal(validPlatforms.has(rule.platform), true);
    }
  }
});

test('skillsCompilerTemplates usa stages válidos solo cuando están definidos', () => {
  const validStages = new Set(['PRE_COMMIT', 'PRE_PUSH', 'CI']);

  for (const template of Object.values(skillsCompilerTemplates)) {
    for (const rule of template.rules) {
      if (typeof rule.stage === 'undefined') {
        continue;
      }
      assert.equal(validStages.has(rule.stage), true);
    }
  }
});

test('skillsCompilerTemplates mantiene bundles iOS enterprise esperados', () => {
  const requiredIosBundles = [
    'ios-guidelines',
    'ios-concurrency-guidelines',
    'ios-swiftui-expert-guidelines',
  ];

  for (const bundleName of requiredIosBundles) {
    const bundle = skillsCompilerTemplates[bundleName];
    assert.ok(bundle, `Missing iOS bundle: ${bundleName}`);
    assert.equal(bundle.rules.length > 0, true);
    assert.equal(bundle.rules.every((rule) => rule.platform === 'ios'), true);
  }
});
