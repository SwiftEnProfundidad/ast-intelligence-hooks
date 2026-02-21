import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSnapshotPlatformSummaries } from './platformSummary';

test('buildSnapshotPlatformSummaries mantiene las cinco plataformas y prioriza path en repos mixtos', () => {
  const summaries = buildSnapshotPlatformSummaries([
    {
      ruleId: 'skills.backend.no-console-log',
      severity: 'ERROR',
      file: 'apps/web/src/App.tsx',
    },
    {
      ruleId: 'skills.backend.no-empty-catch',
      severity: 'WARN',
      file: 'apps/backend/src/service.ts',
    },
    {
      ruleId: 'heuristics.ts.inner-html.ast',
      severity: 'WARN',
      file: 'scripts/ui.ts',
    },
    {
      ruleId: 'heuristics.ts.child-process-spawn.ast',
      severity: 'WARN',
      file: 'scripts/shell.ts',
    },
  ]);

  assert.equal(summaries.length, 5);
  assert.deepEqual(
    summaries.map((item) => item.platform),
    ['iOS', 'Android', 'Backend', 'Frontend', 'Other']
  );

  const ios = summaries.find((item) => item.platform === 'iOS');
  const android = summaries.find((item) => item.platform === 'Android');
  const backend = summaries.find((item) => item.platform === 'Backend');
  const frontend = summaries.find((item) => item.platform === 'Frontend');
  const other = summaries.find((item) => item.platform === 'Other');

  assert.ok(ios);
  assert.ok(android);
  assert.ok(backend);
  assert.ok(frontend);
  assert.ok(other);

  assert.equal(ios?.files_affected, 0);
  assert.equal(android?.files_affected, 0);
  assert.equal(backend?.files_affected, 2);
  assert.equal(frontend?.files_affected, 2);
  assert.equal(other?.files_affected, 0);

  assert.equal(backend?.by_severity.HIGH, 0);
  assert.equal(backend?.by_severity.MEDIUM, 2);
  assert.equal(frontend?.by_severity.HIGH, 1);
  assert.equal(frontend?.by_severity.MEDIUM, 1);
});

test('buildSnapshotPlatformSummaries es determinista sin depender del orden de findings', () => {
  const first = buildSnapshotPlatformSummaries([
    {
      ruleId: 'skills.ios.no-force-unwrap',
      severity: 'ERROR',
      file: 'scripts/a.ts',
    },
    {
      ruleId: 'skills.android.no-runblocking',
      severity: 'WARN',
      file: 'scripts/b.ts',
    },
    {
      ruleId: 'heuristics.ts.console-log.ast',
      severity: 'WARN',
      file: 'scripts/c.ts',
    },
  ]);

  const second = buildSnapshotPlatformSummaries([
    {
      ruleId: 'heuristics.ts.console-log.ast',
      severity: 'WARN',
      file: 'scripts/c.ts',
    },
    {
      ruleId: 'skills.android.no-runblocking',
      severity: 'WARN',
      file: 'scripts/b.ts',
    },
    {
      ruleId: 'skills.ios.no-force-unwrap',
      severity: 'ERROR',
      file: 'scripts/a.ts',
    },
  ]);

  assert.deepEqual(first, second);
});
