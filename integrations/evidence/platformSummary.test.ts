import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSnapshotPlatformSummaries } from './platformSummary';

test('buildSnapshotPlatformSummaries mantiene las cinco plataformas y prioriza skills directas', () => {
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
  assert.equal(frontend?.files_affected, 1);
  assert.equal(other?.files_affected, 1);

  assert.equal(backend?.by_severity.HIGH, 1);
  assert.equal(backend?.by_severity.MEDIUM, 1);
  assert.equal(frontend?.by_severity.HIGH, 0);
  assert.equal(frontend?.by_severity.MEDIUM, 1);
});

test('buildSnapshotPlatformSummaries clasifica heuristicas por binding de skills y usa path como desempate', () => {
  const summaries = buildSnapshotPlatformSummaries([
    {
      ruleId: 'heuristics.ios.navigation-view.ast',
      severity: 'ERROR',
      file: 'scripts/detectors/navigation.ts',
    },
    {
      ruleId: 'heuristics.android.thread-sleep.ast',
      severity: 'WARN',
      file: 'scripts/detectors/thread.ts',
    },
    {
      ruleId: 'heuristics.ts.empty-catch.ast',
      severity: 'WARN',
      file: 'packages/frontend/src/App.tsx',
    },
    {
      ruleId: 'heuristics.ts.empty-catch.ast',
      severity: 'WARN',
      file: 'services/backend/src/service.ts',
    },
  ]);

  const ios = summaries.find((item) => item.platform === 'iOS');
  const android = summaries.find((item) => item.platform === 'Android');
  const backend = summaries.find((item) => item.platform === 'Backend');
  const frontend = summaries.find((item) => item.platform === 'Frontend');

  assert.equal(ios?.files_affected, 1);
  assert.equal(android?.files_affected, 1);
  assert.equal(backend?.files_affected, 1);
  assert.equal(frontend?.files_affected, 1);
  assert.equal(ios?.top_violations[0]?.rule_id, 'heuristics.ios.navigation-view.ast');
  assert.equal(android?.top_violations[0]?.rule_id, 'heuristics.android.thread-sleep.ast');
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

test('buildSnapshotPlatformSummaries usa path fallback solo cuando no hay binding de skill', () => {
  const summaries = buildSnapshotPlatformSummaries([
    {
      ruleId: 'heuristics.ts.child-process-spawn.ast',
      severity: 'WARN',
      file: 'packages/frontend/src/main.ts',
    },
    {
      ruleId: 'common.types.undefined_in_base_type',
      severity: 'WARN',
      file: 'services/backend/src/renderer.ts',
    },
  ]);

  const backend = summaries.find((item) => item.platform === 'Backend');
  const frontend = summaries.find((item) => item.platform === 'Frontend');

  assert.ok(backend);
  assert.ok(frontend);
  assert.equal(backend?.files_affected, 1);
  assert.equal(frontend?.files_affected, 1);
  assert.equal(backend?.top_violations[0]?.rule_id, 'common.types.undefined_in_base_type');
  assert.equal(frontend?.top_violations[0]?.rule_id, 'heuristics.ts.child-process-spawn.ast');
});

test('buildSnapshotPlatformSummaries normaliza separadores de ruta para files_affected', () => {
  const summaries = buildSnapshotPlatformSummaries([
    {
      ruleId: 'skills.backend.no-empty-catch',
      severity: 'ERROR',
      file: 'apps\\backend\\src\\service.ts',
    },
    {
      ruleId: 'skills.backend.no-console-log',
      severity: 'WARN',
      file: 'apps/backend/src/service.ts',
    },
  ]);

  const backend = summaries.find((item) => item.platform === 'Backend');
  assert.ok(backend);
  assert.equal(backend?.files_affected, 1);
  assert.equal(backend?.by_severity.HIGH, 1);
  assert.equal(backend?.by_severity.MEDIUM, 1);
});

test('buildSnapshotPlatformSummaries expone cobertura de reglas por plataforma', () => {
  const summaries = buildSnapshotPlatformSummaries([], {
    activeRuleIds: [
      'skills.ios.no-force-unwrap',
      'heuristics.android.thread-sleep.ast',
      'heuristics.ts.empty-catch.ast',
      'common.types.undefined_in_base_type',
    ],
    evaluatedRuleIds: [
      'skills.ios.no-force-unwrap',
      'heuristics.android.thread-sleep.ast',
      'common.types.undefined_in_base_type',
    ],
  });

  const ios = summaries.find((item) => item.platform === 'iOS');
  const android = summaries.find((item) => item.platform === 'Android');
  const other = summaries.find((item) => item.platform === 'Other');

  assert.equal(ios?.active_rules, 1);
  assert.equal(ios?.evaluated_rules, 1);
  assert.equal(android?.active_rules, 1);
  assert.equal(android?.evaluated_rules, 1);
  assert.equal(other?.active_rules, 2);
  assert.equal(other?.evaluated_rules, 1);
});
