import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import type { TddBddEvidenceReadResult } from '../../tdd/contract';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import type { LocalHotspotsReport } from '../analyticsHotspots';
import { readOperationalMemoryContract } from '../operationalMemoryContract';
import {
  appendOperationalMemorySnapshotFromLocalSignals,
  resolveOperationalMemorySnapshotsPath,
} from '../operationalMemorySnapshot';

const report: LocalHotspotsReport = {
  generatedAt: '2026-02-26T22:00:00+00:00',
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
      path: 'integrations/lifecycle/cli.ts',
      rawScore: 120,
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
      churnTotalLines: 40,
    },
  ],
};

const tddEvidence: TddBddEvidenceReadResult = {
  kind: 'valid',
  path: '.pumuki/artifacts/pumuki-evidence-v1.json',
  integrity: {
    present: true,
    valid: true,
  },
  evidence: {
    version: '1',
    generated_at: '2026-02-26T22:00:00+00:00',
    slices: [
      {
        id: 'slice-001',
        scenario_ref: 'feature/checkout',
        red: { status: 'failed' },
        green: { status: 'passed' },
        refactor: { status: 'passed' },
      },
    ],
    integrity: {
      algorithm: 'sha256',
      payload_hash: 'abc',
    },
  },
};

test('appendOperationalMemorySnapshotFromLocalSignals persiste contrato + snapshot NDJSON auditable', async () => {
  await withTempDir('pumuki-operational-memory-snapshot-', async (tempRoot) => {
    const result = appendOperationalMemorySnapshotFromLocalSignals({
      repoRoot: tempRoot,
      producerVersion: '6.3.17',
      sourceMode: 'ci',
      scopeId: 'repo:ast-intelligence-hooks',
      scopeType: 'repository',
      scopeName: 'ast-intelligence-hooks',
      now: '2026-02-26T23:00:00.000Z',
      ttlDays: 30,
      minConfidence: 0.6,
      report,
      evidence: {
        snapshot: {
          stage: 'CI',
          outcome: 'BLOCK',
          findings: [
            {
              ruleId: 'common.types.unknown_without_guard',
              code: 'COMMON_TYPES_UNKNOWN_WITHOUT_GUARD_AST',
            },
          ],
        },
      },
      tddBddEvidence: tddEvidence,
    });

    assert.equal(result.contract.version, '1');
    assert.equal(result.records > 0, true);

    const readContract = readOperationalMemoryContract(tempRoot);
    assert.equal(readContract.kind, 'valid');
    if (readContract.kind === 'valid') {
      assert.equal(readContract.contract.integrity.payload_hash, result.contract.integrity.payload_hash);
    }

    const snapshotPath = resolveOperationalMemorySnapshotsPath(tempRoot);
    assert.equal(existsSync(snapshotPath), true);
    const lines = readFileSync(snapshotPath, 'utf8')
      .trim()
      .split('\n')
      .filter((line) => line.trim().length > 0);
    assert.equal(lines.length, 1);
    const snapshot = JSON.parse(lines[0] ?? '{}') as {
      version?: string;
      contract?: {
        payload_hash?: string;
      };
      signals?: {
        total?: number;
      };
    };
    assert.equal(snapshot.version, '1');
    assert.equal(snapshot.contract?.payload_hash, result.contract.integrity.payload_hash);
    assert.equal(snapshot.signals?.total, result.records);

    const artifactsDir = join(tempRoot, '.pumuki', 'artifacts');
    assert.equal(existsSync(artifactsDir), true);
  });
});
