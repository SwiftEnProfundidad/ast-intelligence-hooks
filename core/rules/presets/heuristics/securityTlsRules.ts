import type { RuleSet } from '../../RuleSet';

export const securityTlsRules: RuleSet = [
  {
    id: 'heuristics.ts.tls-reject-unauthorized-false.ast',
    description:
      'Detects TLS configuration using rejectUnauthorized=false in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.tls-reject-unauthorized-false.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected TLS rejectUnauthorized=false configuration.',
      code: 'HEURISTICS_TLS_REJECT_UNAUTHORIZED_FALSE_AST',
    },
  },
  {
    id: 'heuristics.ts.tls-env-override.ast',
    description:
      'Detects NODE_TLS_REJECT_UNAUTHORIZED=0 environment override in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.tls-env-override.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected NODE_TLS_REJECT_UNAUTHORIZED=0 override.',
      code: 'HEURISTICS_TLS_ENV_OVERRIDE_AST',
    },
  },
];
