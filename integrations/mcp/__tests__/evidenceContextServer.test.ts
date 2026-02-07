import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { startEvidenceContextServer } from '../evidenceContextServer';

const createRepoRoot = (): string => {
  return mkdtempSync(join(tmpdir(), 'pumuki-evidence-server-'));
};

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

test('serves health endpoint', async (t) => {
  const repoRoot = createRepoRoot();
  t.after(() => {
    rmSync(repoRoot, { recursive: true, force: true });
  });

  const started = startEvidenceContextServer({
    host: '127.0.0.1',
    port: 0,
    repoRoot,
  });

  t.after(() => {
    started.server.close();
  });

  await once(started.server, 'listening');
  const address = started.server.address();
  assert.ok(address && typeof address === 'object');
  const port = address.port;

  const response = await fetch(`http://127.0.0.1:${port}/health`);
  assert.equal(response.status, 200);
  const payload = (await response.json()) as { status?: string };
  assert.equal(payload.status, 'ok');
});

test('returns 404 when evidence file is missing', async (t) => {
  const repoRoot = createRepoRoot();
  t.after(() => {
    rmSync(repoRoot, { recursive: true, force: true });
  });

  const started = startEvidenceContextServer({
    host: '127.0.0.1',
    port: 0,
    repoRoot,
  });

  t.after(() => {
    started.server.close();
  });

  await once(started.server, 'listening');
  const address = started.server.address();
  assert.ok(address && typeof address === 'object');
  const port = address.port;

  const response = await fetch(`http://127.0.0.1:${port}/ai-evidence`);
  assert.equal(response.status, 404);
});

test('returns degraded status when evidence file is missing', async (t) => {
  const repoRoot = createRepoRoot();
  t.after(() => {
    rmSync(repoRoot, { recursive: true, force: true });
  });

  const started = startEvidenceContextServer({
    host: '127.0.0.1',
    port: 0,
    repoRoot,
  });

  t.after(() => {
    started.server.close();
  });

  await once(started.server, 'listening');
  const address = started.server.address();
  assert.ok(address && typeof address === 'object');
  const port = address.port;

  const response = await fetch(`http://127.0.0.1:${port}/status`);
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

test('returns summary status payload when evidence file is valid v2.1', async (t) => {
  const repoRoot = createRepoRoot();
  writeFileSync(
    join(repoRoot, '.ai_evidence.json'),
    `${JSON.stringify(createEvidencePayload(), null, 2)}\n`,
    'utf8'
  );

  t.after(() => {
    rmSync(repoRoot, { recursive: true, force: true });
  });

  const started = startEvidenceContextServer({
    host: '127.0.0.1',
    port: 0,
    repoRoot,
  });

  t.after(() => {
    started.server.close();
  });

  await once(started.server, 'listening');
  const address = started.server.address();
  assert.ok(address && typeof address === 'object');
  const port = address.port;

  const response = await fetch(`http://127.0.0.1:${port}/status`);
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

test('returns evidence payload when version is v2.1', async (t) => {
  const repoRoot = createRepoRoot();
  writeFileSync(
    join(repoRoot, '.ai_evidence.json'),
    `${JSON.stringify(createEvidencePayload(), null, 2)}\n`,
    'utf8'
  );

  t.after(() => {
    rmSync(repoRoot, { recursive: true, force: true });
  });

  const started = startEvidenceContextServer({
    host: '127.0.0.1',
    port: 0,
    repoRoot,
  });

  t.after(() => {
    started.server.close();
  });

  await once(started.server, 'listening');
  const address = started.server.address();
  assert.ok(address && typeof address === 'object');
  const port = address.port;

  const response = await fetch(`http://127.0.0.1:${port}/ai-evidence`);
  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    version?: string;
    consolidation?: { suppressed?: unknown[] };
  };
  assert.equal(payload.version, '2.1');
  assert.equal(payload.consolidation?.suppressed?.length, 1);
});

test('returns compact payload without consolidation when includeSuppressed=false', async (t) => {
  const repoRoot = createRepoRoot();
  writeFileSync(
    join(repoRoot, '.ai_evidence.json'),
    `${JSON.stringify(createEvidencePayload(), null, 2)}\n`,
    'utf8'
  );

  t.after(() => {
    rmSync(repoRoot, { recursive: true, force: true });
  });

  const started = startEvidenceContextServer({
    host: '127.0.0.1',
    port: 0,
    repoRoot,
  });

  t.after(() => {
    started.server.close();
  });

  await once(started.server, 'listening');
  const address = started.server.address();
  assert.ok(address && typeof address === 'object');
  const port = address.port;

  const response = await fetch(
    `http://127.0.0.1:${port}/ai-evidence?includeSuppressed=false`
  );
  assert.equal(response.status, 200);
  const payload = (await response.json()) as { consolidation?: unknown };
  assert.equal(payload.consolidation, undefined);
});

test('supports view=compact and view=full aliases for consolidation payload', async (t) => {
  const repoRoot = createRepoRoot();
  writeFileSync(
    join(repoRoot, '.ai_evidence.json'),
    `${JSON.stringify(createEvidencePayload(), null, 2)}\n`,
    'utf8'
  );

  t.after(() => {
    rmSync(repoRoot, { recursive: true, force: true });
  });

  const started = startEvidenceContextServer({
    host: '127.0.0.1',
    port: 0,
    repoRoot,
  });

  t.after(() => {
    started.server.close();
  });

  await once(started.server, 'listening');
  const address = started.server.address();
  assert.ok(address && typeof address === 'object');
  const port = address.port;

  const compactResponse = await fetch(
    `http://127.0.0.1:${port}/ai-evidence?view=compact`
  );
  assert.equal(compactResponse.status, 200);
  const compactPayload = (await compactResponse.json()) as { consolidation?: unknown };
  assert.equal(compactPayload.consolidation, undefined);

  const fullResponse = await fetch(`http://127.0.0.1:${port}/ai-evidence?view=full`);
  assert.equal(fullResponse.status, 200);
  const fullPayload = (await fullResponse.json()) as {
    consolidation?: { suppressed?: unknown[] };
  };
  assert.equal(fullPayload.consolidation?.suppressed?.length, 1);
});

test('returns 404 when evidence file version is not v2.1', async (t) => {
  const repoRoot = createRepoRoot();
  writeFileSync(
    join(repoRoot, '.ai_evidence.json'),
    `${JSON.stringify({ version: '1.0' }, null, 2)}\n`,
    'utf8'
  );

  t.after(() => {
    rmSync(repoRoot, { recursive: true, force: true });
  });

  const started = startEvidenceContextServer({
    host: '127.0.0.1',
    port: 0,
    repoRoot,
  });

  t.after(() => {
    started.server.close();
  });

  await once(started.server, 'listening');
  const address = started.server.address();
  assert.ok(address && typeof address === 'object');
  const port = address.port;

  const response = await fetch(`http://127.0.0.1:${port}/ai-evidence`);
  assert.equal(response.status, 404);
});
