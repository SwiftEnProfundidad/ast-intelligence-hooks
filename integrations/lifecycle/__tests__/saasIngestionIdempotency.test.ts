import assert from 'node:assert/strict';
import test from 'node:test';
import { createHotspotsSaasIngestionPayload } from '../saasIngestionContract';
import {
  HOTSPOTS_SAAS_INGESTION_IDEMPOTENCY_PREFIX,
  createHotspotsSaasIngestionIdempotencyKey,
} from '../saasIngestionIdempotency';

const payload = createHotspotsSaasIngestionPayload({
  tenantId: 'tenant-idempotency',
  repositoryId: 'repo-idempotency',
  repositoryName: 'ast-intelligence-hooks',
  producerVersion: '6.3.17',
  generatedAt: '2026-02-26T12:00:00+00:00',
  report: {
    generatedAt: '2026-02-26T12:00:00+00:00',
    repoRoot: '/tmp/repo',
    options: {
      topN: 1,
      sinceDays: 90,
    },
    totals: {
      churnSignals: 1,
      technicalSignals: 1,
      ranked: 1,
    },
    hotspots: [
      {
        rank: 1,
        path: 'src/core.ts',
        rawScore: 10,
        normalizedScore: 1,
        findingsTotal: 1,
        findingsByEnterpriseSeverity: {
          CRITICAL: 0,
          HIGH: 1,
          MEDIUM: 0,
          LOW: 0,
        },
        findingsDistinctRules: 1,
        churnCommits: 1,
        churnDistinctAuthors: 1,
        churnTotalLines: 6,
      },
    ],
  },
});

test('createHotspotsSaasIngestionIdempotencyKey es determinista para el mismo payload', () => {
  const first = createHotspotsSaasIngestionIdempotencyKey(payload);
  const second = createHotspotsSaasIngestionIdempotencyKey(payload);
  assert.equal(first, second);
  assert.match(
    first,
    new RegExp(`^${HOTSPOTS_SAAS_INGESTION_IDEMPOTENCY_PREFIX}-[a-f0-9]{32}$`)
  );
});

test('createHotspotsSaasIngestionIdempotencyKey cambia si cambia el payload lógico', () => {
  const first = createHotspotsSaasIngestionIdempotencyKey(payload);
  const changed = createHotspotsSaasIngestionPayload({
    tenantId: 'tenant-idempotency',
    repositoryId: 'repo-idempotency',
    repositoryName: 'ast-intelligence-hooks',
    producerVersion: '6.3.17',
    generatedAt: '2026-02-26T12:00:01+00:00',
    report: {
      generatedAt: '2026-02-26T12:00:01+00:00',
      repoRoot: '/tmp/repo',
      options: {
        topN: 1,
        sinceDays: 90,
      },
      totals: {
        churnSignals: 1,
        technicalSignals: 1,
        ranked: 1,
      },
      hotspots: [
        {
          rank: 1,
          path: 'src/core.ts',
          rawScore: 10,
          normalizedScore: 1,
          findingsTotal: 1,
          findingsByEnterpriseSeverity: {
            CRITICAL: 0,
            HIGH: 1,
            MEDIUM: 0,
            LOW: 0,
          },
          findingsDistinctRules: 1,
          churnCommits: 1,
          churnDistinctAuthors: 1,
          churnTotalLines: 6,
        },
      ],
    },
  });
  const second = createHotspotsSaasIngestionIdempotencyKey(changed);
  assert.notEqual(first, second);
});
