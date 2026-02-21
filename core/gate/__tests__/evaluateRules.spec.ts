import { evaluateRules } from '../evaluateRules';
import type { RuleSet } from '../../rules/RuleSet';

describe('evaluateRules', () => {
  test('genera finding cuando la condicion coincide y usa code explicito', () => {
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
        kind: 'FileChange' as const,
        path: 'apps/backend/src/main.ts',
        changeType: 'modified' as const,
        source: 'git',
      },
    ];

    const findings = evaluateRules(rules, facts);

    expect(findings).toHaveLength(1);
    expect(findings[0]).toEqual({
      ruleId: 'rule.explicit.code',
      severity: 'WARN',
      code: 'BACKEND_FILE_MODIFIED',
      message: 'Backend file modified.',
      filePath: 'apps/backend/src/main.ts',
      matchedBy: 'FileChange',
      source: 'git',
    });
  });

  test('usa id de la regla como code cuando no se define en consecuencia', () => {
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
        kind: 'Dependency' as const,
        from: 'core/gate/evaluateGate',
        to: 'core/gate/evaluateRules',
        source: 'depcruise',
      },
    ];

    const findings = evaluateRules(rules, facts);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.code).toBe('rule.code.fallback');
    expect(findings[0]?.severity).toBe('ERROR');
  });

  test('respeta scope y no genera hallazgo cuando no coincide', () => {
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
        kind: 'FileContent' as const,
        path: 'apps/frontend/src/App.tsx',
        content: 'const token = "abc";',
        source: 'repo',
      },
    ];

    const findings = evaluateRules(rules, facts);
    expect(findings).toEqual([]);
  });

  test('genera un finding por cada archivo que coincide en FileContent', () => {
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
        kind: 'FileContent' as const,
        path: 'apps/backend/src/a.ts',
        content: 'const a: any = 1;',
        source: 'repo',
      },
      {
        kind: 'FileContent' as const,
        path: 'apps/backend/src/b.ts',
        content: 'const b: any = 2;',
        source: 'repo',
      },
    ];

    const findings = evaluateRules(rules, facts);

    expect(findings).toHaveLength(2);
    expect(findings.map((finding) => finding.filePath).sort()).toEqual([
      'apps/backend/src/a.ts',
      'apps/backend/src/b.ts',
    ]);
  });

  test('genera un finding por cada heuristica coincidente', () => {
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
        kind: 'Heuristic' as const,
        ruleId: 'heuristics.ts.console-log.ast',
        severity: 'WARN' as const,
        code: 'HEURISTICS_CONSOLE_LOG_AST',
        message: 'console.log',
        filePath: 'core/a.ts',
        source: 'heuristics:ast',
      },
      {
        kind: 'Heuristic' as const,
        ruleId: 'heuristics.ts.console-log.ast',
        severity: 'WARN' as const,
        code: 'HEURISTICS_CONSOLE_LOG_AST',
        message: 'console.log',
        filePath: 'core/b.ts',
        source: 'heuristics:ast',
      },
    ];

    const findings = evaluateRules(rules, facts);

    expect(findings).toHaveLength(2);
    expect(findings.map((finding) => finding.filePath).sort()).toEqual([
      'core/a.ts',
      'core/b.ts',
    ]);
    expect(findings.every((finding) => finding.matchedBy === 'Heuristic')).toBe(true);
  });

  test('no genera findings cuando where de FileChange no coincide por pathPrefix o changeType', () => {
    const rules: RuleSet = [
      {
        id: 'rule.filechange.where.mismatch',
        description: 'No debe matchear',
        severity: 'WARN',
        when: {
          kind: 'FileChange',
          where: { pathPrefix: 'apps/backend/', changeType: 'modified' },
        },
        then: {
          kind: 'Finding',
          message: 'Should not match',
        },
      },
    ];
    const facts = [
      {
        kind: 'FileChange' as const,
        path: 'apps/frontend/src/main.ts',
        changeType: 'modified' as const,
        source: 'git',
      },
      {
        kind: 'FileChange' as const,
        path: 'apps/backend/src/main.ts',
        changeType: 'added' as const,
        source: 'git',
      },
    ];

    expect(evaluateRules(rules, facts)).toEqual([]);
  });

  test('no genera findings cuando regex de FileContent no coincide y scope sin include permite evaluar', () => {
    const rules: RuleSet = [
      {
        id: 'rule.filecontent.regex.mismatch',
        description: 'Regex no coincide',
        severity: 'WARN',
        when: {
          kind: 'FileContent',
          regex: ['fetch\\('],
        },
        then: {
          kind: 'Finding',
          message: 'Should not match regex',
        },
        scope: {
          exclude: ['apps/backend/generated/'],
        },
      },
    ];
    const facts = [
      {
        kind: 'FileContent' as const,
        path: 'apps/backend/src/service.ts',
        content: 'const value = 1;',
        source: 'repo',
      },
    ];

    expect(evaluateRules(rules, facts)).toEqual([]);
  });

  test('no genera findings cuando where de Dependency no coincide por from o to', () => {
    const rules: RuleSet = [
      {
        id: 'rule.dependency.where.mismatch',
        description: 'Dependency mismatch',
        severity: 'ERROR',
        when: {
          kind: 'Dependency',
          where: {
            from: 'integrations/git/runPlatformGate',
            to: 'integrations/evidence/buildEvidence',
          },
        },
        then: {
          kind: 'Finding',
          message: 'Should not match dependency',
        },
      },
    ];
    const facts = [
      {
        kind: 'Dependency' as const,
        from: 'core/gate/evaluateGate',
        to: 'integrations/evidence/buildEvidence',
        source: 'depcruise',
      },
      {
        kind: 'Dependency' as const,
        from: 'integrations/git/runPlatformGate',
        to: 'core/gate/evaluateRules',
        source: 'depcruise',
      },
    ];

    expect(evaluateRules(rules, facts)).toEqual([]);
  });

  test('no genera findings cuando where de Heuristic no coincide por ruleId, code o filePathPrefix', () => {
    const rules: RuleSet = [
      {
        id: 'rule.heuristic.where.mismatch',
        description: 'Heuristic mismatch',
        severity: 'WARN',
        when: {
          kind: 'Heuristic',
          where: {
            ruleId: 'heuristics.ts.console-log.ast',
            code: 'HEURISTICS_CONSOLE_LOG_AST',
            filePathPrefix: 'apps/backend/',
          },
        },
        then: {
          kind: 'Finding',
          message: 'Should not match heuristic',
        },
      },
    ];
    const facts = [
      {
        kind: 'Heuristic' as const,
        ruleId: 'heuristics.ts.child-process-exec-file-sync.ast',
        severity: 'WARN' as const,
        code: 'HEURISTICS_CONSOLE_LOG_AST',
        message: 'mismatch ruleId',
        filePath: 'apps/backend/src/a.ts',
        source: 'heuristics:ast',
      },
      {
        kind: 'Heuristic' as const,
        ruleId: 'heuristics.ts.console-log.ast',
        severity: 'WARN' as const,
        code: 'OTHER_CODE',
        message: 'mismatch code',
        filePath: 'apps/backend/src/b.ts',
        source: 'heuristics:ast',
      },
      {
        kind: 'Heuristic' as const,
        ruleId: 'heuristics.ts.console-log.ast',
        severity: 'WARN' as const,
        code: 'HEURISTICS_CONSOLE_LOG_AST',
        message: 'mismatch filePathPrefix',
        filePath: 'apps/frontend/src/c.ts',
        source: 'heuristics:ast',
      },
    ];

    expect(evaluateRules(rules, facts)).toEqual([]);
  });

  test('evalua condiciones compuestas con conditionMatches cuando no son simples', () => {
    const rules: RuleSet = [
      {
        id: 'rule.composed.any',
        description: 'Usa Any para fallback conditionMatches',
        severity: 'ERROR',
        when: {
          kind: 'Any',
          conditions: [
            {
              kind: 'FileChange',
              where: { pathPrefix: 'apps/backend/', changeType: 'modified' },
            },
            {
              kind: 'Heuristic',
              where: { code: 'HEURISTICS_CONSOLE_LOG_AST' },
            },
          ],
        },
        then: {
          kind: 'Finding',
          message: 'Composed condition matched',
        },
      },
    ];
    const facts = [
      {
        kind: 'Heuristic' as const,
        ruleId: 'heuristics.ts.console-log.ast',
        severity: 'WARN' as const,
        code: 'HEURISTICS_CONSOLE_LOG_AST',
        message: 'console.log',
        filePath: 'apps/backend/src/main.ts',
        source: 'heuristics:ast',
      },
    ];

    const findings = evaluateRules(rules, facts);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toEqual({
      ruleId: 'rule.composed.any',
      severity: 'ERROR',
      code: 'rule.composed.any',
      message: 'Composed condition matched',
      filePath: undefined,
      matchedBy: undefined,
      source: undefined,
    });
  });
});
