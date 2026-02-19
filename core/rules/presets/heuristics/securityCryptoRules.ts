import type { RuleSet } from '../../RuleSet';

export const securityCryptoRules: RuleSet = [
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
