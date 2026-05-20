import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractHeuristicFacts,
  type DependencyFact,
  type Fact,
  type FactSet,
  type FileChangeFact,
  type FileContentFact,
  type HeuristicExtractionParams,
  type HeuristicFact,
} from './index';

test('facts barrel expone tipos compatibles para Fact y FactSet', () => {
  const fileChangeFact: FileChangeFact = {
    kind: 'FileChange',
    path: 'apps/backend/src/main.ts',
    changeType: 'modified',
  };
  const dependencyFact: DependencyFact = {
    kind: 'Dependency',
    from: 'services/user',
    to: 'repositories/user',
    source: 'import graph',
  };
  const fileContentFact: FileContentFact = {
    kind: 'FileContent',
    path: 'apps/backend/src/main.ts',
    content: 'export const ready = true;',
  };
  const heuristicFact: HeuristicFact = {
    kind: 'Heuristic',
    ruleId: 'heuristics.example.rule',
    severity: 'WARN',
    code: 'HEURISTICS_EXAMPLE_RULE',
    message: 'Example heuristic fact.',
  };

  const facts: FactSet = [
    { ...fileChangeFact, source: 'git' },
    dependencyFact,
    { ...fileContentFact, source: 'repo' },
    { ...heuristicFact, source: 'heuristics:ast' },
  ];
  const firstFact: Fact = facts[0];

  assert.equal(firstFact.kind, 'FileChange');
  assert.equal(facts.length, 4);
});

test('facts barrel expone extractHeuristicFacts y permite retorno vacio sin plataformas detectadas', () => {
  const params: HeuristicExtractionParams = {
    facts: [
      {
        kind: 'FileContent',
        source: 'repo',
        path: 'apps/backend/src/app.ts',
        content: 'console.log("hello")',
      },
    ],
    detectedPlatforms: {
      backend: { detected: false },
      frontend: { detected: false },
      ios: { detected: false },
      android: { detected: false },
    },
  };

  const extractedFacts = extractHeuristicFacts(params);

  assert.deepEqual(extractedFacts, []);
});

test('extractHeuristicFacts emite strong delegate iOS con linea y remediation accionable', () => {
  const params: HeuristicExtractionParams = {
    facts: [
      {
        kind: 'FileContent',
        source: 'repo',
        path: 'apps/ios/Infrastructure/Permissions/SystemPermissionsService.swift',
        content: `
final class SystemPermissionsService {
  var delegate: PermissionsServiceDelegate?
}
`,
      },
    ],
    detectedPlatforms: {
      ios: { detected: true, confidence: 'HIGH' },
    },
  };

  const extractedFacts = extractHeuristicFacts(params);
  const match = extractedFacts.find(
    (fact) => fact.ruleId === 'heuristics.ios.memory.strong-delegate.ast'
  );

  assert.ok(match);
  assert.deepEqual(match.lines, [3]);
  assert.deepEqual(match.primary_node?.lines, [3]);
  assert.match(match.expected_fix ?? '', /weak var delegate/i);
});
