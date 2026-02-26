import assert from 'node:assert/strict';
import test from 'node:test';
import type { TddBddEvidenceReadResult } from '../../tdd/contract';
import type { LocalHotspotsReport } from '../analyticsHotspots';
import {
  buildOperationalMemoryRecordsFromLocalSignals,
  normalizeOperationalMemoryPathIdentity,
} from '../operationalMemorySignals';

const buildReport = (): LocalHotspotsReport => ({
  generatedAt: '2026-02-26T22:00:00+00:00',
  repoRoot: '/tmp/repo',
  options: {
    topN: 2,
    sinceDays: 90,
  },
  totals: {
    churnSignals: 3,
    technicalSignals: 2,
    ranked: 2,
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
    {
      rank: 2,
      path: 'core/gate/evaluateRules.ts',
      rawScore: 60,
      normalizedScore: 0.5,
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
      churnTotalLines: 12,
    },
  ],
});

const buildValidTddEvidence = (): TddBddEvidenceReadResult => ({
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
});

test('buildOperationalMemoryRecordsFromLocalSignals agrega señales diff/tests/typecheck sin red externa', () => {
  const result = buildOperationalMemoryRecordsFromLocalSignals({
    repoRoot: '/tmp/repo',
    now: '2026-02-26T23:00:00.000Z',
    ttlDays: 30,
    report: buildReport(),
    evidence: {
      snapshot: {
        stage: 'CI',
        outcome: 'BLOCK',
        findings: [
          {
            ruleId: 'common.types.unknown_without_guard',
            code: 'COMMON_TYPES_UNKNOWN_WITHOUT_GUARD_AST',
          },
          {
            ruleId: 'heuristics.backend.solid',
            code: 'HEURISTICS_SOLID',
          },
        ],
      },
    },
    tddBddEvidence: buildValidTddEvidence(),
  });

  assert.equal(result.counts.diff, 2);
  assert.equal(result.counts.tests, 1);
  assert.equal(result.counts.typecheck, 1);
  assert.equal(result.counts.total, 4);
  assert.equal(result.records.some((record) => record.signalType === 'diff.hotspot.risk'), true);
  assert.equal(result.records.some((record) => record.signalType === 'tests.tdd_bdd.contract'), true);
  assert.equal(result.records.some((record) => record.signalType === 'typecheck.findings.summary'), true);
});

test('buildOperationalMemoryRecordsFromLocalSignals genera fallback cuando falta evidencia', () => {
  const result = buildOperationalMemoryRecordsFromLocalSignals({
    repoRoot: '/tmp/repo',
    now: '2026-02-26T23:00:00.000Z',
    ttlDays: 30,
    report: buildReport(),
    tddBddEvidence: {
      kind: 'missing',
      path: '.pumuki/artifacts/pumuki-evidence-v1.json',
    },
    evidence: undefined,
  });

  const testsRecord = result.records.find((record) => record.signalType === 'tests.tdd_bdd.contract');
  const typecheckRecord = result.records.find(
    (record) => record.signalType === 'typecheck.findings.summary'
  );
  assert.equal(testsRecord?.summary, 'tdd_bdd status=missing');
  assert.equal(typecheckRecord?.summary, 'typecheck evidence missing');
});

test('normalizeOperationalMemoryPathIdentity colapsa separadores y normaliza casing', () => {
  assert.equal(
    normalizeOperationalMemoryPathIdentity('.\\Integrations//Lifecycle\\CLI.ts'),
    'integrations/lifecycle/cli.ts'
  );
});

test('buildOperationalMemoryRecordsFromLocalSignals evita colisiones por path equivalente', () => {
  const reportWithCollision: LocalHotspotsReport = {
    ...buildReport(),
    hotspots: [
      {
        ...buildReport().hotspots[0]!,
        path: '.\\integrations/lifecycle/cli.ts',
        rawScore: 100,
      },
      {
        ...buildReport().hotspots[1]!,
        path: './integrations/lifecycle/cli.ts',
        rawScore: 120,
      },
    ],
    totals: {
      churnSignals: 2,
      technicalSignals: 2,
      ranked: 2,
    },
  };

  const result = buildOperationalMemoryRecordsFromLocalSignals({
    repoRoot: '/tmp/repo',
    now: '2026-02-26T23:00:00.000Z',
    ttlDays: 30,
    report: reportWithCollision,
    tddBddEvidence: buildValidTddEvidence(),
    evidence: {
      snapshot: {
        stage: 'CI',
        outcome: 'PASS',
        findings: [],
      },
    },
  });

  assert.equal(result.counts.diff, 1);
  assert.equal(
    result.records.some(
      (record) =>
        record.signalType === 'diff.hotspot.risk' &&
        record.summary.startsWith('hotspot integrations/lifecycle/cli.ts')
    ),
    true
  );
});
