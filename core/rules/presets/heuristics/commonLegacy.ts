import type { RuleSet } from '../../RuleSet';

export const commonLegacyRules: RuleSet = [
  {
    id: 'common.error.empty_catch',
    description: 'Legacy-equivalent finding for empty catch blocks without error handling.',
    severity: 'CRITICAL',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'common.error.empty_catch',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'Empty catch block detected - always handle errors (log, rethrow, wrap, or return Result).',
      code: 'COMMON_ERROR_EMPTY_CATCH',
    },
  },
  {
    id: 'common.types.record_unknown_requires_type',
    description:
      'Detects Record<string, unknown> definitions that should define explicit value unions.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'common.types.record_unknown_requires_type',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'Record<string, unknown> detected - define value type union (string | number | boolean | null | Date).',
      code: 'COMMON_TYPES_RECORD_UNKNOWN_REQUIRES_TYPE',
    },
  },
  {
    id: 'common.types.unknown_without_guard',
    description: 'Detects unknown assertions without explicit narrowing/guarding.',
    severity: 'WARN',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'common.types.unknown_without_guard',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'Type assertion to unknown without type guard - add proper type narrowing (typeof/instanceof/custom guard).',
      code: 'COMMON_TYPES_UNKNOWN_WITHOUT_GUARD',
    },
  },
  {
    id: 'common.types.undefined_in_base_type',
    description: 'Detects undefined usage in base-type unions without boundary normalization.',
    severity: 'CRITICAL',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'common.types.undefined_in_base_type',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'undefined in base type - normalize at boundary with mapper/type guard, base type must be non-nullable.',
      code: 'COMMON_TYPES_UNDEFINED_IN_BASE_TYPE',
    },
  },
  {
    id: 'common.network.missing_error_handling',
    description: 'Detects network calls without explicit error handling.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'common.network.missing_error_handling',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'Network calls without error handling - wrap requests in try/catch or add .catch() with typed recovery.',
      code: 'COMMON_NETWORK_MISSING_ERROR_HANDLING',
    },
  },
  {
    id: 'workflow.bdd.missing_feature_files',
    description: 'Detects repositories with implementation volume but no BDD feature files.',
    severity: 'CRITICAL',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'workflow.bdd.missing_feature_files',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'Project has implementation files but no .feature files. Enforce BDD -> TDD -> Implementation flow.',
      code: 'WORKFLOW_BDD_MISSING_FEATURE_FILES',
    },
  },
  {
    id: 'workflow.bdd.insufficient_features',
    description: 'Detects low BDD feature coverage relative to implementation footprint.',
    severity: 'ERROR',
    platform: 'generic',
    locked: true,
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'workflow.bdd.insufficient_features',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'Insufficient feature files for implementation volume. Increase feature coverage before adding more code.',
      code: 'WORKFLOW_BDD_INSUFFICIENT_FEATURES',
    },
  },
];
