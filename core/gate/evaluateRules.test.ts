import assert from 'node:assert/strict';
import test from 'node:test';
import type { RuleSet } from '../rules/RuleSet';
import { evaluateRules } from './evaluateRules';

test('evaluateRules genera finding cuando la condicion coincide y usa code explicito', () => {
  const rules: RuleSet = [
    {
      id: 'rule.explicit.code',
      description: 'Detecta cambios en backend',
      severity: 'WARN',
      when: {
        kind: 'FileChange',
        where: { pathPrefix: 'apps/backend/', changeType: 'modified' },
      },
      then: {
        kind: 'Finding',
        message: 'Backend file modified.',
        code: 'BACKEND_FILE_MODIFIED',
      },
    },
  ];
  const facts = [
    {
      kind: 'FileChange',
      path: 'apps/backend/src/main.ts',
      changeType: 'modified',
      source: 'git',
    },
  ] as const;

  const findings = evaluateRules(rules, facts);

  assert.equal(findings.length, 1);
  assert.deepEqual(findings[0], {
    ruleId: 'rule.explicit.code',
    severity: 'WARN',
    code: 'BACKEND_FILE_MODIFIED',
    message: 'Backend file modified.',
    filePath: 'apps/backend/src/main.ts',
    matchedBy: 'FileChange',
    source: 'git',
  });
});

test('evaluateRules usa id de la regla como code cuando no se define en consecuencia', () => {
  const rules: RuleSet = [
    {
      id: 'rule.code.fallback',
      description: 'Detecta dependencia concreta',
      severity: 'ERROR',
      when: {
        kind: 'Dependency',
        where: { from: 'core/gate/evaluateGate', to: 'core/gate/evaluateRules' },
      },
      then: {
        kind: 'Finding',
        message: 'Dependency matched.',
      },
    },
  ];
  const facts = [
    {
      kind: 'Dependency',
      from: 'core/gate/evaluateGate',
      to: 'core/gate/evaluateRules',
      source: 'depcruise',
    },
  ] as const;

  const findings = evaluateRules(rules, facts);

  assert.equal(findings.length, 1);
  assert.equal(findings[0]?.code, 'rule.code.fallback');
  assert.equal(findings[0]?.severity, 'ERROR');
});

test('evaluateRules respeta scope y no genera hallazgo cuando no coincide', () => {
  const rules: RuleSet = [
    {
      id: 'rule.scope.filtered',
      description: 'Busca token en backend',
      severity: 'WARN',
      when: {
        kind: 'FileContent',
        contains: ['token'],
      },
      then: {
        kind: 'Finding',
        message: 'Token found.',
      },
      scope: {
        include: ['apps/backend/*'],
      },
    },
  ];
  const facts = [
    {
      kind: 'FileContent',
      path: 'apps/frontend/src/App.tsx',
      content: 'const token = "abc";',
      source: 'repo',
    },
  ] as const;

  const findings = evaluateRules(rules, facts);

  assert.deepEqual(findings, []);
});

test('evaluateRules genera un finding por cada archivo que coincide en FileContent', () => {
  const rules: RuleSet = [
    {
      id: 'rule.multi.filecontent',
      description: 'Detecta any en backend',
      severity: 'WARN',
      when: {
        kind: 'FileContent',
        regex: [':\\s*any\\b'],
      },
      then: {
        kind: 'Finding',
        message: 'Avoid any',
      },
      scope: {
        include: ['apps/backend/'],
      },
    },
  ];
  const facts = [
    {
      kind: 'FileContent',
      path: 'apps/backend/src/a.ts',
      content: 'const a: any = 1;',
      source: 'repo',
    },
    {
      kind: 'FileContent',
      path: 'apps/backend/src/b.ts',
      content: 'const b: any = 2;',
      source: 'repo',
    },
  ] as const;

  const findings = evaluateRules(rules, facts);

  assert.equal(findings.length, 2);
  assert.deepEqual(
    findings.map((finding) => finding.filePath).sort(),
    ['apps/backend/src/a.ts', 'apps/backend/src/b.ts']
  );
});

test('evaluateRules genera un finding por cada heuristica coincidente', () => {
  const rules: RuleSet = [
    {
      id: 'rule.multi.heuristic',
      description: 'Mapea heuristicas de console.log',
      severity: 'ERROR',
      when: {
        kind: 'Heuristic',
        where: {
          ruleId: 'heuristics.ts.console-log.ast',
        },
      },
      then: {
        kind: 'Finding',
        message: 'console.log detected',
      },
    },
  ];
  const facts = [
    {
      kind: 'Heuristic',
      ruleId: 'heuristics.ts.console-log.ast',
      severity: 'WARN',
      code: 'HEURISTICS_CONSOLE_LOG_AST',
      message: 'console.log',
      filePath: 'core/a.ts',
      source: 'heuristics:ast',
    },
    {
      kind: 'Heuristic',
      ruleId: 'heuristics.ts.console-log.ast',
      severity: 'WARN',
      code: 'HEURISTICS_CONSOLE_LOG_AST',
      message: 'console.log',
      filePath: 'core/b.ts',
      source: 'heuristics:ast',
    },
  ] as const;

  const findings = evaluateRules(rules, facts);

  assert.equal(findings.length, 2);
  assert.deepEqual(
    findings.map((finding) => finding.filePath).sort(),
    ['core/a.ts', 'core/b.ts']
  );
  assert.equal(findings.every((finding) => finding.matchedBy === 'Heuristic'), true);
});
