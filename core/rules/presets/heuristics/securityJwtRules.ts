import type { RuleSet } from '../../RuleSet';

export const securityJwtRules: RuleSet = [
  {
    id: 'heuristics.ts.jwt-decode-without-verify.ast',
    description:
      'Detects jsonwebtoken.decode usage without signature verification in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.jwt-decode-without-verify.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected jsonwebtoken.decode usage without verify.',
      code: 'HEURISTICS_JWT_DECODE_WITHOUT_VERIFY_AST',
    },
  },
  {
    id: 'heuristics.ts.jwt-verify-ignore-expiration.ast',
    description:
      'Detects jsonwebtoken.verify usage with ignoreExpiration=true in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.jwt-verify-ignore-expiration.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected jsonwebtoken.verify with ignoreExpiration=true.',
      code: 'HEURISTICS_JWT_VERIFY_IGNORE_EXPIRATION_AST',
    },
  },
  {
    id: 'heuristics.ts.jwt-sign-no-expiration.ast',
    description:
      'Detects jsonwebtoken.sign usage without exp/expiresIn in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.jwt-sign-no-expiration.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected jsonwebtoken.sign without expiration.',
      code: 'HEURISTICS_JWT_SIGN_NO_EXPIRATION_AST',
    },
  },
];
