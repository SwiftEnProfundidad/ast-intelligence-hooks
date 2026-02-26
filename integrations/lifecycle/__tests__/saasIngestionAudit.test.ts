import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import { createHotspotsSaasIngestionPayload } from '../saasIngestionContract';
import { createHotspotsSaasIngestionIdempotencyKey } from '../saasIngestionIdempotency';
import {
  createHotspotsSaasIngestionAuditEvent,
  sendHotspotsSaasIngestionPayloadWithAudit,
} from '../saasIngestionAudit';
import type { HotspotsSaasIngestionTransportFetch } from '../saasIngestionTransport';

const payload = createHotspotsSaasIngestionPayload({
  tenantId: 'tenant-audit',
  repositoryId: 'repo-audit',
  repositoryName: 'ast-intelligence-hooks',
  producerVersion: '6.3.17',
  generatedAt: '2026-02-26T12:40:00+00:00',
  report: {
    generatedAt: '2026-02-26T12:40:00+00:00',
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

test('createHotspotsSaasIngestionAuditEvent genera evento determinista', () => {
  const idempotencyKey = createHotspotsSaasIngestionIdempotencyKey(payload);
  const event = createHotspotsSaasIngestionAuditEvent({
    endpoint: 'https://example.com/ingest',
    payload,
    eventAt: '2026-02-26T12:45:00+00:00',
    result: {
      kind: 'success',
      status: 202,
      attempts: 1,
      durationMs: 42,
      idempotencyKey,
      requestId: 'req-audit',
      responseBody: 'ok',
    },
  });

  assert.match(event.event_id, /^saas-ingestion-[a-f0-9]{24}$/);
  assert.equal(event.event_at, '2026-02-26T12:45:00+00:00');
  assert.equal(event.outcome, 'success');
  assert.equal(event.idempotency_key, idempotencyKey);
  assert.equal(event.latency_ms, 42);
});

test('sendHotspotsSaasIngestionPayloadWithAudit persiste evento NDJSON', async () => {
  await withTempDir('pumuki-saas-audit-', async (tempRoot) => {
    const fetchImpl: HotspotsSaasIngestionTransportFetch = async () => {
      return new Response('ok', {
        status: 200,
        headers: { 'x-request-id': 'req-audit-1' },
      });
    };

    const output = await sendHotspotsSaasIngestionPayloadWithAudit({
      repoRoot: tempRoot,
      endpoint: 'https://example.com/ingest',
      payload,
      token: 'token-ok',
      authPolicy: {
        required: true,
        scheme: 'bearer',
        rotatedAt: '2026-02-26T10:00:00+00:00',
        expiresAt: '2026-02-26T13:00:00+00:00',
        scopeTenantId: payload.tenant_id,
        scopeRepositoryId: payload.repository.repository_id,
        now: '2026-02-26T12:45:00+00:00',
      },
      eventAt: '2026-02-26T12:45:00+00:00',
      fetchImpl,
    });

    assert.equal(output.result.kind, 'success');
    const lines = readFileSync(output.auditPath, 'utf8')
      .trim()
      .split('\n')
      .filter((line) => line.length > 0);
    assert.equal(lines.length, 1);
    const stored = JSON.parse(lines[0] ?? '{}') as {
      event_id?: string;
      outcome?: string;
      tenant_id?: string;
      repository_id?: string;
    };
    assert.equal(stored.outcome, 'success');
    assert.equal(stored.tenant_id, payload.tenant_id);
    assert.equal(stored.repository_id, payload.repository.repository_id);
    assert.equal(stored.event_id, output.event.event_id);
  });
});
