import assert from 'node:assert/strict';
import test from 'node:test';
import type { Fact } from '../../../core/facts/Fact';
import { evaluateRules } from '../../../core/gate/evaluateRules';
import { astHeuristicsRuleSet } from '../../../core/rules/presets/astHeuristicsRuleSet';
import {
  evaluateHeuristicFindings,
  extractHeuristicFacts,
  heuristicFactsToFindings,
} from '../evaluateHeuristicFindings';

const fileContentFact = (path: string, content: string): Fact => {
  return {
    kind: 'FileContent',
    source: 'unit-test',
    path,
    content,
  };
};

const toRuleIds = (findings: ReturnType<typeof evaluateHeuristicFindings>): string[] => {
  return findings.map((finding) => finding.ruleId).sort();
};

test('detects frontend TypeScript heuristic findings in production path', () => {
  const findings = evaluateHeuristicFindings({
    facts: [
      fileContentFact(
        'apps/frontend/src/feature/file.ts',
        'const value: any = 1; try { work(); } catch {} console.log(value);'
      ),
    ],
    detectedPlatforms: {
      frontend: { detected: true },
    },
  });

  assert.deepEqual(toRuleIds(findings), [
    'heuristics.ts.console-log.ast',
    'heuristics.ts.empty-catch.ast',
    'heuristics.ts.explicit-any.ast',
  ]);
});

test('skips frontend heuristics for test files', () => {
  const findings = evaluateHeuristicFindings({
    facts: [
      fileContentFact(
        'apps/frontend/src/feature/file.spec.ts',
        'const value: any = 1; try { work(); } catch {} console.log(value);'
      ),
    ],
    detectedPlatforms: {
      frontend: { detected: true },
    },
  });

  assert.equal(findings.length, 0);
});

test('detects iOS heuristics and skips bridge callback rule', () => {
  const findings = evaluateHeuristicFindings({
    facts: [
      fileContentFact(
        'apps/ios/Presentation/Feature/View.swift',
        [
          'let result = value!',
          'let wrapped = AnyView(Text("hello"))',
          'func fetch(completion: @escaping () -> Void) {}',
        ].join('\n')
      ),
      fileContentFact(
        'apps/ios/Infrastructure/Bridge/SessionBridge.swift',
        'func fetch(completion: @escaping () -> Void) {}'
      ),
    ],
    detectedPlatforms: {
      ios: { detected: true },
    },
  });

  assert.deepEqual(toRuleIds(findings), [
    'heuristics.ios.anyview.ast',
    'heuristics.ios.callback-style.ast',
    'heuristics.ios.force-unwrap.ast',
  ]);
});

test('detects Android heuristics in production path and skips tests', () => {
  const findings = evaluateHeuristicFindings({
    facts: [
      fileContentFact(
        'apps/android/app/src/main/java/com/acme/Feature.kt',
        ['Thread.sleep(10)', 'GlobalScope.launch { }', 'runBlocking { }'].join('\n')
      ),
      fileContentFact(
        'apps/android/app/src/test/java/com/acme/FeatureTest.kt',
        ['Thread.sleep(10)', 'GlobalScope.launch { }', 'runBlocking { }'].join('\n')
      ),
    ],
    detectedPlatforms: {
      android: { detected: true },
    },
  });

  assert.deepEqual(toRuleIds(findings), [
    'heuristics.android.globalscope.ast',
    'heuristics.android.run-blocking.ast',
    'heuristics.android.thread-sleep.ast',
  ]);
});

test('returns empty findings when no heuristic platform is detected', () => {
  const findings = evaluateHeuristicFindings({
    facts: [fileContentFact('apps/frontend/src/file.ts', 'const value: any = 1;')],
    detectedPlatforms: {},
  });

  assert.equal(findings.length, 0);
});

test('extracts typed heuristic facts and maps them to findings', () => {
  const params = {
    facts: [
      fileContentFact(
        'apps/frontend/src/feature/file.ts',
        'const value: any = 1; try { work(); } catch {} console.log(value);'
      ),
    ],
    detectedPlatforms: {
      frontend: { detected: true },
    },
  } as const;

  const heuristicFacts = extractHeuristicFacts(params);
  assert.equal(heuristicFacts.length, 3);
  assert.equal(heuristicFacts.every((fact) => fact.kind === 'Heuristic'), true);
  assert.equal(heuristicFacts.every((fact) => fact.source === 'heuristics:ast'), true);

  const fromFacts = heuristicFactsToFindings(heuristicFacts);
  const fromEvaluator = evaluateHeuristicFindings(params);
  assert.deepEqual(toRuleIds(fromFacts), toRuleIds(fromEvaluator));
});

test('evaluates extracted heuristic facts through declarative rule set', () => {
  const params = {
    facts: [
      fileContentFact(
        'apps/android/app/src/main/java/com/acme/Feature.kt',
        ['Thread.sleep(10)', 'GlobalScope.launch { }', 'runBlocking { }'].join('\n')
      ),
    ],
    detectedPlatforms: {
      android: { detected: true },
    },
  } as const;

  const heuristicFacts = extractHeuristicFacts(params);
  const findings = evaluateRules(astHeuristicsRuleSet, heuristicFacts);
  assert.deepEqual(toRuleIds(findings), [
    'heuristics.android.globalscope.ast',
    'heuristics.android.run-blocking.ast',
    'heuristics.android.thread-sleep.ast',
  ]);
});
