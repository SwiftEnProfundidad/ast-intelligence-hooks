import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import type { LocalHotspotsReport } from '../analyticsHotspots';
import {
  HOTSPOTS_SAAS_INGESTION_CANONICAL_VERSION,
  HOTSPOTS_SAAS_INGESTION_SUPPORTED_VERSIONS,
  createHotspotsSaasIngestionPayload,
  createHotspotsSaasIngestionPayloadHash,
  parseHotspotsSaasIngestionPayload,
  readHotspotsSaasIngestionPayload,
  resolveHotspotsSaasIngestionPayloadPath,
  type HotspotsSaasIngestionPayloadBodyCompat,
  type HotspotsSaasIngestionPayloadBodyV1,
} from '../saasIngestionContract';

const buildReport = (): LocalHotspotsReport => ({
  generatedAt: '2026-02-26T10:10:00+00:00',
  repoRoot: '/tmp/repo',
  options: {
    topN: 2,
    sinceDays: 90,
  },
  totals: {
    churnSignals: 4,
    technicalSignals: 3,
    ranked: 2,
  },
  hotspots: [
    {
      rank: 1,
      path: 'src/a.ts',
      rawScore: 240,
      normalizedScore: 1,
      findingsTotal: 3,
      findingsByEnterpriseSeverity: {
        CRITICAL: 1,
        HIGH: 1,
        MEDIUM: 1,
        LOW: 0,
      },
      findingsDistinctRules: 3,
      churnCommits: 2,
      churnDistinctAuthors: 2,
      churnTotalLines: 30,
    },
    {
      rank: 2,
      path: 'src/b.ts',
      rawScore: 90,
      normalizedScore: 0.375,
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
});

test('createHotspotsSaasIngestionPayload genera contrato v1 con integridad válida', () => {
  const payload = createHotspotsSaasIngestionPayload({
    tenantId: 'tenant-demo',
    repositoryId: 'repo-demo',
    repositoryName: 'ast-intelligence-hooks',
    producerVersion: '6.3.17',
    sourceMode: 'local',
    generatedAt: '2026-02-26T10:15:00+00:00',
    report: buildReport(),
    tddBdd: {
      status: 'passed',
      scope: {
        in_scope: true,
        is_new_feature: true,
        is_complex_change: true,
        reasons: ['complex.public_interface_changed'],
        metrics: {
          changed_files: 3,
          estimated_loc: 80,
          critical_path_files: 1,
          public_interface_files: 1,
        },
      },
      evidence: {
        path: '.pumuki/artifacts/pumuki-evidence-v1.json',
        state: 'valid',
        version: '1',
        slices_total: 2,
        slices_valid: 2,
        slices_invalid: 0,
        integrity_ok: true,
        errors: [],
      },
      waiver: {
        applied: false,
      },
    },
  });

  assert.equal(payload.version, '1');
  assert.equal(payload.tenant_id, 'tenant-demo');
  assert.equal(payload.repository.repository_id, 'repo-demo');
  assert.equal(payload.hotspots.entries.length, 2);
  assert.equal(payload.compliance?.tdd_bdd?.status, 'passed');
  assert.equal(payload.integrity.algorithm, 'sha256');
  assert.match(payload.integrity.payload_hash, /^[a-f0-9]{64}$/);

  const parsed = parseHotspotsSaasIngestionPayload(payload);
  assert.equal(parsed.kind, 'valid');
  if (parsed.kind === 'valid') {
    assert.equal(parsed.contract.hotspots.entries[0]?.path, 'src/a.ts');
  }
});

test('createHotspotsSaasIngestionPayloadHash es determinista para el mismo body lógico', () => {
  const bodyA: HotspotsSaasIngestionPayloadBodyV1 = {
    version: '1',
    generated_at: '2026-02-26T10:30:00+00:00',
    tenant_id: 'tenant-a',
    repository: {
      repository_id: 'repo-a',
      name: 'ast-intelligence-hooks',
      default_branch: 'main',
    },
    source: {
      producer: 'pumuki',
      producer_version: '6.3.17',
      mode: 'ci',
    },
    hotspots: {
      top_n: 2,
      since_days: 90,
      churn_signals: 4,
      technical_signals: 3,
      ranked: 2,
      entries: [
        {
          rank: 1,
          path: 'src/a.ts',
          raw_score: 240,
          normalized_score: 1,
          findings_total: 3,
          findings_by_enterprise_severity: {
            CRITICAL: 1,
            HIGH: 1,
            MEDIUM: 1,
            LOW: 0,
          },
          findings_distinct_rules: 3,
          churn_commits: 2,
          churn_distinct_authors: 2,
          churn_total_lines: 30,
        },
      ],
    },
    compliance: {
      tdd_bdd: {
        status: 'passed',
        in_scope: true,
        slices_total: 2,
        slices_valid: 2,
        slices_invalid: 0,
        waiver_applied: false,
      },
    },
  };

  const bodyB: HotspotsSaasIngestionPayloadBodyV1 = {
    source: {
      mode: 'ci',
      producer_version: '6.3.17',
      producer: 'pumuki',
    },
    repository: {
      default_branch: 'main',
      name: 'ast-intelligence-hooks',
      repository_id: 'repo-a',
    },
    version: '1',
    generated_at: '2026-02-26T10:30:00+00:00',
    tenant_id: 'tenant-a',
    hotspots: {
      entries: [
        {
          path: 'src/a.ts',
          rank: 1,
          raw_score: 240,
          normalized_score: 1,
          findings_total: 3,
          findings_by_enterprise_severity: {
            LOW: 0,
            MEDIUM: 1,
            HIGH: 1,
            CRITICAL: 1,
          },
          findings_distinct_rules: 3,
          churn_commits: 2,
          churn_distinct_authors: 2,
          churn_total_lines: 30,
        },
      ],
      ranked: 2,
      technical_signals: 3,
      churn_signals: 4,
      since_days: 90,
      top_n: 2,
    },
    compliance: {
      tdd_bdd: {
        waiver_applied: false,
        slices_invalid: 0,
        slices_valid: 2,
        slices_total: 2,
        in_scope: true,
        status: 'passed',
      },
    },
  };

  assert.equal(
    createHotspotsSaasIngestionPayloadHash(bodyA),
    createHotspotsSaasIngestionPayloadHash(bodyB)
  );
});

test('parseHotspotsSaasIngestionPayload detecta tampering de payload con hash intacto', () => {
  const payload = createHotspotsSaasIngestionPayload({
    tenantId: 'tenant-demo',
    repositoryId: 'repo-demo',
    repositoryName: 'ast-intelligence-hooks',
    producerVersion: '6.3.17',
    generatedAt: '2026-02-26T10:15:00+00:00',
    report: buildReport(),
  });

  const tampered = structuredClone(payload);
  tampered.hotspots.entries[0]!.raw_score = 999;
  const parsed = parseHotspotsSaasIngestionPayload(tampered);
  assert.equal(parsed.kind, 'invalid');
  if (parsed.kind === 'invalid') {
    assert.equal(parsed.reason, 'integrity_hash_mismatch');
    assert.equal(parsed.version, '1');
  }
});

test('parseHotspotsSaasIngestionPayload rechaza schema incompleto', () => {
  const payload = createHotspotsSaasIngestionPayload({
    tenantId: 'tenant-demo',
    repositoryId: 'repo-demo',
    repositoryName: 'ast-intelligence-hooks',
    producerVersion: '6.3.17',
    generatedAt: '2026-02-26T10:15:00+00:00',
    report: buildReport(),
  });

  const invalidPayload = structuredClone(payload) as Record<string, unknown>;
  delete invalidPayload.tenant_id;

  const parsed = parseHotspotsSaasIngestionPayload(invalidPayload);
  assert.equal(parsed.kind, 'invalid');
  if (parsed.kind === 'invalid') {
    assert.equal(parsed.version, '1');
  }
});

test('parseHotspotsSaasIngestionPayload soporta payload legacy v1.0 y lo canoniza a v1', () => {
  const canonical = createHotspotsSaasIngestionPayload({
    tenantId: 'tenant-legacy',
    repositoryId: 'repo-legacy',
    repositoryName: 'ast-intelligence-hooks',
    producerVersion: '6.3.17',
    generatedAt: '2026-02-26T11:00:00+00:00',
    report: buildReport(),
  });
  const { integrity: _canonicalIntegrity, ...canonicalBodyOnly } = canonical;

  const legacyBody: HotspotsSaasIngestionPayloadBodyCompat = {
    ...canonicalBodyOnly,
    version: '1.0',
  };
  const legacyPayload = {
    ...legacyBody,
    integrity: {
      algorithm: 'sha256' as const,
      payload_hash: createHotspotsSaasIngestionPayloadHash(legacyBody),
    },
  };

  const parsed = parseHotspotsSaasIngestionPayload(legacyPayload);
  assert.equal(parsed.kind, 'valid');
  if (parsed.kind === 'valid') {
    assert.equal(parsed.integrity.source_version, '1.0');
    assert.equal(parsed.contract.version, HOTSPOTS_SAAS_INGESTION_CANONICAL_VERSION);
    assert.equal(parsed.contract.repository.repository_id, 'repo-legacy');
  }
  assert.deepEqual(HOTSPOTS_SAAS_INGESTION_SUPPORTED_VERSIONS, ['1', '1.0']);
});

test('resolveHotspotsSaasIngestionPayloadPath usa default cuando no hay override', async () => {
  await withTempDir('pumuki-saas-ingestion-path-', async (tempRoot) => {
    const previous = process.env.PUMUKI_SAAS_INGESTION_PAYLOAD_PATH;
    delete process.env.PUMUKI_SAAS_INGESTION_PAYLOAD_PATH;
    try {
      const resolved = resolveHotspotsSaasIngestionPayloadPath(tempRoot);
      assert.equal(
        resolved,
        join(tempRoot, '.pumuki', 'artifacts', 'hotspots-saas-ingestion-v1.json')
      );
    } finally {
      if (typeof previous === 'string') {
        process.env.PUMUKI_SAAS_INGESTION_PAYLOAD_PATH = previous;
      } else {
        delete process.env.PUMUKI_SAAS_INGESTION_PAYLOAD_PATH;
      }
    }
  });
});

test('readHotspotsSaasIngestionPayload devuelve missing cuando no existe payload', async () => {
  await withTempDir('pumuki-saas-ingestion-read-missing-', async (tempRoot) => {
    const previous = process.env.PUMUKI_SAAS_INGESTION_PAYLOAD_PATH;
    process.env.PUMUKI_SAAS_INGESTION_PAYLOAD_PATH = '.pumuki/artifacts/custom.json';
    try {
      const result = readHotspotsSaasIngestionPayload(tempRoot);
      assert.equal(result.kind, 'missing');
      if (result.kind === 'missing') {
        assert.equal(result.path, join(tempRoot, '.pumuki', 'artifacts', 'custom.json'));
      }
    } finally {
      if (typeof previous === 'string') {
        process.env.PUMUKI_SAAS_INGESTION_PAYLOAD_PATH = previous;
      } else {
        delete process.env.PUMUKI_SAAS_INGESTION_PAYLOAD_PATH;
      }
    }
  });
});

test('readHotspotsSaasIngestionPayload devuelve valid para payload íntegro', async () => {
  await withTempDir('pumuki-saas-ingestion-read-valid-', async (tempRoot) => {
    const previous = process.env.PUMUKI_SAAS_INGESTION_PAYLOAD_PATH;
    process.env.PUMUKI_SAAS_INGESTION_PAYLOAD_PATH = '.pumuki/artifacts/ingestion.json';
    try {
      const payload = createHotspotsSaasIngestionPayload({
        tenantId: 'tenant-demo',
        repositoryId: 'repo-demo',
        repositoryName: 'ast-intelligence-hooks',
        producerVersion: '6.3.17',
        generatedAt: '2026-02-26T10:15:00+00:00',
        report: buildReport(),
      });
      const filePath = join(tempRoot, '.pumuki', 'artifacts', 'ingestion.json');
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

      const result = readHotspotsSaasIngestionPayload(tempRoot);
      assert.equal(result.kind, 'valid');
      if (result.kind === 'valid') {
        assert.equal(result.contract.version, '1');
        assert.equal(result.contract.hotspots.entries.length, 2);
      }
    } finally {
      if (typeof previous === 'string') {
        process.env.PUMUKI_SAAS_INGESTION_PAYLOAD_PATH = previous;
      } else {
        delete process.env.PUMUKI_SAAS_INGESTION_PAYLOAD_PATH;
      }
    }
  });
});

test('readHotspotsSaasIngestionPayload devuelve invalid para JSON malformado', async () => {
  await withTempDir('pumuki-saas-ingestion-read-invalid-', async (tempRoot) => {
    const previous = process.env.PUMUKI_SAAS_INGESTION_PAYLOAD_PATH;
    process.env.PUMUKI_SAAS_INGESTION_PAYLOAD_PATH = '.pumuki/artifacts/invalid.json';
    try {
      const filePath = join(tempRoot, '.pumuki', 'artifacts', 'invalid.json');
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, '{ broken json', 'utf8');

      const result = readHotspotsSaasIngestionPayload(tempRoot);
      assert.equal(result.kind, 'invalid');
      if (result.kind === 'invalid') {
        assert.equal(result.reason.trim().length > 0, true);
      }
    } finally {
      if (typeof previous === 'string') {
        process.env.PUMUKI_SAAS_INGESTION_PAYLOAD_PATH = previous;
      } else {
        delete process.env.PUMUKI_SAAS_INGESTION_PAYLOAD_PATH;
      }
    }
  });
});
