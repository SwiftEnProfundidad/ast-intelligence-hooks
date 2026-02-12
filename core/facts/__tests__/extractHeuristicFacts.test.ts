import assert from 'node:assert/strict';
import test from 'node:test';
import type { Fact } from '../Fact';
import { extractHeuristicFacts } from '../extractHeuristicFacts';
import { evaluateRules } from '../../gate/evaluateRules';
import { astHeuristicsRuleSet } from '../../rules/presets/astHeuristicsRuleSet';

const fileContentFact = (path: string, content: string): Fact => {
  return {
    kind: 'FileContent',
    source: 'unit-test',
    path,
    content,
  };
};

const toRuleIds = (
  findings: ReadonlyArray<{ ruleId: string }>
): string[] => findings.map((finding) => finding.ruleId).sort();

test('detects frontend TypeScript heuristic findings in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/frontend/src/feature/file.ts',
        'const cp = require("child_process"); const value: any = 1; const obj: any = { secret: 1 }; const el: any = {}; try { work(); } catch {} console.log(value); console.error(value); eval("x"); new Function("return 1"); setTimeout("work()", 100); setInterval("work()", 100); new Promise(async (resolve) => resolve(value)); with (Math) { max(1, 2); } process.exit(1); delete obj.secret; el.innerHTML = value; el.insertAdjacentHTML("beforeend", value); document.write(value); debugger;'
      ),
    ],
    detectedPlatforms: {
      frontend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'heuristics.ts.child-process-import.ast',
    'heuristics.ts.console-error.ast',
    'heuristics.ts.console-log.ast',
    'heuristics.ts.debugger.ast',
    'heuristics.ts.delete-operator.ast',
    'heuristics.ts.document-write.ast',
    'heuristics.ts.empty-catch.ast',
    'heuristics.ts.eval.ast',
    'heuristics.ts.explicit-any.ast',
    'heuristics.ts.function-constructor.ast',
    'heuristics.ts.inner-html.ast',
    'heuristics.ts.insert-adjacent-html.ast',
    'heuristics.ts.new-promise-async.ast',
    'heuristics.ts.process-exit.ast',
    'heuristics.ts.set-interval-string.ast',
    'heuristics.ts.set-timeout-string.ast',
    'heuristics.ts.with-statement.ast',
  ]);
});

test('detects backend TypeScript heuristic findings in production path', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/backend/src/feature/file.ts',
        'const cp = require("child_process"); const value: any = 1; const obj: any = { secret: 1 }; const el: any = {}; try { work(); } catch {} console.log(value); console.error(value); eval("x"); new Function("return 1"); setTimeout("work()", 100); setInterval("work()", 100); new Promise(async (resolve) => resolve(value)); with (Math) { max(1, 2); } process.exit(1); delete obj.secret; el.innerHTML = value; el.insertAdjacentHTML("beforeend", value); document.write(value); debugger;'
      ),
    ],
    detectedPlatforms: {
      backend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'heuristics.ts.child-process-import.ast',
    'heuristics.ts.console-error.ast',
    'heuristics.ts.console-log.ast',
    'heuristics.ts.debugger.ast',
    'heuristics.ts.delete-operator.ast',
    'heuristics.ts.document-write.ast',
    'heuristics.ts.empty-catch.ast',
    'heuristics.ts.eval.ast',
    'heuristics.ts.explicit-any.ast',
    'heuristics.ts.function-constructor.ast',
    'heuristics.ts.inner-html.ast',
    'heuristics.ts.insert-adjacent-html.ast',
    'heuristics.ts.new-promise-async.ast',
    'heuristics.ts.process-exit.ast',
    'heuristics.ts.set-interval-string.ast',
    'heuristics.ts.set-timeout-string.ast',
    'heuristics.ts.with-statement.ast',
  ]);
  assert.equal(extracted.every((finding) => finding.source === 'heuristics:ast'), true);
});

test('skips TypeScript heuristics for test files', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/frontend/src/feature/file.spec.ts',
        'const cp = require("child_process"); const value: any = 1; const obj: any = { secret: 1 }; const el: any = {}; try { work(); } catch {} console.log(value); console.error(value); eval("x"); new Function("return 1"); setTimeout("work()", 100); setInterval("work()", 100); new Promise(async (resolve) => resolve(value)); with (Math) { max(1, 2); } process.exit(1); delete obj.secret; el.innerHTML = value; el.insertAdjacentHTML("beforeend", value); document.write(value); debugger;'
      ),
    ],
    detectedPlatforms: {
      frontend: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.equal(findings.length, 0);
});

test('detects iOS heuristics and skips bridge callback rule', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/ios/Presentation/Feature/View.swift',
        [
          'let result = value!',
          'let wrapped = AnyView(Text("hello"))',
          'let value = try! resolver.execute()',
          'let model = anyModel as! ProfileViewModel',
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

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'heuristics.ios.anyview.ast',
    'heuristics.ios.callback-style.ast',
    'heuristics.ios.force-cast.ast',
    'heuristics.ios.force-try.ast',
    'heuristics.ios.force-unwrap.ast',
  ]);
});

test('skips iOS force-try heuristic in comments and strings', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/ios/Presentation/Feature/View.swift',
        [
          '// try! commented out',
          'let message = "try! not executable"',
          '// as! commented out',
          'let castLiteral = "as! not executable"',
        ].join('\n')
      ),
    ],
    detectedPlatforms: {
      ios: { detected: true },
    },
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.equal(findings.some((finding) => finding.ruleId === 'heuristics.ios.force-try.ast'), false);
  assert.equal(findings.some((finding) => finding.ruleId === 'heuristics.ios.force-cast.ast'), false);
});

test('detects Android heuristics in production path and skips tests', () => {
  const extracted = extractHeuristicFacts({
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

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.deepEqual(toRuleIds(findings), [
    'heuristics.android.globalscope.ast',
    'heuristics.android.run-blocking.ast',
    'heuristics.android.thread-sleep.ast',
  ]);
});

test('returns empty when no heuristic platform is detected', () => {
  const extracted = extractHeuristicFacts({
    facts: [fileContentFact('apps/backend/src/feature/file.ts', 'const value: any = 1;')],
    detectedPlatforms: {},
  });

  const findings = evaluateRules(astHeuristicsRuleSet, extracted);
  assert.equal(findings.length, 0);
});

test('extracts typed heuristic facts with expected metadata', () => {
  const extracted = extractHeuristicFacts({
    facts: [
      fileContentFact(
        'apps/frontend/src/feature/file.ts',
        'const cp = require("child_process"); const value: any = 1; const obj: any = { secret: 1 }; const el: any = {}; try { work(); } catch {} console.log(value); console.error(value); eval("x"); new Function("return 1"); setTimeout("work()", 100); setInterval("work()", 100); new Promise(async (resolve) => resolve(value)); with (Math) { max(1, 2); } process.exit(1); delete obj.secret; el.innerHTML = value; el.insertAdjacentHTML("beforeend", value); document.write(value); debugger;'
      ),
    ],
    detectedPlatforms: {
      frontend: { detected: true },
    },
  });

  assert.equal(extracted.length, 17);
  assert.equal(extracted.every((fact) => fact.kind === 'Heuristic'), true);
  assert.equal(extracted.every((fact) => fact.source === 'heuristics:ast'), true);
});
