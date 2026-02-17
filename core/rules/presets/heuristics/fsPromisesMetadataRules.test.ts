import assert from 'node:assert/strict';
import test from 'node:test';
import { fsPromisesMetadataRules } from './fsPromisesMetadataRules';

test('fsPromisesMetadataRules define reglas heurísticas locked de fs.promises metadata', () => {
  assert.equal(fsPromisesMetadataRules.length, 13);

  const ids = fsPromisesMetadataRules.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'heuristics.ts.fs-promises-access.ast',
    'heuristics.ts.fs-promises-chmod.ast',
    'heuristics.ts.fs-promises-chown.ast',
    'heuristics.ts.fs-promises-utimes.ast',
    'heuristics.ts.fs-promises-lstat.ast',
    'heuristics.ts.fs-promises-realpath.ast',
    'heuristics.ts.fs-promises-symlink.ast',
    'heuristics.ts.fs-promises-link.ast',
    'heuristics.ts.fs-promises-readlink.ast',
    'heuristics.ts.fs-promises-open.ast',
    'heuristics.ts.fs-promises-opendir.ast',
    'heuristics.ts.fs-promises-cp.ast',
    'heuristics.ts.fs-promises-mkdtemp.ast',
  ]);

  const byId = new Map(fsPromisesMetadataRules.map((rule) => [rule.id, rule]));
  assert.equal(
    byId.get('heuristics.ts.fs-promises-access.ast')?.then.code,
    'HEURISTICS_FS_PROMISES_ACCESS_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.fs-promises-realpath.ast')?.then.code,
    'HEURISTICS_FS_PROMISES_REALPATH_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.fs-promises-mkdtemp.ast')?.then.code,
    'HEURISTICS_FS_PROMISES_MKDTEMP_AST'
  );

  for (const rule of fsPromisesMetadataRules) {
    assert.equal(rule.platform, 'generic');
    assert.equal(rule.severity, 'WARN');
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'Heuristic');
    assert.equal(rule.then.kind, 'Finding');
    assert.equal(rule.when.where?.ruleId, rule.id);
  }
});
