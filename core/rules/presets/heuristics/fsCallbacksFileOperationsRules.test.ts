import assert from 'node:assert/strict';
import test from 'node:test';
import { fsCallbacksFileOperationsRules } from './fsCallbacksFileOperationsRules';

test('fsCallbacksFileOperationsRules define reglas heurísticas locked de fs callback file operations', () => {
  assert.equal(fsCallbacksFileOperationsRules.length, 22);

  const ids = fsCallbacksFileOperationsRules.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'heuristics.ts.fs-utimes-callback.ast',
    'heuristics.ts.fs-watch-callback.ast',
    'heuristics.ts.fs-watch-file-callback.ast',
    'heuristics.ts.fs-unwatch-file-callback.ast',
    'heuristics.ts.fs-read-file-callback.ast',
    'heuristics.ts.fs-exists-callback.ast',
    'heuristics.ts.fs-write-file-callback.ast',
    'heuristics.ts.fs-append-file-callback.ast',
    'heuristics.ts.fs-readdir-callback.ast',
    'heuristics.ts.fs-mkdir-callback.ast',
    'heuristics.ts.fs-rmdir-callback.ast',
    'heuristics.ts.fs-rm-callback.ast',
    'heuristics.ts.fs-rename-callback.ast',
    'heuristics.ts.fs-copy-file-callback.ast',
    'heuristics.ts.fs-stat-callback.ast',
    'heuristics.ts.fs-statfs-callback.ast',
    'heuristics.ts.fs-lstat-callback.ast',
    'heuristics.ts.fs-realpath-callback.ast',
    'heuristics.ts.fs-access-callback.ast',
    'heuristics.ts.fs-chmod-callback.ast',
    'heuristics.ts.fs-chown-callback.ast',
    'heuristics.ts.fs-lchown-callback.ast',
  ]);

  const byId = new Map(fsCallbacksFileOperationsRules.map((rule) => [rule.id, rule]));
  assert.equal(
    byId.get('heuristics.ts.fs-utimes-callback.ast')?.then.code,
    'HEURISTICS_FS_UTIMES_CALLBACK_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.fs-copy-file-callback.ast')?.then.code,
    'HEURISTICS_FS_COPY_FILE_CALLBACK_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.fs-lchown-callback.ast')?.then.code,
    'HEURISTICS_FS_LCHOWN_CALLBACK_AST'
  );

  for (const rule of fsCallbacksFileOperationsRules) {
    assert.equal(rule.platform, 'generic');
    assert.equal(rule.severity, 'WARN');
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'Heuristic');
    assert.equal(rule.then.kind, 'Finding');
    assert.equal(rule.when.where?.ruleId, rule.id);
  }
});
