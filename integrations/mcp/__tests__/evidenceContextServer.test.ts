import assert from 'node:assert/strict';
import { once } from 'node:events';
import test from 'node:test';
import { startEvidenceContextServer } from '../evidenceContextServer';
import { withTempDir } from '../../__tests__/helpers/tempDir';

const withStartedServer = async (
  repoRoot: string,
  options: { route?: string } = {},
  callback: (baseUrl: string, route: string) => Promise<void>
): Promise<void> => {
  const handle = startEvidenceContextServer({
    host: '127.0.0.1',
    port: 0,
    repoRoot,
    ...options,
  });

  try {
    await once(handle.server, 'listening');
    const address = handle.server.address();
    assert.ok(address && typeof address === 'object');
    const baseUrl = `http://127.0.0.1:${address.port}`;
    await callback(baseUrl, handle.route);
  } finally {
    await new Promise<void>((resolve) => handle.server.close(() => resolve()));
  }
};

test('normalizes custom route and keeps host/port contract', async () => {
  await withTempDir('pumuki-evidence-server-direct-', async (repoRoot) => {
    const handle = startEvidenceContextServer({
      host: '127.0.0.1',
      port: 0,
      route: 'custom-route///',
      repoRoot,
    });
    try {
      await once(handle.server, 'listening');
      assert.equal(handle.host, '127.0.0.1');
      assert.equal(handle.port, 0);
      assert.equal(handle.route, '/custom-route');
    } finally {
      await new Promise<void>((resolve) => handle.server.close(() => resolve()));
    }
  });
});

test('returns 405 for non-GET requests', async () => {
  await withTempDir('pumuki-evidence-server-direct-', async (repoRoot) => {
    await withStartedServer(repoRoot, {}, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health`, { method: 'POST' });
      assert.equal(response.status, 405);
      const payload = (await response.json()) as { error?: string };
      assert.equal(payload.error, 'Method not allowed');
    });
  });
});

test('returns degraded status and 404 on normalized custom evidence route when file is missing', async () => {
  await withTempDir('pumuki-evidence-server-direct-', async (repoRoot) => {
    await withStartedServer(repoRoot, { route: 'evidence///' }, async (baseUrl, route) => {
      assert.equal(route, '/evidence');

      const statusResponse = await fetch(`${baseUrl}/status`);
      assert.equal(statusResponse.status, 200);
      const statusPayload = (await statusResponse.json()) as {
        status?: string;
        evidence?: {
          exists?: boolean;
          present?: boolean;
          valid?: boolean;
          findings_count?: number;
        };
      };
      assert.equal(statusPayload.status, 'degraded');
      assert.equal(statusPayload.evidence?.exists, false);
      assert.equal(statusPayload.evidence?.present, false);
      assert.equal(statusPayload.evidence?.valid, false);
      assert.equal(statusPayload.evidence?.findings_count, 0);

      const evidenceResponse = await fetch(`${baseUrl}${route}`);
      assert.equal(evidenceResponse.status, 404);
      const evidencePayload = (await evidenceResponse.json()) as { error?: string };
      assert.equal(evidencePayload.error, 'Evidence file not found or invalid');
    });
  });
});
