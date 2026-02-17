import assert from 'node:assert/strict';
import test from 'node:test';
import { fsPromisesRules } from './fsPromises';
import { fsPromisesFileOperationsRules } from './fsPromisesFileOperations';
import { fsPromisesMetadataRules } from './fsPromisesMetadataRules';

test('fsPromisesRules compone reglas heurísticas locked de fs.promises', () => {
  const expected = [...fsPromisesFileOperationsRules, ...fsPromisesMetadataRules];

  assert.equal(fsPromisesRules.length, 23);
  assert.deepEqual(fsPromisesRules, expected);

  const ids = fsPromisesRules.map((rule) => rule.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes('heuristics.ts.fs-promises-write-file.ast'));
  assert.ok(ids.includes('heuristics.ts.fs-promises-access.ast'));
  assert.ok(ids.includes('heuristics.ts.fs-promises-mkdtemp.ast'));

  for (const rule of fsPromisesRules) {
    assert.equal(rule.platform, 'generic');
    assert.equal(rule.severity, 'WARN');
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'Heuristic');
    assert.equal(rule.then.kind, 'Finding');
    assert.equal(rule.when.where?.ruleId, rule.id);
  }
});
