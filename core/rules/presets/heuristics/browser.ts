import type { RuleSet } from '../../RuleSet';

export const browserRules: RuleSet = [
  {
    id: 'heuristics.ts.inner-html.ast',
    description: 'Detects innerHTML assignments in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.inner-html.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected innerHTML assignment.',
      code: 'HEURISTICS_INNER_HTML_AST',
    },
  },
  {
    id: 'heuristics.ts.document-write.ast',
    description: 'Detects document.write usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.document-write.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected document.write usage.',
      code: 'HEURISTICS_DOCUMENT_WRITE_AST',
    },
  },
  {
    id: 'heuristics.ts.insert-adjacent-html.ast',
    description: 'Detects insertAdjacentHTML usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.insert-adjacent-html.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected insertAdjacentHTML usage.',
      code: 'HEURISTICS_INSERT_ADJACENT_HTML_AST',
    },
  },
];
