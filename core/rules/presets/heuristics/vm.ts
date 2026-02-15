import type { RuleSet } from '../../RuleSet';

export const vmRules: RuleSet = [
  {
    id: 'heuristics.ts.vm-dynamic-code-execution.ast',
    description:
      'Detects vm dynamic code execution via runInNewContext/runInThisContext in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.vm-dynamic-code-execution.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected vm dynamic code execution call.',
      code: 'HEURISTICS_VM_DYNAMIC_CODE_EXECUTION_AST',
    },
  },
];
