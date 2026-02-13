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
        context_api?: {
          endpoints?: string[];
          filters?: {
            findings?: string[];
            rulesets?: string[];
            platforms?: string[];
            ledger?: string[];
          };
        };
        evidence?: { present?: boolean; valid?: boolean; version?: string | null };
      };
      assert.equal(payload.status, 'degraded');
      assert.ok(payload.context_api?.endpoints?.includes('/ai-evidence/findings'));
      assert.deepEqual(payload.context_api?.filters?.rulesets, ['platform', 'bundle']);
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
        context_api?: {
          endpoints?: string[];
          filters?: {
            findings?: string[];
            rulesets?: string[];
            platforms?: string[];
            ledger?: string[];
          };
        };
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
      assert.ok(payload.context_api?.endpoints?.includes('/ai-evidence/rulesets'));
      assert.deepEqual(payload.context_api?.filters?.findings, ['severity', 'ruleId', 'platform']);
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

test('returns summary payload from dedicated summary endpoint', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    const payload = createEvidencePayload();
    payload.snapshot.findings.push({
      ruleId: 'backend.avoid-explicit-any',
      severity: 'ERROR',
      code: 'backend.avoid-explicit-any',
      message: 'Avoid explicit any',
      file: 'apps/backend/src/main.ts',
      lines: [10, 11],
    });
    payload.platforms = {
      ios: { detected: true, confidence: 'HIGH' },
      backend: { detected: true, confidence: 'HIGH' },
      frontend: { detected: false, confidence: 'LOW' },
    };
    payload.rulesets = [
      { platform: 'backend', bundle: 'backend', hash: '222' },
      { platform: 'ios', bundle: 'ios', hash: '111' },
    ];
    writeFileSync(join(repoRoot, '.ai_evidence.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/ai-evidence/summary`);
      assert.equal(response.status, 200);
      const summary = (await response.json()) as {
        version?: string;
        snapshot?: { stage?: string; outcome?: string; findings_count?: number };
        ledger_count?: number;
        rulesets_count?: number;
        platforms?: Array<{ platform: string; detected: boolean; confidence: string }>;
      };
      assert.equal(summary.version, '2.1');
      assert.equal(summary.snapshot?.stage, 'CI');
      assert.equal(summary.snapshot?.outcome, 'PASS');
      assert.equal(summary.snapshot?.findings_count, 1);
      assert.equal(summary.ledger_count, 0);
      assert.equal(summary.rulesets_count, 2);
      assert.deepEqual(summary.platforms, [
        { platform: 'backend', detected: true, confidence: 'HIGH' },
        { platform: 'ios', detected: true, confidence: 'HIGH' },
      ]);
    });
  });
});

test('returns rulesets endpoint sorted deterministically', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    const payload = createEvidencePayload();
    payload.rulesets = [
      { platform: 'ios', bundle: 'shared', hash: 'zzz' },
      { platform: 'backend', bundle: 'backend', hash: 'bbb' },
      { platform: 'ios', bundle: 'ios', hash: 'aaa' },
    ];
    writeFileSync(join(repoRoot, '.ai_evidence.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/ai-evidence/rulesets`);
      assert.equal(response.status, 200);
      const body = (await response.json()) as {
        version?: string;
        filters?: { platform?: string | null; bundle?: string | null };
        rulesets?: Array<{ platform: string; bundle: string; hash: string }>;
      };
      assert.equal(body.version, '2.1');
      assert.deepEqual(body.filters, { platform: null, bundle: null });
      assert.deepEqual(body.rulesets, [
        { platform: 'backend', bundle: 'backend', hash: 'bbb' },
        { platform: 'ios', bundle: 'ios', hash: 'aaa' },
        { platform: 'ios', bundle: 'shared', hash: 'zzz' },
      ]);

      const filteredResponse = await fetch(`${baseUrl}/ai-evidence/rulesets?platform=ios&bundle=shared`);
      assert.equal(filteredResponse.status, 200);
      const filteredBody = (await filteredResponse.json()) as {
        filters?: { platform?: string | null; bundle?: string | null };
        rulesets?: Array<{ platform: string; bundle: string; hash: string }>;
      };
      assert.deepEqual(filteredBody.filters, { platform: 'ios', bundle: 'shared' });
      assert.deepEqual(filteredBody.rulesets, [
        { platform: 'ios', bundle: 'shared', hash: 'zzz' },
      ]);
    });
  });
});

test('returns platforms endpoint with detectedOnly toggle', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    const payload = createEvidencePayload();
    payload.platforms = {
      android: { detected: false, confidence: 'LOW' },
      backend: { detected: true, confidence: 'HIGH' },
      ios: { detected: true, confidence: 'MEDIUM' },
    };
    writeFileSync(join(repoRoot, '.ai_evidence.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const detectedOnlyResponse = await fetch(`${baseUrl}/ai-evidence/platforms`);
      assert.equal(detectedOnlyResponse.status, 200);
      const detectedOnly = (await detectedOnlyResponse.json()) as {
        filters?: { detectedOnly?: boolean; confidence?: string | null };
        platforms?: Array<{ platform: string; detected: boolean; confidence: string }>;
      };
      assert.deepEqual(detectedOnly.filters, { detectedOnly: true, confidence: null });
      assert.deepEqual(detectedOnly.platforms, [
        { platform: 'backend', detected: true, confidence: 'HIGH' },
        { platform: 'ios', detected: true, confidence: 'MEDIUM' },
      ]);

      const allPlatformsResponse = await fetch(`${baseUrl}/ai-evidence/platforms?detectedOnly=false`);
      assert.equal(allPlatformsResponse.status, 200);
      const allPlatforms = (await allPlatformsResponse.json()) as {
        filters?: { detectedOnly?: boolean; confidence?: string | null };
        platforms?: Array<{ platform: string; detected: boolean; confidence: string }>;
      };
      assert.deepEqual(allPlatforms.filters, { detectedOnly: false, confidence: null });
      assert.deepEqual(allPlatforms.platforms, [
        { platform: 'android', detected: false, confidence: 'LOW' },
        { platform: 'backend', detected: true, confidence: 'HIGH' },
        { platform: 'ios', detected: true, confidence: 'MEDIUM' },
      ]);

      const confidenceResponse = await fetch(`${baseUrl}/ai-evidence/platforms?detectedOnly=false&confidence=LOW`);
      assert.equal(confidenceResponse.status, 200);
      const confidenceFiltered = (await confidenceResponse.json()) as {
        filters?: { detectedOnly?: boolean; confidence?: string | null };
        platforms?: Array<{ platform: string; detected: boolean; confidence: string }>;
      };
      assert.deepEqual(confidenceFiltered.filters, { detectedOnly: false, confidence: 'low' });
      assert.deepEqual(confidenceFiltered.platforms, [
        { platform: 'android', detected: false, confidence: 'LOW' },
      ]);
    });
  });
});

test('returns ledger endpoint sorted deterministically', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    const payload = createEvidencePayload();
    payload.ledger = [
      {
        ruleId: 'backend.avoid-explicit-any',
        file: 'apps/backend/src/b.ts',
        lines: [30, 31],
        firstSeen: '2026-02-01T10:00:00.000Z',
        lastSeen: '2026-02-02T10:00:00.000Z',
      },
      {
        ruleId: 'backend.avoid-explicit-any',
        file: 'apps/backend/src/a.ts',
        lines: [10, 11],
        firstSeen: '2026-02-01T10:00:00.000Z',
        lastSeen: '2026-02-02T10:00:00.000Z',
      },
      {
        ruleId: 'backend.no-console-log',
        file: 'apps/backend/src/c.ts',
        firstSeen: '2026-02-01T10:00:00.000Z',
        lastSeen: '2026-02-01T10:00:00.000Z',
      },
    ];
    writeFileSync(join(repoRoot, '.ai_evidence.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/ai-evidence/ledger`);
      assert.equal(response.status, 200);
      const body = (await response.json()) as {
        version?: string;
        filters?: { lastSeenAfter?: string | null; lastSeenBefore?: string | null };
        ledger?: Array<{ ruleId: string; file: string }>;
      };
      assert.equal(body.version, '2.1');
      assert.deepEqual(body.filters, { lastSeenAfter: null, lastSeenBefore: null });
      assert.deepEqual(body.ledger, [
        {
          ruleId: 'backend.avoid-explicit-any',
          file: 'apps/backend/src/a.ts',
          lines: [10, 11],
          firstSeen: '2026-02-01T10:00:00.000Z',
          lastSeen: '2026-02-02T10:00:00.000Z',
        },
        {
          ruleId: 'backend.avoid-explicit-any',
          file: 'apps/backend/src/b.ts',
          lines: [30, 31],
          firstSeen: '2026-02-01T10:00:00.000Z',
          lastSeen: '2026-02-02T10:00:00.000Z',
        },
        {
          ruleId: 'backend.no-console-log',
          file: 'apps/backend/src/c.ts',
          firstSeen: '2026-02-01T10:00:00.000Z',
          lastSeen: '2026-02-01T10:00:00.000Z',
        },
      ]);

      const filteredResponse = await fetch(
        `${baseUrl}/ai-evidence/ledger?lastSeenAfter=2026-02-02t10:00:00.000z`
      );
      assert.equal(filteredResponse.status, 200);
      const filteredBody = (await filteredResponse.json()) as {
        filters?: { lastSeenAfter?: string | null; lastSeenBefore?: string | null };
        ledger?: Array<{ ruleId: string; file: string }>;
      };
      assert.deepEqual(filteredBody.filters, {
        lastSeenAfter: '2026-02-02t10:00:00.000z',
        lastSeenBefore: null,
      });
      assert.deepEqual(filteredBody.ledger, [
        {
          ruleId: 'backend.avoid-explicit-any',
          file: 'apps/backend/src/a.ts',
          lines: [10, 11],
          firstSeen: '2026-02-01T10:00:00.000Z',
          lastSeen: '2026-02-02T10:00:00.000Z',
        },
        {
          ruleId: 'backend.avoid-explicit-any',
          file: 'apps/backend/src/b.ts',
          lines: [30, 31],
          firstSeen: '2026-02-01T10:00:00.000Z',
          lastSeen: '2026-02-02T10:00:00.000Z',
        },
      ]);
    });
  });
});

test('returns snapshot endpoint with deterministic findings ordering', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    const payload = createEvidencePayload();
    payload.snapshot.findings = [
      {
        ruleId: 'backend.no-console-log',
        severity: 'WARN',
        code: 'backend.no-console-log',
        message: 'Avoid console.log',
        file: 'apps/backend/src/z.ts',
      },
      {
        ruleId: 'backend.avoid-explicit-any',
        severity: 'ERROR',
        code: 'backend.avoid-explicit-any',
        message: 'Avoid explicit any',
        file: 'apps/backend/src/a.ts',
        lines: [10],
      },
    ];
    writeFileSync(join(repoRoot, '.ai_evidence.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/ai-evidence/snapshot`);
      assert.equal(response.status, 200);
      const body = (await response.json()) as {
        version?: string;
        snapshot?: {
          stage?: string;
          outcome?: string;
          findings_count?: number;
          findings?: Array<{ ruleId: string; file: string }>;
        };
      };
      assert.equal(body.version, '2.1');
      assert.equal(body.snapshot?.stage, 'CI');
      assert.equal(body.snapshot?.outcome, 'PASS');
      assert.equal(body.snapshot?.findings_count, 2);
      assert.deepEqual(body.snapshot?.findings, [
        {
          ruleId: 'backend.avoid-explicit-any',
          severity: 'ERROR',
          code: 'backend.avoid-explicit-any',
          message: 'Avoid explicit any',
          file: 'apps/backend/src/a.ts',
          lines: [10],
        },
        {
          ruleId: 'backend.no-console-log',
          severity: 'WARN',
          code: 'backend.no-console-log',
          message: 'Avoid console.log',
          file: 'apps/backend/src/z.ts',
        },
      ]);
    });
  });
});

test('returns findings endpoint with deterministic ordering and filters', async () => {
  await withTempDir('pumuki-evidence-server-', async (repoRoot) => {
    const payload = createEvidencePayload();
    payload.snapshot.findings = [
      {
        ruleId: 'backend.no-console-log',
        severity: 'WARN',
        code: 'backend.no-console-log',
        message: 'Avoid console.log',
        file: 'apps/backend/src/z.ts',
      },
      {
        ruleId: 'heuristics.ios.force-unwrap.ast',
        severity: 'ERROR',
        code: 'HEURISTICS_IOS_FORCE_UNWRAP_AST',
        message: 'Force unwrap detected.',
        file: 'apps/ios/Feature/View.swift',
      },
      {
        ruleId: 'backend.avoid-explicit-any',
        severity: 'ERROR',
        code: 'backend.avoid-explicit-any',
        message: 'Avoid explicit any',
        file: 'apps/backend/src/a.ts',
        lines: [10],
      },
    ];
    writeFileSync(join(repoRoot, '.ai_evidence.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    await withEvidenceServer(repoRoot, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/ai-evidence/findings`);
      assert.equal(response.status, 200);
      const body = (await response.json()) as {
        findings_count?: number;
        findings?: Array<{ ruleId: string; file: string }>;
      };
      assert.equal(body.findings_count, 3);
      assert.deepEqual(body.findings, [
        {
          ruleId: 'backend.avoid-explicit-any',
          severity: 'ERROR',
          code: 'backend.avoid-explicit-any',
          message: 'Avoid explicit any',
          file: 'apps/backend/src/a.ts',
          lines: [10],
        },
        {
          ruleId: 'backend.no-console-log',
          severity: 'WARN',
          code: 'backend.no-console-log',
          message: 'Avoid console.log',
          file: 'apps/backend/src/z.ts',
        },
        {
          ruleId: 'heuristics.ios.force-unwrap.ast',
          severity: 'ERROR',
          code: 'HEURISTICS_IOS_FORCE_UNWRAP_AST',
          message: 'Force unwrap detected.',
          file: 'apps/ios/Feature/View.swift',
        },
      ]);

      const severityResponse = await fetch(`${baseUrl}/ai-evidence/findings?severity=ERROR`);
      assert.equal(severityResponse.status, 200);
      const severityBody = (await severityResponse.json()) as {
        findings_count?: number;
        filters?: { severity?: string | null };
      };
      assert.equal(severityBody.findings_count, 2);
      assert.equal(severityBody.filters?.severity, 'error');

      const platformResponse = await fetch(`${baseUrl}/ai-evidence/findings?platform=ios`);
      assert.equal(platformResponse.status, 200);
      const platformBody = (await platformResponse.json()) as {
        findings_count?: number;
        findings?: Array<{ ruleId: string }>;
        filters?: { platform?: string | null };
      };
      assert.equal(platformBody.findings_count, 1);
      assert.deepEqual(platformBody.findings, [
        {
          ruleId: 'heuristics.ios.force-unwrap.ast',
          severity: 'ERROR',
          code: 'HEURISTICS_IOS_FORCE_UNWRAP_AST',
          message: 'Force unwrap detected.',
          file: 'apps/ios/Feature/View.swift',
        },
      ]);
      assert.equal(platformBody.filters?.platform, 'ios');

      const ruleResponse = await fetch(
        `${baseUrl}/ai-evidence/findings?ruleId=backend.avoid-explicit-any`
      );
      assert.equal(ruleResponse.status, 200);
      const ruleBody = (await ruleResponse.json()) as {
        findings_count?: number;
      };
      assert.equal(ruleBody.findings_count, 1);
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
