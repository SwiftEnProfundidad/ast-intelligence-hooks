import type { RuleSet } from '../../RuleSet';

export const securityRules: RuleSet = [
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
    id: 'heuristics.ts.weak-crypto-hash.ast',
    description:
      'Detects weak crypto hash algorithms (md5/sha1) in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.weak-crypto-hash.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected weak crypto hash usage (md5/sha1).',
      code: 'HEURISTICS_WEAK_CRYPTO_HASH_AST',
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
    id: 'heuristics.ts.buffer-alloc-unsafe.ast',
    description:
      'Detects Buffer.allocUnsafe usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.buffer-alloc-unsafe.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected Buffer.allocUnsafe usage.',
      code: 'HEURISTICS_BUFFER_ALLOC_UNSAFE_AST',
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
  {
    id: 'heuristics.ts.buffer-alloc-unsafe-slow.ast',
    description:
      'Detects Buffer.allocUnsafeSlow usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.buffer-alloc-unsafe-slow.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected Buffer.allocUnsafeSlow usage.',
      code: 'HEURISTICS_BUFFER_ALLOC_UNSAFE_SLOW_AST',
    },
  },
];
