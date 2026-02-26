import assert from 'node:assert/strict';
import test from 'node:test';
import { composeFileTechnicalRiskSignals } from '../composeFileTechnicalRiskSignals';
import type { FileChurnOwnershipSignal } from '../collectFileChurnOwnership';

const churnSignals: ReadonlyArray<FileChurnOwnershipSignal> = [
  {
    path: 'src/a.ts',
    commits: 3,
    distinctAuthors: 2,
    churnAddedLines: 30,
    churnDeletedLines: 10,
    churnTotalLines: 40,
    lastTouchedAt: '2026-02-24T12:00:00+00:00',
  },
  {
    path: 'src/b.ts',
    commits: 1,
    distinctAuthors: 1,
    churnAddedLines: 2,
    churnDeletedLines: 0,
    churnTotalLines: 2,
    lastTouchedAt: '2026-02-20T12:00:00+00:00',
  },
];

test('composeFileTechnicalRiskSignals combina churn local con findings locales por fichero', () => {
  const result = composeFileTechnicalRiskSignals({
    repoRoot: '/repo',
    churnSignals,
    findings: [
      {
        file: '/repo/src/a.ts',
        ruleId: 'rule.critical',
        severity: 'CRITICAL',
        lines: [10],
      },
      {
        file: '/repo/src/a.ts',
        ruleId: 'rule.high',
        severity: 'ERROR',
      },
      {
        file: 'src/a.ts',
        ruleId: 'rule.high',
        severity: 'error',
      },
      {
        file: '/repo/src/c.ts',
        ruleId: 'rule.medium',
        severity: 'WARN',
        lines: '17',
      },
      {
        file: '/repo/src/c.ts',
        ruleId: 'rule.low',
        severity: 'INFO',
      },
      {
        file: '/outside/path.ts',
        ruleId: 'rule.external',
        severity: 'CRITICAL',
      },
      {
        file: '/repo/src/d.ts',
        ruleId: 'rule.unknown',
        severity: 'UNKNOWN',
      },
    ],
  });

  assert.deepEqual(result, [
    {
      path: '/outside/path.ts',
      churnCommits: 0,
      churnDistinctAuthors: 0,
      churnAddedLines: 0,
      churnDeletedLines: 0,
      churnTotalLines: 0,
      churnLastTouchedAt: null,
      findingsTotal: 1,
      findingsByEnterpriseSeverity: {
        CRITICAL: 1,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
      },
      findingsDistinctRules: 1,
      findingsWithLines: 0,
      findingsWithoutLines: 1,
    },
    {
      path: 'src/a.ts',
      churnCommits: 3,
      churnDistinctAuthors: 2,
      churnAddedLines: 30,
      churnDeletedLines: 10,
      churnTotalLines: 40,
      churnLastTouchedAt: '2026-02-24T12:00:00+00:00',
      findingsTotal: 3,
      findingsByEnterpriseSeverity: {
        CRITICAL: 1,
        HIGH: 2,
        MEDIUM: 0,
        LOW: 0,
      },
      findingsDistinctRules: 2,
      findingsWithLines: 1,
      findingsWithoutLines: 2,
    },
    {
      path: 'src/b.ts',
      churnCommits: 1,
      churnDistinctAuthors: 1,
      churnAddedLines: 2,
      churnDeletedLines: 0,
      churnTotalLines: 2,
      churnLastTouchedAt: '2026-02-20T12:00:00+00:00',
      findingsTotal: 0,
      findingsByEnterpriseSeverity: {
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
      },
      findingsDistinctRules: 0,
      findingsWithLines: 0,
      findingsWithoutLines: 0,
    },
    {
      path: 'src/c.ts',
      churnCommits: 0,
      churnDistinctAuthors: 0,
      churnAddedLines: 0,
      churnDeletedLines: 0,
      churnTotalLines: 0,
      churnLastTouchedAt: null,
      findingsTotal: 2,
      findingsByEnterpriseSeverity: {
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 1,
        LOW: 1,
      },
      findingsDistinctRules: 2,
      findingsWithLines: 1,
      findingsWithoutLines: 1,
    },
  ]);
});

test('composeFileTechnicalRiskSignals normaliza severidad enterprise directa y deduce líneas válidas', () => {
  const result = composeFileTechnicalRiskSignals({
    repoRoot: '/repo',
    churnSignals: [],
    findings: [
      {
        file: '/repo/src/e.ts',
        ruleId: 'rule.high',
        severity: 'HIGH',
        lines: 42,
      },
      {
        file: '/repo/src/e.ts',
        ruleId: 'rule.medium',
        severity: 'MEDIUM',
        lines: [],
      },
      {
        file: '/repo/src/e.ts',
        ruleId: 'rule.low',
        severity: 'LOW',
      },
    ],
  });

  assert.deepEqual(result, [
    {
      path: 'src/e.ts',
      churnCommits: 0,
      churnDistinctAuthors: 0,
      churnAddedLines: 0,
      churnDeletedLines: 0,
      churnTotalLines: 0,
      churnLastTouchedAt: null,
      findingsTotal: 3,
      findingsByEnterpriseSeverity: {
        CRITICAL: 0,
        HIGH: 1,
        MEDIUM: 1,
        LOW: 1,
      },
      findingsDistinctRules: 3,
      findingsWithLines: 1,
      findingsWithoutLines: 2,
    },
  ]);
});
