import assert from 'node:assert/strict';
import { once } from 'node:events';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import { startEvidenceContextServer } from '../evidenceContextServer';

const createEvidencePayload = () => {
  return {
    version: '2.1',
    timestamp: '2026-02-01T10:00:00.000Z',
    snapshot: {
      stage: 'CI',
      outcome: 'PASS',
      findings: [],
    },
    ledger: [],
    platforms: {},
    rulesets: [],
    human_intent: null,
    ai_gate: {
      status: 'ALLOWED',
      violations: [],
      human_intent: null,
    },
    severity_metrics: {
      gate_status: 'ALLOWED',
      total_violations: 0,
      by_severity: {
        CRITICAL: 0,
        ERROR: 0,
        WARN: 0,
        INFO: 0,
      },
    },
    consolidation: {
      suppressed: [
        {
          ruleId: 'heuristics.ts.explicit-any.ast',
          file: 'apps/backend/src/main.ts',
          replacedByRuleId: 'backend.avoid-explicit-any',
          reason: 'semantic-family-precedence',
        },
      ],
    },
  };
};

const withEvidenceServer = async (
  repoRoot: string,
  callback: (baseUrl: string) => Promise<void>
): Promise<void> => {
  const started = startEvidenceContextServer({
    host: '127.0.0.1',
    port: 0,
    repoRoot,
  });

  try {
    await once(started.server, 'listening');
    const address = started.server.address();
    assert.ok(address && typeof address === 'object');
    const baseUrl = `http://127.0.0.1:${address.port}`;
    await callback(baseUrl);
  } finally {
    await new Promise<void>((resolve) => {
      started.server.close(() => resolve());
    });
  }
};

test('serves health endpoint', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health`);
      assert.equal(response.status, 200);
      const payload = (await response.json()) as { status?: string };
      assert.equal(payload.status, 'ok');
    });
  });
});

test('returns 404 when evidence file is missing', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/ai-evidence`);
      assert.equal(response.status, 404);
    });
  });
});

test('returns degraded status when evidence file is missing', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/status`);
      assert.equal(response.status, 200);
      const payload = (await response.json()) as {
        status?: string;
        evidence?: { present?: boolean; valid?: boolean; version?: string | null };
      };
      assert.equal(payload.status, 'degraded');
      assert.equal(payload.evidence?.present, false);
      assert.equal(payload.evidence?.valid, false);
      assert.equal(payload.evidence?.version, null);
    });
  });
});

test('returns summary status payload when evidence file is valid v2.1', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    writeFileSync(
      join(repoRoot, '.ai_evidence.json'),
      `${JSON.stringify(createEvidencePayload(), null, 2)}\n`,
      'utf8'
    );

    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/status`);
      assert.equal(response.status, 200);
      const payload = (await response.json()) as {
        status?: string;
        evidence?: {
          valid?: boolean;
          version?: string;
          stage?: string;
          outcome?: string;
          findings_count?: number;
          ledger_count?: number;
          rulesets_count?: number;
          platforms?: string[];
        };
      };
      assert.equal(payload.status, 'ok');
      assert.equal(payload.evidence?.valid, true);
      assert.equal(payload.evidence?.version, '2.1');
      assert.equal(payload.evidence?.stage, 'CI');
      assert.equal(payload.evidence?.outcome, 'PASS');
      assert.equal(payload.evidence?.findings_count, 0);
      assert.equal(payload.evidence?.ledger_count, 0);
      assert.equal(payload.evidence?.rulesets_count, 0);
      assert.deepEqual(payload.evidence?.platforms, []);
    });
  });
});

test('returns evidence payload when version is v2.1', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    writeFileSync(
      join(repoRoot, '.ai_evidence.json'),
      `${JSON.stringify(createEvidencePayload(), null, 2)}\n`,
      'utf8'
    );

    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/ai-evidence`);
      assert.equal(response.status, 200);
      const payload = (await response.json()) as {
        version?: string;
        consolidation?: { suppressed?: unknown[] };
      };
      assert.equal(payload.version, '2.1');
      assert.equal(payload.consolidation?.suppressed?.length, 1);
    });
  });
});

test('returns compact payload without consolidation when includeSuppressed=false', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    writeFileSync(
      join(repoRoot, '.ai_evidence.json'),
      `${JSON.stringify(createEvidencePayload(), null, 2)}\n`,
      'utf8'
    );

    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/ai-evidence?includeSuppressed=false`);
      assert.equal(response.status, 200);
      const payload = (await response.json()) as { consolidation?: unknown };
      assert.equal(payload.consolidation, undefined);
    });
  });
});

test('supports view=compact and view=full aliases for consolidation payload', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    writeFileSync(
      join(repoRoot, '.ai_evidence.json'),
      `${JSON.stringify(createEvidencePayload(), null, 2)}\n`,
      'utf8'
    );

    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const compactResponse = await fetch(`${baseUrl}/ai-evidence?view=compact`);
      assert.equal(compactResponse.status, 200);
      const compactPayload = (await compactResponse.json()) as { consolidation?: unknown };
      assert.equal(compactPayload.consolidation, undefined);

      const fullResponse = await fetch(`${baseUrl}/ai-evidence?view=full`);
      assert.equal(fullResponse.status, 200);
      const fullPayload = (await fullResponse.json()) as {
        consolidation?: { suppressed?: unknown[] };
      };
      assert.equal(fullPayload.consolidation?.suppressed?.length, 1);
    });
  });
});

test('returns 404 when evidence file version is not v2.1', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    writeFileSync(
      join(repoRoot, '.ai_evidence.json'),
      `${JSON.stringify({ version: '1.0' }, null, 2)}\n`,
      'utf8'
    );

    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/ai-evidence`);
      assert.equal(response.status, 404);
    });
  });
});
