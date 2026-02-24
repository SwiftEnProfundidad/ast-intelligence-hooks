import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createEvidencePayload,
  safeFetchRequest,
  test,
  withEvidenceServer,
  withTempDir,
} from './evidenceContextServerFixtures';

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
      const response = await safeFetchRequest(`${baseUrl}/ai-evidence/findings`);
      assert.equal(response.status, 200);
      const body = (await response.json()) as {
        findings_count?: number;
        total_count?: number;
        pagination?: {
          requested_limit?: number | null;
          max_limit?: number;
          limit?: number | null;
          offset?: number;
        };
        findings?: Array<{ ruleId: string; file: string }>;
      };
      assert.equal(body.findings_count, 3);
      assert.equal(body.total_count, 3);
      assert.deepEqual(body.pagination, {
        requested_limit: null,
        max_limit: 100,
        limit: null,
        offset: 0,
      });
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

      const severityResponse = await safeFetchRequest(`${baseUrl}/ai-evidence/findings?severity=ERROR`);
      assert.equal(severityResponse.status, 200);
      const severityBody = (await severityResponse.json()) as {
        findings_count?: number;
        total_count?: number;
        filters?: { severity?: string | null };
      };
      assert.equal(severityBody.findings_count, 2);
      assert.equal(severityBody.total_count, 2);
      assert.equal(severityBody.filters?.severity, 'error');

      const platformResponse = await safeFetchRequest(`${baseUrl}/ai-evidence/findings?platform=ios`);
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

      const ruleResponse = await safeFetchRequest(
        `${baseUrl}/ai-evidence/findings?ruleId=backend.avoid-explicit-any`
      );
      assert.equal(ruleResponse.status, 200);
      const ruleBody = (await ruleResponse.json()) as {
        findings_count?: number;
        total_count?: number;
      };
      assert.equal(ruleBody.findings_count, 1);
      assert.equal(ruleBody.total_count, 1);

      const pagedResponse = await safeFetchRequest(`${baseUrl}/ai-evidence/findings?limit=1&offset=1`);
      assert.equal(pagedResponse.status, 200);
      const pagedBody = (await pagedResponse.json()) as {
        findings_count?: number;
        total_count?: number;
        pagination?: {
          requested_limit?: number | null;
          max_limit?: number;
          limit?: number | null;
          offset?: number;
        };
        findings?: Array<{ ruleId: string }>;
      };
      assert.equal(pagedBody.findings_count, 1);
      assert.equal(pagedBody.total_count, 3);
      assert.deepEqual(pagedBody.pagination, {
        requested_limit: 1,
        max_limit: 100,
        limit: 1,
        offset: 1,
        has_more: true,
      });
      assert.deepEqual(pagedBody.findings, [
        {
          ruleId: 'backend.no-console-log',
          severity: 'WARN',
          code: 'backend.no-console-log',
          message: 'Avoid console.log',
          file: 'apps/backend/src/z.ts',
        },
      ]);

      const cappedResponse = await safeFetchRequest(`${baseUrl}/ai-evidence/findings?limit=9999&offset=0`);
      assert.equal(cappedResponse.status, 200);
      const cappedBody = (await cappedResponse.json()) as {
        findings_count?: number;
        total_count?: number;
        pagination?: {
          requested_limit?: number | null;
          max_limit?: number;
          limit?: number | null;
          offset?: number;
        };
      };
      assert.equal(cappedBody.total_count, 3);
      assert.equal(cappedBody.findings_count, 3);
      assert.deepEqual(cappedBody.pagination, {
        requested_limit: 9999,
        max_limit: 100,
        limit: 100,
        offset: 0,
        has_more: false,
      });
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
      const response = await safeFetchRequest(`${baseUrl}/ai-evidence?includeSuppressed=false`);
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
      const compactResponse = await safeFetchRequest(`${baseUrl}/ai-evidence?view=compact`);
      assert.equal(compactResponse.status, 200);
      const compactPayload = (await compactResponse.json()) as { consolidation?: unknown };
      assert.equal(compactPayload.consolidation, undefined);

      const fullResponse = await safeFetchRequest(`${baseUrl}/ai-evidence?view=full`);
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
      const response = await safeFetchRequest(`${baseUrl}/ai-evidence`);
      assert.equal(response.status, 404);
    });
  });
});
