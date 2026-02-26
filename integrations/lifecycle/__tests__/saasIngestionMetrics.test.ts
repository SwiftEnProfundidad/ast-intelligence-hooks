import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import type { HotspotsSaasIngestionAuditEvent } from '../saasIngestionAudit';
import {
  buildHotspotsSaasIngestionMetrics,
  buildHotspotsSaasIngestionMetricsFromEvents,
  resolveHotspotsSaasIngestionMetricsPath,
  writeHotspotsSaasIngestionMetrics,
} from '../saasIngestionMetrics';

const eventsFixture: ReadonlyArray<HotspotsSaasIngestionAuditEvent> = [
  {
    event_id: 'e1',
    event_at: '2026-02-26T12:00:00+00:00',
    tenant_id: 'tenant',
    repository_id: 'repo',
    endpoint: 'https://example.com/ingest',
    idempotency_key: 'k1',
    payload_hash: 'h1',
    outcome: 'success',
    attempts: 1,
    latency_ms: 100,
    status: 200,
  },
  {
    event_id: 'e2',
    event_at: '2026-02-26T12:00:10+00:00',
    tenant_id: 'tenant',
    repository_id: 'repo',
    endpoint: 'https://example.com/ingest',
    idempotency_key: 'k2',
    payload_hash: 'h2',
    outcome: 'error',
    attempts: 2,
    latency_ms: 500,
    error_code: 'HTTP_STATUS',
    retryable: true,
    status: 503,
  },
];

test('buildHotspotsSaasIngestionMetricsFromEvents calcula success/error/latency', () => {
  const metrics = buildHotspotsSaasIngestionMetricsFromEvents({
    events: eventsFixture,
    sourcePath: '/tmp/audit.ndjson',
    generatedAt: '2026-02-26T12:01:00+00:00',
  });

  assert.equal(metrics.generated_at, '2026-02-26T12:01:00+00:00');
  assert.equal(metrics.totals.events, 2);
  assert.equal(metrics.totals.success, 1);
  assert.equal(metrics.totals.error, 1);
  assert.equal(metrics.totals.success_rate, 0.5);
  assert.equal(metrics.attempts.avg, 1.5);
  assert.equal(metrics.attempts.max, 2);
  assert.equal(metrics.latency_ms.min, 100);
  assert.equal(metrics.latency_ms.max, 500);
  assert.equal(metrics.latency_ms.avg, 300);
  assert.equal(metrics.errors_by_code.HTTP_STATUS, 1);
});

test('build/write metrics usa eventos NDJSON y persiste JSON', async () => {
  await withTempDir('pumuki-saas-metrics-', async (tempRoot) => {
    const previousAuditPath = process.env.PUMUKI_SAAS_INGESTION_AUDIT_PATH;
    const previousMetricsPath = process.env.PUMUKI_SAAS_INGESTION_METRICS_PATH;
    process.env.PUMUKI_SAAS_INGESTION_AUDIT_PATH = '.pumuki/artifacts/audit.ndjson';
    process.env.PUMUKI_SAAS_INGESTION_METRICS_PATH = '.pumuki/artifacts/metrics.json';
    try {
      const auditPath = join(tempRoot, '.pumuki', 'artifacts', 'audit.ndjson');
      mkdirSync(join(tempRoot, '.pumuki', 'artifacts'), { recursive: true });
      writeFileSync(
        auditPath,
        `${JSON.stringify(eventsFixture[0])}\n${JSON.stringify(eventsFixture[1])}\n`,
        'utf8'
      );

      const metrics = buildHotspotsSaasIngestionMetrics({
        repoRoot: tempRoot,
        generatedAt: '2026-02-26T12:02:00+00:00',
      });
      const writtenPath = writeHotspotsSaasIngestionMetrics({
        repoRoot: tempRoot,
        metrics,
      });

      assert.equal(writtenPath, resolveHotspotsSaasIngestionMetricsPath(tempRoot));
      const written = JSON.parse(readFileSync(writtenPath, 'utf8')) as {
        totals?: { events?: number };
        latency_ms?: { p95?: number };
      };
      assert.equal(written.totals?.events, 2);
      assert.equal(written.latency_ms?.p95, 500);
    } finally {
      if (typeof previousAuditPath === 'string') {
        process.env.PUMUKI_SAAS_INGESTION_AUDIT_PATH = previousAuditPath;
      } else {
        delete process.env.PUMUKI_SAAS_INGESTION_AUDIT_PATH;
      }
      if (typeof previousMetricsPath === 'string') {
        process.env.PUMUKI_SAAS_INGESTION_METRICS_PATH = previousMetricsPath;
      } else {
        delete process.env.PUMUKI_SAAS_INGESTION_METRICS_PATH;
      }
    }
  });
});
