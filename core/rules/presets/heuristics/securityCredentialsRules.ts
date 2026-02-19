import type { RuleSet } from '../../RuleSet';

export const securityCredentialsRules: RuleSet = [
  {
    id: 'heuristics.ts.hardcoded-secret-token.ast',
    description:
      'Detects hardcoded secret/token/password/apiKey-like string literals in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.hardcoded-secret-token.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected hardcoded secret/token literal.',
      code: 'HEURISTICS_HARDCODED_SECRET_TOKEN_AST',
    },
  },
  {
    id: 'heuristics.ts.insecure-token-math-random.ast',
    description:
      'Detects insecure token/secret generation using Math.random in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.insecure-token-math-random.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected insecure token generation via Math.random.',
      code: 'HEURISTICS_INSECURE_TOKEN_MATH_RANDOM_AST',
    },
  },
  {
    id: 'heuristics.ts.insecure-token-date-now.ast',
    description:
      'Detects insecure token/secret generation using Date.now in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.insecure-token-date-now.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected insecure token generation via Date.now.',
      code: 'HEURISTICS_INSECURE_TOKEN_DATE_NOW_AST',
    },
  },
  {
    id: 'heuristics.ts.weak-token-randomuuid.ast',
    description:
      'Detects token/secret generation using crypto.randomUUID in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.weak-token-randomuuid.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected weak token generation via crypto.randomUUID.',
      code: 'HEURISTICS_WEAK_TOKEN_RANDOMUUID_AST',
    },
  },
];
