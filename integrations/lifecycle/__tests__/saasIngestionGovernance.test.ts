import assert from 'node:assert/strict';
import test from 'node:test';
import { createHotspotsSaasIngestionPayload } from '../saasIngestionContract';
import {
  applyHotspotsSaasGovernancePrivacy,
  createHotspotsSaasGovernancePolicy,
  createHotspotsSaasGovernancePolicyHash,
  validateHotspotsSaasGovernancePolicy,
} from '../saasIngestionGovernance';
import type { LocalHotspotsReport } from '../analyticsHotspots';

const report: LocalHotspotsReport = {
  generatedAt: '2026-02-26T00:00:00.000Z',
  repoRoot: '/repo',
  options: {
    topN: 1,
    sinceDays: 30,
  },
  totals: {
    churnSignals: 1,
    technicalSignals: 1,
    ranked: 1,
  },
  hotspots: [
    {
      rank: 1,
      path: 'src/a.ts',
      rawScore: 9,
      normalizedScore: 1,
      findingsTotal: 3,
      findingsByEnterpriseSeverity: {
        CRITICAL: 1,
        HIGH: 1,
        MEDIUM: 1,
        LOW: 0,
      },
      findingsDistinctRules: 2,
      churnCommits: 2,
      churnDistinctAuthors: 1,
      churnTotalLines: 10,
    },
  ],
};

test('createHotspotsSaasGovernancePolicyHash es determinista', () => {
  const policy = createHotspotsSaasGovernancePolicy({
    tenantId: 'tenant-a',
    repositoryId: 'repo-a',
    generatedAt: '2026-02-26T10:00:00.000Z',
  });

  const hashA = createHotspotsSaasGovernancePolicyHash(policy);
  const hashB = createHotspotsSaasGovernancePolicyHash({ ...policy });
  assert.equal(hashA, hashB);
});

test('validateHotspotsSaasGovernancePolicy valida tenant/repository contra payload', () => {
  const policy = createHotspotsSaasGovernancePolicy({
    tenantId: 'tenant-a',
    repositoryId: 'repo-a',
    generatedAt: '2026-02-26T10:00:00.000Z',
  });

  const payload = createHotspotsSaasIngestionPayload({
    tenantId: 'tenant-a',
    repositoryId: 'repo-a',
    repositoryName: 'repo',
    report,
    producerVersion: '6.3.17',
    generatedAt: '2026-02-26T10:00:00.000Z',
  });

  assert.deepEqual(
    validateHotspotsSaasGovernancePolicy({
      policy,
      payload,
    }),
    { kind: 'valid' }
  );

  const invalid = validateHotspotsSaasGovernancePolicy({
    policy,
    payload: {
      tenant_id: 'tenant-b',
      repository: {
        repository_id: 'repo-a',
      },
    },
  });
  assert.equal(invalid.kind, 'invalid');
  if (invalid.kind === 'invalid') {
    assert.equal(invalid.reason, 'tenant_mismatch');
  }
});

test('applyHotspotsSaasGovernancePrivacy anonimiza ids cuando policy lo exige', () => {
  const policy = createHotspotsSaasGovernancePolicy({
    tenantId: 'tenant-a',
    repositoryId: 'repo-a',
    generatedAt: '2026-02-26T10:00:00.000Z',
    redactTenantId: true,
    redactRepositoryId: true,
    hashPayloadHash: true,
  });

  const sanitized = applyHotspotsSaasGovernancePrivacy({
    policy,
    event: {
      event_id: 'event-1',
      event_at: '2026-02-26T10:00:00.000Z',
      tenant_id: 'tenant-a',
      repository_id: 'repo-a',
      endpoint: 'https://saas.example.com',
      idempotency_key: 'idem-1',
      payload_hash: 'abcdef',
      outcome: 'success',
      attempts: 1,
      latency_ms: 30,
      status: 200,
    },
  });

  assert.equal(sanitized.tenant_id.startsWith('sha256:'), true);
  assert.equal(sanitized.repository_id.startsWith('sha256:'), true);
  assert.equal(sanitized.payload_hash.startsWith('sha256:'), true);
});
