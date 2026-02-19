import assert from 'node:assert/strict';
import test from 'node:test';
import { fsSyncRules } from './fsSync';
import { fsSyncAppendRules } from './fsSyncAppendRules';
import { fsSyncDescriptorRules } from './fsSyncDescriptorRules';
import { fsSyncFileOperationsRules } from './fsSyncFileOperationsRules';
import { fsSyncPathRules } from './fsSyncPathRules';

test('fsSyncRules compone reglas heurísticas locked de fs sync APIs', () => {
  const expected = [
    ...fsSyncFileOperationsRules,
    ...fsSyncDescriptorRules,
    ...fsSyncPathRules,
    ...fsSyncAppendRules,
  ];

  assert.equal(fsSyncRules.length, 40);
  assert.deepEqual(fsSyncRules, expected);

  const ids = fsSyncRules.map((rule) => rule.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes('heuristics.ts.fs-write-file-sync.ast'));
  assert.ok(ids.includes('heuristics.ts.fs-fstat-sync.ast'));
  assert.ok(ids.includes('heuristics.ts.fs-append-file-sync.ast'));

  for (const rule of fsSyncRules) {
    assert.equal(rule.platform, 'generic');
    assert.equal(rule.severity, 'WARN');
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'Heuristic');
    assert.equal(rule.then.kind, 'Finding');
    assert.equal(rule.when.where?.ruleId, rule.id);
  }
});
