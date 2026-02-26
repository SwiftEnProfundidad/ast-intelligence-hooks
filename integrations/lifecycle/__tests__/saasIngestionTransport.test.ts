import assert from 'node:assert/strict';
import test from 'node:test';
import { createHotspotsSaasIngestionPayload } from '../saasIngestionContract';
import { createHotspotsSaasIngestionIdempotencyKey } from '../saasIngestionIdempotency';
import {
  sendHotspotsSaasIngestionPayload,
  type HotspotsSaasIngestionTransportFetch,
} from '../saasIngestionTransport';

const payload = createHotspotsSaasIngestionPayload({
  tenantId: 'tenant-transport',
  repositoryId: 'repo-transport',
  repositoryName: 'ast-intelligence-hooks',
  producerVersion: '6.3.17',
  generatedAt: '2026-02-26T11:30:00+00:00',
  report: {
    generatedAt: '2026-02-26T11:30:00+00:00',
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

test('sendHotspotsSaasIngestionPayload devuelve success en primer intento', async () => {
  const fetchCalls: Array<{
    url: string;
    method?: string;
    auth?: string;
    apiKey?: string;
    idempotencyKey?: string;
    tenantId?: string;
    repositoryId?: string;
  }> = [];
  const fetchImpl: HotspotsSaasIngestionTransportFetch = async (url, init) => {
    const headers = (init?.headers ?? {}) as Record<string, string>;
    fetchCalls.push({
      url: String(url),
      method: init?.method,
      auth: headers.authorization,
      apiKey: headers['x-api-key'],
      idempotencyKey: headers['idempotency-key'],
      tenantId: headers['x-tenant-id'],
      repositoryId: headers['x-repository-id'],
    });
    return new Response('ok', {
      status: 202,
      headers: { 'x-request-id': 'req-1' },
    });
  };

  const result = await sendHotspotsSaasIngestionPayload({
    endpoint: 'https://example.com/ingest',
    token: 'token-123',
    apiKey: 'key-123',
    payload,
    fetchImpl,
  });

  assert.equal(result.kind, 'success');
  if (result.kind === 'success') {
    assert.equal(result.status, 202);
    assert.equal(result.attempts, 1);
    assert.equal(result.requestId, 'req-1');
    assert.equal(result.idempotencyKey, createHotspotsSaasIngestionIdempotencyKey(payload));
  }
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0]?.url, 'https://example.com/ingest');
  assert.equal(fetchCalls[0]?.method, 'POST');
  assert.equal(fetchCalls[0]?.auth, 'Bearer token-123');
  assert.equal(fetchCalls[0]?.apiKey, 'key-123');
  assert.equal(fetchCalls[0]?.idempotencyKey, createHotspotsSaasIngestionIdempotencyKey(payload));
  assert.equal(fetchCalls[0]?.tenantId, payload.tenant_id);
  assert.equal(fetchCalls[0]?.repositoryId, payload.repository.repository_id);
});

test('sendHotspotsSaasIngestionPayload reintenta en 503 y acaba en success', async () => {
  let attempts = 0;
  const waits: number[] = [];
  const fetchImpl: HotspotsSaasIngestionTransportFetch = async () => {
    attempts += 1;
    if (attempts === 1) {
      return new Response('busy', { status: 503 });
    }
    return new Response('ok', { status: 200 });
  };

  const result = await sendHotspotsSaasIngestionPayload({
    endpoint: 'https://example.com/ingest',
    payload,
    fetchImpl,
    maxRetries: 2,
    retryBaseDelayMs: 5,
    waitForRetry: async (delayMs) => {
      waits.push(delayMs);
    },
  });

  assert.equal(result.kind, 'success');
  if (result.kind === 'success') {
    assert.equal(result.attempts, 2);
  }
  assert.deepEqual(waits, [5]);
});

test('sendHotspotsSaasIngestionPayload devuelve TIMEOUT cuando expira timeout', async () => {
  const fetchImpl: HotspotsSaasIngestionTransportFetch = (_url, init) => {
    return new Promise((_resolve, reject) => {
      const signal = init?.signal;
      signal?.addEventListener('abort', () => {
        reject(new DOMException('aborted', 'AbortError'));
      });
    });
  };

  const result = await sendHotspotsSaasIngestionPayload({
    endpoint: 'https://example.com/ingest',
    payload,
    fetchImpl,
    timeoutMs: 5,
    maxRetries: 0,
  });

  assert.equal(result.kind, 'error');
  if (result.kind === 'error') {
    assert.equal(result.code, 'TIMEOUT');
    assert.equal(result.attempts, 1);
  }
});

test('sendHotspotsSaasIngestionPayload no reintenta en HTTP no recuperable', async () => {
  let attempts = 0;
  const fetchImpl: HotspotsSaasIngestionTransportFetch = async () => {
    attempts += 1;
    return new Response('bad request', { status: 400 });
  };

  const result = await sendHotspotsSaasIngestionPayload({
    endpoint: 'https://example.com/ingest',
    payload,
    fetchImpl,
    maxRetries: 3,
  });

  assert.equal(result.kind, 'error');
  if (result.kind === 'error') {
    assert.equal(result.code, 'HTTP_STATUS');
    assert.equal(result.status, 400);
    assert.equal(result.attempts, 1);
  }
  assert.equal(attempts, 1);
});

test('sendHotspotsSaasIngestionPayload acepta idempotency key explícita', async () => {
  const fetchImpl: HotspotsSaasIngestionTransportFetch = async (_url, init) => {
    const headers = (init?.headers ?? {}) as Record<string, string>;
    return new Response(headers['idempotency-key'] ?? '', { status: 200 });
  };
  const result = await sendHotspotsSaasIngestionPayload({
    endpoint: 'https://example.com/ingest',
    payload,
    idempotencyKey: 'custom-key-123',
    fetchImpl,
  });
  assert.equal(result.kind, 'success');
  if (result.kind === 'success') {
    assert.equal(result.idempotencyKey, 'custom-key-123');
    assert.equal(result.responseBody, 'custom-key-123');
  }
});

test('sendHotspotsSaasIngestionPayload bloquea override de aislamiento inconsistente', async () => {
  const fetchImpl: HotspotsSaasIngestionTransportFetch = async () => {
    return new Response('ok', { status: 200 });
  };
  const result = await sendHotspotsSaasIngestionPayload({
    endpoint: 'https://example.com/ingest',
    payload,
    fetchImpl,
    headers: {
      'x-tenant-id': 'other-tenant',
    },
  });
  assert.equal(result.kind, 'error');
  if (result.kind === 'error') {
    assert.equal(result.code, 'ISOLATION_VIOLATION');
    assert.equal(result.retryable, false);
    assert.equal(result.attempts, 0);
  }
});

test('sendHotspotsSaasIngestionPayload bloquea auth policy inválida antes de enviar', async () => {
  let called = 0;
  const fetchImpl: HotspotsSaasIngestionTransportFetch = async () => {
    called += 1;
    return new Response('ok', { status: 200 });
  };
  const result = await sendHotspotsSaasIngestionPayload({
    endpoint: 'https://example.com/ingest',
    payload,
    token: 'token-invalid',
    fetchImpl,
    authPolicy: {
      required: true,
      scheme: 'bearer',
      rotatedAt: '2026-02-26T10:00:00+00:00',
      expiresAt: '2026-02-26T11:00:00+00:00',
      scopeTenantId: payload.tenant_id,
      scopeRepositoryId: payload.repository.repository_id,
      now: '2026-02-26T12:00:00+00:00',
    },
  });
  assert.equal(result.kind, 'error');
  if (result.kind === 'error') {
    assert.equal(result.code, 'AUTH_POLICY_VIOLATION');
    assert.equal(result.retryable, false);
    assert.equal(result.attempts, 0);
  }
  assert.equal(called, 0);
});
