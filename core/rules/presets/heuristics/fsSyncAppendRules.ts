import type { RuleSet } from '../../RuleSet';

export const fsSyncAppendRules: RuleSet = [
  {
    id: 'heuristics.ts.fs-append-file-sync.ast',
    description: 'Detects fs.appendFileSync usage in TypeScript/TSX production files.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ts.fs-append-file-sync.ast',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AST heuristic detected fs.appendFileSync usage.',
      code: 'HEURISTICS_FS_APPEND_FILE_SYNC_AST',
    },
  },
];
