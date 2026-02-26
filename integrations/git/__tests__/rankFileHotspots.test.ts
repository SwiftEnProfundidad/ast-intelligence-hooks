import assert from 'node:assert/strict';
import test from 'node:test';
import type { FileTechnicalRiskSignal } from '../composeFileTechnicalRiskSignals';
import { rankFileHotspots } from '../rankFileHotspots';

const createSignal = (params: {
  path: string;
  churnCommits?: number;
  churnDistinctAuthors?: number;
  churnTotalLines?: number;
  findingsTotal?: number;
  critical?: number;
  high?: number;
  medium?: number;
  low?: number;
  findingsDistinctRules?: number;
  findingsWithLines?: number;
  findingsWithoutLines?: number;
}): FileTechnicalRiskSignal => ({
  path: params.path,
  churnCommits: params.churnCommits ?? 0,
  churnDistinctAuthors: params.churnDistinctAuthors ?? 0,
  churnAddedLines: params.churnTotalLines ?? 0,
  churnDeletedLines: 0,
  churnTotalLines: params.churnTotalLines ?? 0,
  churnLastTouchedAt: null,
  findingsTotal: params.findingsTotal ?? 0,
  findingsByEnterpriseSeverity: {
    CRITICAL: params.critical ?? 0,
    HIGH: params.high ?? 0,
    MEDIUM: params.medium ?? 0,
    LOW: params.low ?? 0,
  },
  findingsDistinctRules: params.findingsDistinctRules ?? 0,
  findingsWithLines: params.findingsWithLines ?? 0,
  findingsWithoutLines: params.findingsWithoutLines ?? 0,
});

test('rankFileHotspots calcula score determinista y devuelve top_n ordenado', () => {
  const signals: ReadonlyArray<FileTechnicalRiskSignal> = [
    createSignal({
      path: 'src/a.ts',
      churnCommits: 3,
      churnDistinctAuthors: 2,
      churnTotalLines: 40,
      findingsTotal: 3,
      critical: 1,
      high: 1,
      findingsDistinctRules: 2,
      findingsWithLines: 2,
      findingsWithoutLines: 1,
    }),
    createSignal({
      path: 'src/b.ts',
      churnCommits: 10,
      churnDistinctAuthors: 5,
      churnTotalLines: 200,
      findingsTotal: 4,
      high: 2,
      findingsDistinctRules: 4,
      findingsWithLines: 1,
      findingsWithoutLines: 3,
    }),
    createSignal({
      path: 'src/c.ts',
      churnCommits: 1,
      churnDistinctAuthors: 1,
      churnTotalLines: 10,
      findingsTotal: 1,
      critical: 1,
      findingsDistinctRules: 1,
      findingsWithLines: 1,
      findingsWithoutLines: 0,
    }),
  ];

  const ranked = rankFileHotspots({
    signals,
    topN: 2,
  });

  assert.equal(ranked.length, 2);
  assert.deepEqual(
    ranked.map((item) => ({
      rank: item.rank,
      path: item.path,
      rawScore: item.rawScore,
      normalizedScore: item.normalizedScore,
    })),
    [
      {
        rank: 1,
        path: 'src/b.ts',
        rawScore: 181,
        normalizedScore: 1,
      },
      {
        rank: 2,
        path: 'src/a.ts',
        rawScore: 174,
        normalizedScore: 0.961326,
      },
    ]
  );
});

test('rankFileHotspots desempata por path para garantizar salida estable', () => {
  const signals: ReadonlyArray<FileTechnicalRiskSignal> = [
    createSignal({
      path: 'src/z.ts',
      churnCommits: 2,
      churnDistinctAuthors: 1,
      churnTotalLines: 20,
      findingsTotal: 1,
      high: 1,
      findingsDistinctRules: 1,
      findingsWithLines: 1,
      findingsWithoutLines: 0,
    }),
    createSignal({
      path: 'src/a.ts',
      churnCommits: 2,
      churnDistinctAuthors: 1,
      churnTotalLines: 20,
      findingsTotal: 1,
      high: 1,
      findingsDistinctRules: 1,
      findingsWithLines: 1,
      findingsWithoutLines: 0,
    }),
  ];

  const ranked = rankFileHotspots({
    signals,
    topN: 10,
  });

  assert.deepEqual(
    ranked.map((item) => `${item.rank}:${item.path}:${item.rawScore}:${item.normalizedScore}`),
    ['1:src/a.ts:59:1', '2:src/z.ts:59:1']
  );
});

test('rankFileHotspots valida topN y filtra entradas sin señal', () => {
  assert.throws(
    () =>
      rankFileHotspots({
        signals: [],
        topN: 0,
      }),
    /topN must be a positive integer/i
  );

  const ranked = rankFileHotspots({
    signals: [
      createSignal({ path: 'src/zero.ts' }),
      createSignal({
        path: 'src/non-zero.ts',
        findingsTotal: 1,
        high: 1,
      }),
    ],
  });

  assert.deepEqual(
    ranked.map((item) => item.path),
    ['src/non-zero.ts']
  );
});
