import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { extractCompiledRulesFromSkillMarkdown } from '../skillsMarkdownRules';

test('normaliza reglas backend de SOLID/Clean Architecture/God Class a ids canonicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: [
      '✅ Verificar que NO viole SOLID (SRP, OCP, LSP, ISP, DIP)',
      '✅ Seguir Clean Architecture - Domain -> Application -> Infrastructure -> Presentation',
      '❌ God classes - Servicios que mezclan responsabilidades de dominio, aplicación, infraestructura, branching de tipos o contratos en una misma clase',
    ].join('\n'),
  });

  const ids = rules.map((rule) => rule.id).sort();
  assert.deepEqual(ids, [
    'skills.backend.enforce-clean-architecture',
    'skills.backend.no-god-classes',
    'skills.backend.no-solid-violations',
  ]);
  assert.equal(rules.every((rule) => rule.evaluationMode === 'AUTO'), true);
});

test('normaliza regla frontend SOLID a id canonico', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'frontend-guidelines',
    sourcePath: 'docs/codex-skills/frontend-enterprise-rules.md',
    sourceContent: '✅ Verificar que NO viole SOLID (SRP, OCP, LSP, ISP, DIP) en componentes',
  });

  assert.deepEqual(rules.map((rule) => rule.id), ['skills.frontend.no-solid-violations']);
});

test('aplica stage canónico PRE_PUSH para no-solid-violations cuando markdown no define stage', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '✅ Verificar que NO viole SOLID (SRP, OCP, LSP, ISP, DIP)',
  });

  assert.equal(rules.length, 1);
  assert.equal(rules[0]?.id, 'skills.backend.no-solid-violations');
  assert.equal(rules[0]?.stage, 'PRE_PUSH');
});

test('respeta stage explícito en markdown para no-solid-violations', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent:
      '✅ PRE_COMMIT: Verificar que NO viole SOLID (SRP, OCP, LSP, ISP, DIP)',
  });

  assert.equal(rules.length, 1);
  assert.equal(rules[0]?.id, 'skills.backend.no-solid-violations');
  assert.equal(rules[0]?.stage, 'PRE_COMMIT');
});

test('normaliza reglas SwiftUI modernas a ids canonicos de snapshot phase 2', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'ios-swiftui-expert-guidelines',
    sourcePath: 'docs/codex-skills/swiftui-expert-skill.md',
    sourceContent: [
      '✅ Always use foregroundStyle() instead of foregroundColor().',
      '✅ Always use clipShape(.rect(cornerRadius:)) instead of cornerRadius().',
      '✅ For iOS 18 and later, prefer the Tab API over tabItem().',
      '✅ Use .scrollIndicators(.hidden) modifier instead of showsIndicators: false.',
      '✅ Use .sheet(item:) instead of .sheet(isPresented:) for model-based content.',
      '✅ Use onChange(of:) { old, new in } or onChange(of:) { } instead of legacy single-parameter closures.',
    ].join('\n'),
  });

  const ids = rules.map((rule) => rule.id).sort();
  assert.deepEqual(ids, [
    'skills.ios.no-corner-radius',
    'skills.ios.no-foreground-color',
    'skills.ios.no-legacy-onchange',
    'skills.ios.no-scrollview-shows-indicators',
    'skills.ios.no-sheet-is-presented',
    'skills.ios.no-tab-item',
  ]);
});

test('normaliza reglas SwiftUI state ownership a ids canonicos del slice phase6', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'ios-swiftui-expert-guidelines',
    sourcePath: 'docs/codex-skills/swiftui-expert-skill.md',
    sourceContent: [
      '- **Never declare passed values as `@State` or `@StateObject`** (they only accept initial values)',
      '- Use `@State` with `@Observable` classes (not `@StateObject`)',
    ].join('\n'),
  });

  const ids = rules.map((rule) => rule.id).sort();
  assert.deepEqual(ids, [
    'skills.ios.no-legacy-swiftui-observable-wrapper',
    'skills.ios.no-passed-value-state-wrapper',
  ]);
});

test('normaliza reglas SwiftUI list/search/layout a ids canonicos del slice phase7', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'ios-swiftui-expert-guidelines',
    sourcePath: 'docs/codex-skills/swiftui-expert-skill.md',
    sourceContent: [
      '- Use stable identity for `ForEach` (never `.indices` for dynamic content)',
      '- Use `localizedStandardContains()` for user-input filtering (not `contains()`)',
      '- Avoid layout thrash (deep hierarchies, excessive `GeometryReader`)',
      '- Use `bold()` instead of `fontWeight(.bold)` for straightforward text emphasis.',
    ].join('\n'),
  });

  const ids = rules.map((rule) => rule.id).sort();
  assert.deepEqual(ids, [
    'skills.ios.no-contains-user-filter',
    'skills.ios.no-font-weight-bold',
    'skills.ios.no-foreach-indices',
    'skills.ios.no-geometryreader',
  ]);
});

test('normaliza reglas Core Data a ids canonicos del slice phase8', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'ios-core-data-guidelines',
    sourcePath: 'docs/codex-skills/core-data-expert.md',
    sourceContent: [
      '- ✅ Keep Core Data orchestration inside infrastructure or repository layers instead of presentation code.',
      '- ❌ Leaking context-scoped managed objects into SwiftUI state or view models.',
    ].join('\n'),
  });

  const ids = rules.map((rule) => rule.id).sort();
  assert.deepEqual(ids, [
    'skills.ios.no-core-data-layer-leak',
    'skills.ios.no-nsmanagedobject-state-leak',
  ]);
});

test('normaliza reglas Swift Concurrency a ids canonicos del slice phase9', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'ios-concurrency-guidelines',
    sourcePath: 'docs/codex-skills/swift-concurrency.md',
    sourceContent: [
      '- ✅ Avoid `@preconcurrency` in production code without a documented safety invariant and a removal ticket.',
      '- ✅ Avoid `nonisolated(unsafe)` in production code without a documented safety invariant and a removal ticket.',
      '- ✅ Prefer explicit actor isolation or `await MainActor.run` instead of `MainActor.assumeIsolated`.',
    ].join('\n'),
  });

  const ids = rules.map((rule) => rule.id).sort();
  assert.deepEqual(ids, [
    'skills.ios.no-assume-isolated',
    'skills.ios.no-nonisolated-unsafe',
    'skills.ios.no-preconcurrency',
  ]);
});

test('normaliza reglas Swift Testing async a ids canonicos del slice phase4', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'ios-swift-testing-guidelines',
    sourcePath: 'docs/codex-skills/swift-testing-expert.md',
    sourceContent: [
      '✅ Prefer await fulfillment(of:) over wait(for:) and waitForExpectations(timeout:) in async XCTest migration paths.',
      '✅ Prefer confirmation over expectation(description:) scaffolding when modern Swift Testing flow is available.',
    ].join('\n'),
  });

  const ids = rules.map((rule) => rule.id).sort();
  assert.deepEqual(ids, [
    'skills.ios.no-legacy-expectation-description',
    'skills.ios.no-wait-for-expectations',
  ]);
});

test('normaliza reglas Swift Testing de suites a ids canonicos del slice phase5', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'ios-swift-testing-guidelines',
    sourcePath: 'docs/codex-skills/swift-testing-expert.md',
    sourceContent: [
      '- ✅ Prefer `@Test` functions over `test...` methods when the target already supports Swift Testing.',
      '- ❌ Mixing legacy XCTest style into new Swift Testing suites without an explicit compatibility reason.',
    ].join('\n'),
  });

  const ids = rules.map((rule) => rule.id).sort();
  assert.deepEqual(ids, [
    'skills.ios.no-mixed-testing-frameworks',
    'skills.ios.prefer-swift-testing',
  ]);
});

test('reglas no canonicas extraidas desde markdown se degradan a DECLARATIVE para evitar AUTO no mapeado', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent: '- Must avoid long transaction scripts across three bounded contexts.',
  });

  assert.equal(rules.length, 1);
  assert.equal(rules[0]?.id.startsWith('skills.backend.guideline.'), true);
  assert.equal(rules[0]?.evaluationMode, 'DECLARATIVE');
});

test('reglas no canonicas con nodos AST explicitos se compilan como AUTO con astNodeIds dinámicos', () => {
  const rules = extractCompiledRulesFromSkillMarkdown({
    sourceSkill: 'backend-guidelines',
    sourcePath: 'docs/codex-skills/backend-enterprise-rules.md',
    sourceContent:
      '- Must enforce complex transaction boundary safety with AST nodes (`heuristics.ts.explicit-any.ast`) and (`heuristics.ts.empty-catch.ast`).',
  });

  assert.equal(rules.length, 1);
  assert.equal(rules[0]?.evaluationMode, 'AUTO');
  assert.deepEqual(rules[0]?.astNodeIds, [
    'heuristics.ts.empty-catch.ast',
    'heuristics.ts.explicit-any.ast',
  ]);
});

test('skills estructurales de las cuatro plataformas no expresan God/Massive como umbral de lineas', () => {
  const skillPaths = [
    'docs/codex-skills/ios-enterprise-rules.md',
    'docs/codex-skills/android-enterprise-rules.md',
    'docs/codex-skills/backend-enterprise-rules.md',
    'docs/codex-skills/frontend-enterprise-rules.md',
    'vendor/skills/ios-enterprise-rules/SKILL.md',
    'vendor/skills/android-enterprise-rules/SKILL.md',
    'vendor/skills/backend-enterprise-rules/SKILL.md',
    'vendor/skills/frontend-enterprise-rules/SKILL.md',
  ];

  const forbiddenStructuralThreshold =
    /\b(?:god classes?|god activities|massive view controllers?)\b[^\n]*(?:[<>]=?\s*\d+|\d+\s*(?:lines|lineas|lineas|líneas))/iu;

  const offenders = skillPaths.flatMap((relativePath) => {
    const content = readFileSync(join(process.cwd(), relativePath), 'utf8');
    return content
      .split('\n')
      .map((line, index) => ({ line, lineNumber: index + 1, relativePath }))
      .filter(({ line }) => forbiddenStructuralThreshold.test(line))
      .map(({ line, lineNumber, relativePath }) => `${relativePath}:${lineNumber}: ${line.trim()}`);
  });

  assert.deepEqual(offenders, []);
});
