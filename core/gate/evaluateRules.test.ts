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
