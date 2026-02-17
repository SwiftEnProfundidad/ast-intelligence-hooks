import assert from 'node:assert/strict';
import test from 'node:test';
import { fsSyncDescriptorRules } from './fsSyncDescriptorRules';

test('fsSyncDescriptorRules define reglas heurísticas locked de fs descriptor sync', () => {
  assert.equal(fsSyncDescriptorRules.length, 18);

  const ids = fsSyncDescriptorRules.map((rule) => rule.id);
  assert.deepEqual(ids, [
    'heuristics.ts.fs-fstat-sync.ast',
    'heuristics.ts.fs-ftruncate-sync.ast',
    'heuristics.ts.fs-futimes-sync.ast',
    'heuristics.ts.fs-lutimes-sync.ast',
    'heuristics.ts.fs-readv-sync.ast',
    'heuristics.ts.fs-writev-sync.ast',
    'heuristics.ts.fs-write-sync.ast',
    'heuristics.ts.fs-fsync-sync.ast',
    'heuristics.ts.fs-fdatasync-sync.ast',
    'heuristics.ts.fs-close-sync.ast',
    'heuristics.ts.fs-read-sync.ast',
    'heuristics.ts.fs-readlink-sync.ast',
    'heuristics.ts.fs-symlink-sync.ast',
    'heuristics.ts.fs-link-sync.ast',
    'heuristics.ts.fs-cp-sync.ast',
    'heuristics.ts.fs-open-sync.ast',
    'heuristics.ts.fs-opendir-sync.ast',
    'heuristics.ts.fs-mkdtemp-sync.ast',
  ]);

  const byId = new Map(fsSyncDescriptorRules.map((rule) => [rule.id, rule]));
  assert.equal(
    byId.get('heuristics.ts.fs-fstat-sync.ast')?.then.code,
    'HEURISTICS_FS_FSTAT_SYNC_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.fs-fdatasync-sync.ast')?.then.code,
    'HEURISTICS_FS_FDATASYNC_SYNC_AST'
  );
  assert.equal(
    byId.get('heuristics.ts.fs-mkdtemp-sync.ast')?.then.code,
    'HEURISTICS_FS_MKDTEMP_SYNC_AST'
  );

  for (const rule of fsSyncDescriptorRules) {
    assert.equal(rule.platform, 'generic');
    assert.equal(rule.severity, 'WARN');
    assert.equal(rule.locked, true);
    assert.equal(rule.when.kind, 'Heuristic');
    assert.equal(rule.then.kind, 'Finding');
    assert.equal(rule.when.where?.ruleId, rule.id);
  }
});
