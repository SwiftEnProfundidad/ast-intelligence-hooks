import assert from 'node:assert/strict';
import test from 'node:test';
import type { Fact } from '../../../core/facts/Fact';
import type { Finding } from '../../../core/gate/Finding';
import type { RuleSet } from '../../../core/rules/RuleSet';
import { attachFindingTraceability } from '../findingTraceability';

test('attachFindingTraceability agrega filePath y lines para reglas FileContent', () => {
  const rules: RuleSet = [
    {
      id: 'backend.no-console-log',
      description: 'No console.log',
      severity: 'CRITICAL',
      when: {
        kind: 'FileContent',
        contains: ['console.log'],
      },
      then: {
        kind: 'Finding',
        code: 'BACKEND_NO_CONSOLE_LOG',
        message: 'console.log no permitido',
      },
      scope: {
        include: ['apps/backend/*'],
      },
    },
  ];

  const facts: ReadonlyArray<Fact> = [
    {
      kind: 'FileContent',
      path: 'apps/backend/src/main.ts',
      content: 'export const run = () => {\n  console.log("x");\n  console.log("y");\n};\n',
      source: 'git:staged',
    },
    {
      kind: 'FileContent',
      path: 'apps/web/src/App.tsx',
      content: 'console.log("web")',
      source: 'git:staged',
    },
  ];

  const findings: ReadonlyArray<Finding> = [
    {
      ruleId: 'backend.no-console-log',
      severity: 'CRITICAL',
      code: 'BACKEND_NO_CONSOLE_LOG',
      message: 'console.log no permitido',
    },
  ];

  const traced = attachFindingTraceability({
    findings,
    rules,
    facts,
  });

  assert.equal(traced[0]?.filePath, 'apps/backend/src/main.ts');
  assert.deepEqual(traced[0]?.lines, [2, 3]);
  assert.equal(traced[0]?.matchedBy, 'FileContent');
  assert.equal(traced[0]?.source, 'git:staged');
});

test('attachFindingTraceability agrega filePath para reglas Heuristic', () => {
  const rules: RuleSet = [
    {
      id: 'methodology.solid.srp.class-command-query-mix',
      description: 'SRP/CQS',
      severity: 'ERROR',
      when: {
        kind: 'Heuristic',
        where: {
          ruleId: 'heuristics.ts.solid.srp.class-command-query-mix.ast',
        },
      },
      then: {
        kind: 'Finding',
        code: 'SOLID_SRP_CLASS_COMMAND_QUERY_MIX',
        message: 'SRP/CQS violation',
      },
    },
  ];

  const facts: ReadonlyArray<Fact> = [
    {
      kind: 'Heuristic',
      ruleId: 'heuristics.ts.solid.srp.class-command-query-mix.ast',
      severity: 'ERROR',
      code: 'HEURISTICS_SOLID_SRP_CLASS_COMMAND_QUERY_MIX_AST',
      message: 'AST heuristic detected class-level SRP/CQS mix.',
      filePath: 'apps/backend/src/application/OrderService.ts',
      lines: [48, 12, 48],
      source: 'heuristics:ast',
    },
  ];

  const findings: ReadonlyArray<Finding> = [
    {
      ruleId: 'methodology.solid.srp.class-command-query-mix',
      severity: 'ERROR',
      code: 'SOLID_SRP_CLASS_COMMAND_QUERY_MIX',
      message: 'SRP/CQS violation',
    },
  ];

  const traced = attachFindingTraceability({
    findings,
    rules,
    facts,
  });

  assert.equal(traced[0]?.filePath, 'apps/backend/src/application/OrderService.ts');
  assert.deepEqual(traced[0]?.lines, [12, 48]);
  assert.equal(traced[0]?.matchedBy, 'Heuristic');
  assert.equal(traced[0]?.source, 'heuristics:ast');
});

test('attachFindingTraceability respeta lineas del fichero del finding para reglas Heuristic', () => {
  const rules: RuleSet = [
    {
      id: 'common.types.unknown_without_guard',
      description: 'Unknown sin guardas',
      severity: 'WARN',
      when: {
        kind: 'Heuristic',
        where: {
          ruleId: 'common.types.unknown_without_guard',
        },
      },
      then: {
        kind: 'Finding',
        code: 'COMMON_TYPES_UNKNOWN_WITHOUT_GUARD',
        message: 'Unknown sin guard',
      },
    },
  ];

  const facts: ReadonlyArray<Fact> = [
    {
      kind: 'Heuristic',
      ruleId: 'common.types.unknown_without_guard',
      severity: 'WARN',
      code: 'COMMON_TYPES_UNKNOWN_WITHOUT_GUARD_AST',
      message: 'Unknown usage',
      filePath: 'src/a.ts',
      lines: [11],
      source: 'heuristics:ast',
    },
    {
      kind: 'Heuristic',
      ruleId: 'common.types.unknown_without_guard',
      severity: 'WARN',
      code: 'COMMON_TYPES_UNKNOWN_WITHOUT_GUARD_AST',
      message: 'Unknown usage',
      filePath: 'src/b.ts',
      lines: [29],
      source: 'heuristics:ast',
    },
  ];

  const findings: ReadonlyArray<Finding> = [
    {
      ruleId: 'common.types.unknown_without_guard',
      severity: 'WARN',
      code: 'COMMON_TYPES_UNKNOWN_WITHOUT_GUARD',
      message: 'Unknown sin guard',
      filePath: 'src/a.ts',
    },
    {
      ruleId: 'common.types.unknown_without_guard',
      severity: 'WARN',
      code: 'COMMON_TYPES_UNKNOWN_WITHOUT_GUARD',
      message: 'Unknown sin guard',
      filePath: 'src/b.ts',
    },
  ];

  const traced = attachFindingTraceability({
    findings,
    rules,
    facts,
  });

  assert.deepEqual(
    traced.map((finding) => finding.lines),
    [[11], [29]]
  );
});

test('attachFindingTraceability mantiene finding sin contexto cuando la regla es Not pura', () => {
  const rules: RuleSet = [
    {
      id: 'methodology.bdd.backend-application-change-requires-spec',
      description: 'BDD requiere spec',
      severity: 'ERROR',
      when: {
        kind: 'Not',
        condition: {
          kind: 'FileContent',
          contains: ['Feature:'],
        },
      },
      then: {
        kind: 'Finding',
        code: 'BDD_BACKEND_APPLICATION_CHANGE_REQUIRES_SPEC',
        message: 'BDD violation',
      },
      scope: {
        include: ['scenarios/*'],
      },
    },
  ];

  const facts: ReadonlyArray<Fact> = [
    {
      kind: 'FileContent',
      path: 'scenarios/backend/orders.feature',
      content: 'Scenario: missing feature header',
      source: 'git:staged',
    },
  ];

  const findings: ReadonlyArray<Finding> = [
    {
      ruleId: 'methodology.bdd.backend-application-change-requires-spec',
      severity: 'ERROR',
      code: 'BDD_BACKEND_APPLICATION_CHANGE_REQUIRES_SPEC',
      message: 'BDD violation',
    },
  ];

  const traced = attachFindingTraceability({
    findings,
    rules,
    facts,
  });

  assert.equal(traced[0]?.filePath, undefined);
  assert.equal(traced[0]?.lines, undefined);
});
