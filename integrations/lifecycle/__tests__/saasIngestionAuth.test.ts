import assert from 'node:assert/strict';
import test from 'node:test';
import { createHotspotsSaasIngestionPayload } from '../saasIngestionContract';
import { validateHotspotsSaasIngestionAuthPolicy } from '../saasIngestionAuth';

const payload = createHotspotsSaasIngestionPayload({
  tenantId: 'tenant-auth',
  repositoryId: 'repo-auth',
  repositoryName: 'ast-intelligence-hooks',
  producerVersion: '6.3.17',
  generatedAt: '2026-02-26T12:20:00+00:00',
  report: {
    generatedAt: '2026-02-26T12:20:00+00:00',
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

test('validateHotspotsSaasIngestionAuthPolicy valida token rotado y scope correcto', () => {
  const result = validateHotspotsSaasIngestionAuthPolicy({
    payload,
    token: 'token-valid',
    authPolicy: {
      required: true,
      scheme: 'bearer',
      rotatedAt: '2026-02-26T12:00:00+00:00',
      expiresAt: '2026-02-26T13:00:00+00:00',
      scopeTenantId: payload.tenant_id,
      scopeRepositoryId: payload.repository.repository_id,
      now: '2026-02-26T12:30:00+00:00',
    },
  });
  assert.equal(result.kind, 'valid');
});

test('validateHotspotsSaasIngestionAuthPolicy rechaza token expirado', () => {
  const result = validateHotspotsSaasIngestionAuthPolicy({
    payload,
    token: 'token-expired',
    authPolicy: {
      required: true,
      scheme: 'bearer',
      rotatedAt: '2026-02-26T10:00:00+00:00',
      expiresAt: '2026-02-26T11:00:00+00:00',
      scopeTenantId: payload.tenant_id,
      scopeRepositoryId: payload.repository.repository_id,
      now: '2026-02-26T12:30:00+00:00',
    },
  });
  assert.equal(result.kind, 'invalid');
  if (result.kind === 'invalid') {
    assert.equal(result.reason, 'token_expired');
  }
});

test('validateHotspotsSaasIngestionAuthPolicy rechaza scope inconsistente', () => {
  const result = validateHotspotsSaasIngestionAuthPolicy({
    payload,
    token: 'token-scope',
    authPolicy: {
      required: true,
      scheme: 'bearer',
      rotatedAt: '2026-02-26T10:00:00+00:00',
      expiresAt: '2026-02-26T13:00:00+00:00',
      scopeTenantId: 'other-tenant',
      scopeRepositoryId: payload.repository.repository_id,
      now: '2026-02-26T12:30:00+00:00',
    },
  });
  assert.equal(result.kind, 'invalid');
  if (result.kind === 'invalid') {
    assert.equal(result.reason, 'scope_tenant_mismatch');
  }
});
