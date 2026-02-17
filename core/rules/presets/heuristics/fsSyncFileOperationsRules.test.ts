import assert from 'node:assert/strict';
import test from 'node:test';
import { fsSyncFileOperationsRules } from './fsSyncFileOperationsRules';

test('fsSyncFileOperationsRules define reglas heurísticas locked de fs file operations sync', () => {
  assert.equal(fsSyncFileOperationsRules.length, 21);

  const ids = fsSyncFileOperationsRules.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'heuristics.ts.fs-write-file-sync.ast',
    'heuristics.ts.fs-rm-sync.ast',
    'heuristics.ts.fs-mkdir-sync.ast',
    'heuristics.ts.fs-readdir-sync.ast',
    'heuristics.ts.fs-read-file-sync.ast',
    'heuristics.ts.fs-stat-sync.ast',
    'heuristics.ts.fs-statfs-sync.ast',
    'heuristics.ts.fs-realpath-sync.ast',
    'heuristics.ts.fs-lstat-sync.ast',
    'heuristics.ts.fs-exists-sync.ast',
    'heuristics.ts.fs-access-sync.ast',
    'heuristics.ts.fs-utimes-sync.ast',
    'heuristics.ts.fs-rename-sync.ast',
    'heuristics.ts.fs-copy-file-sync.ast',
    'heuristics.ts.fs-unlink-sync.ast',
    'heuristics.ts.fs-truncate-sync.ast',
    'heuristics.ts.fs-rmdir-sync.ast',
    'heuristics.ts.fs-chmod-sync.ast',
    'heuristics.ts.fs-chown-sync.ast',
    'heuristics.ts.fs-fchown-sync.ast',
    'heuristics.ts.fs-fchmod-sync.ast',
  ]);

  const byId = new Map(fsSyncFileOperationsRules.map((rule) => [rule.id, rule]));
  assert.equal(
    byId.get('heuristics.ts.fs-write-file-sync.ast')?.then.code,
    'HEURISTICS_FS_WRITE_FILE_SYNC_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.fs-copy-file-sync.ast')?.then.code,
    'HEURISTICS_FS_COPY_FILE_SYNC_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.fs-fchmod-sync.ast')?.then.code,
    'HEURISTICS_FS_FCHMOD_SYNC_AST'
  );

  for (const rule of fsSyncFileOperationsRules) {
    assert.equal(rule.platform, 'generic');
    assert.equal(rule.severity, 'WARN');
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'Heuristic');
    assert.equal(rule.then.kind, 'Finding');
    assert.equal(rule.when.where?.ruleId, rule.id);
  }
});
