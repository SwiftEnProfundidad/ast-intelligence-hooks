import assert from 'node:assert/strict';
import test from 'node:test';
import {
  aggregateSaasFederationSignals,
  buildSaasFederationRiskScores,
  reconcileSaasFederationSnapshots,
  type SaasFederationSignal,
} from '../saasFederation';

const signals: SaasFederationSignal[] = [
  {
    tenant_id: 'tenant-a',
    repository_id: 'repo-a',
    path: 'src/a.ts',
    enterprise_severity: 'CRITICAL',
    risk_score: 9,
    churn_total_lines: 12,
    generated_at: '2026-02-26T10:00:00.000Z',
    payload_hash: 'hash-a',
  },
  {
    tenant_id: 'tenant-a',
    repository_id: 'repo-b',
    path: 'src/b.ts',
    enterprise_severity: 'HIGH',
    risk_score: 4,
    churn_total_lines: 8,
    generated_at: '2026-02-26T10:00:00.000Z',
    payload_hash: 'hash-b',
  },
  {
    tenant_id: 'tenant-a',
    repository_id: 'repo-b',
    path: 'src/c.ts',
    enterprise_severity: 'MEDIUM',
    risk_score: 2,
    churn_total_lines: 4,
    generated_at: '2026-02-26T10:00:00.000Z',
    payload_hash: 'hash-c',
  },
];

test('aggregateSaasFederationSignals aplica limites de repositorio y señales', () => {
  const aggregate = aggregateSaasFederationSignals({
    signals,
    limits: {
      max_repositories: 1,
      max_signals_per_repository: 1,
      max_total_signals: 1,
    },
  });

  assert.equal(aggregate.repositories.length, 1);
  assert.equal(aggregate.repositories[0]?.signals.length, 1);
  assert.equal(aggregate.totals.signals, 1);
  assert.equal(aggregate.totals.truncated_repositories, 1);
});

test('buildSaasFederationRiskScores ordena y rankea de forma determinista', () => {
  const aggregate = aggregateSaasFederationSignals({ signals });
  const scores = buildSaasFederationRiskScores({ aggregate });
  assert.equal(scores.length, 2);
  assert.equal(scores[0]?.rank, 1);
  assert.equal(scores[0]?.repository_id, 'repo-a');
});

test('reconcileSaasFederationSnapshots detecta drift y staleness', () => {
  const issues = reconcileSaasFederationSnapshots({
    now: '2026-02-26T10:00:00.000Z',
    staleAfterDays: 14,
    snapshots: [
      {
        tenant_id: 'tenant-a',
        repository_id: 'repo-a',
        generated_at: '2026-01-01T00:00:00.000Z',
        payload_hash: 'hash-old',
        signals: 2,
      },
      {
        tenant_id: 'tenant-a',
        repository_id: 'repo-a',
        generated_at: '2026-02-25T00:00:00.000Z',
        payload_hash: 'hash-new',
        signals: 3,
      },
    ],
  });

  assert.equal(issues.some((issue) => issue.code === 'hash_drift'), true);
  assert.equal(issues.some((issue) => issue.code === 'stale_snapshot'), false);
});
