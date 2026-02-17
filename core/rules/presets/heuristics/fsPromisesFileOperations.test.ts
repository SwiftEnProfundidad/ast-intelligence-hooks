import assert from 'node:assert/strict';
import test from 'node:test';
import { fsPromisesFileOperationsRules } from './fsPromisesFileOperations';

test('fsPromisesFileOperationsRules define reglas heurísticas locked de fs.promises file operations', () => {
  assert.equal(fsPromisesFileOperationsRules.length, 10);

  const ids = fsPromisesFileOperationsRules.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'heuristics.ts.fs-promises-write-file.ast',
    'heuristics.ts.fs-promises-append-file.ast',
    'heuristics.ts.fs-promises-rm.ast',
    'heuristics.ts.fs-promises-unlink.ast',
    'heuristics.ts.fs-promises-read-file.ast',
    'heuristics.ts.fs-promises-readdir.ast',
    'heuristics.ts.fs-promises-mkdir.ast',
    'heuristics.ts.fs-promises-stat.ast',
    'heuristics.ts.fs-promises-copy-file.ast',
    'heuristics.ts.fs-promises-rename.ast',
  ]);

  const byId = new Map(fsPromisesFileOperationsRules.map((rule) => [rule.id, rule]));
  assert.equal(
    byId.get('heuristics.ts.fs-promises-write-file.ast')?.then.code,
    'HEURISTICS_FS_PROMISES_WRITE_FILE_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.fs-promises-copy-file.ast')?.then.code,
    'HEURISTICS_FS_PROMISES_COPY_FILE_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.fs-promises-rename.ast')?.then.code,
    'HEURISTICS_FS_PROMISES_RENAME_AST'
  );

  for (const rule of fsPromisesFileOperationsRules) {
    assert.equal(rule.platform, 'generic');
    assert.equal(rule.severity, 'WARN');
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'Heuristic');
    assert.equal(rule.then.kind, 'Finding');
    assert.equal(rule.when.where?.ruleId, rule.id);
  }
});
