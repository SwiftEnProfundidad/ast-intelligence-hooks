import assert from 'node:assert/strict';
import test from 'node:test';
import {
  __resetCoreSkillsLockCacheForTests,
  loadCoreSkillsLock,
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
