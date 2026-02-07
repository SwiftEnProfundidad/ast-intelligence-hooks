import assert from 'node:assert/strict';
import test from 'node:test';
import type { Fact } from '../Fact';
import { extractHeuristicFacts } from '../extractHeuristicFacts';

const fileContentFact = (path: string, content: string): Fact => {
  return {
    kind: 'FileContent',
    source: 'unit-test',
    path,
    content,
  };
};

const toRuleIds = (
  findings: ReturnType<typeof extractHeuristicFacts>
): string[] => findings.map((finding) => finding.ruleId).sort();

test('extracts backend TypeScript heuristic facts from core extractor', () => {
  const findings = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/feature/file.ts',
        'const value: any = 1; try { work(); } catch {} console.log(value);'
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  assert.deepEqual(toRuleIds(findings), [
    'heuristics.ts.console-log.ast',
    'heuristics.ts.empty-catch.ast',
    'heuristics.ts.explicit-any.ast',
  ]);
  assert.equal(findings.every((finding) => finding.source === 'heuristics:ast'), true);
});

test('returns empty when no supported platform is detected', () => {
  const findings = extractHeuristicFacts({
    facts: [fileContentFact('apps/backend/src/feature/file.ts', 'const value: any = 1;')],
    detectedPlatforms: {},
  });

  assert.equal(findings.length, 0);
});
