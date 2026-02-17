import assert from 'node:assert/strict';
import test from 'node:test';
import { fsCallbacksMetadataRules } from './fsCallbacksMetadataRules';

test('fsCallbacksMetadataRules define reglas heurísticas locked de fs callback metadata', () => {
  assert.equal(fsCallbacksMetadataRules.length, 23);

  const ids = fsCallbacksMetadataRules.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'heuristics.ts.fs-lchmod-callback.ast',
    'heuristics.ts.fs-unlink-callback.ast',
    'heuristics.ts.fs-readlink-callback.ast',
    'heuristics.ts.fs-symlink-callback.ast',
    'heuristics.ts.fs-link-callback.ast',
    'heuristics.ts.fs-mkdtemp-callback.ast',
    'heuristics.ts.fs-opendir-callback.ast',
    'heuristics.ts.fs-open-callback.ast',
    'heuristics.ts.fs-cp-callback.ast',
    'heuristics.ts.fs-close-callback.ast',
    'heuristics.ts.fs-read-callback.ast',
    'heuristics.ts.fs-readv-callback.ast',
    'heuristics.ts.fs-writev-callback.ast',
    'heuristics.ts.fs-write-callback.ast',
    'heuristics.ts.fs-fsync-callback.ast',
    'heuristics.ts.fs-fdatasync-callback.ast',
    'heuristics.ts.fs-fchown-callback.ast',
    'heuristics.ts.fs-fchmod-callback.ast',
    'heuristics.ts.fs-fstat-callback.ast',
    'heuristics.ts.fs-ftruncate-callback.ast',
    'heuristics.ts.fs-truncate-callback.ast',
    'heuristics.ts.fs-futimes-callback.ast',
    'heuristics.ts.fs-lutimes-callback.ast',
  ]);

  const byId = new Map(fsCallbacksMetadataRules.map((rule) => [rule.id, rule]));
  assert.equal(
    byId.get('heuristics.ts.fs-lchmod-callback.ast')?.then.code,
    'HEURISTICS_FS_LCHMOD_CALLBACK_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.fs-ftruncate-callback.ast')?.then.code,
    'HEURISTICS_FS_FTRUNCATE_CALLBACK_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.fs-lutimes-callback.ast')?.then.code,
    'HEURISTICS_FS_LUTIMES_CALLBACK_AST'
  );

  for (const rule of fsCallbacksMetadataRules) {
    assert.equal(rule.platform, 'generic');
    assert.equal(rule.severity, 'WARN');
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'Heuristic');
    assert.equal(rule.then.kind, 'Finding');
    assert.equal(rule.when.where?.ruleId, rule.id);
  }
});
