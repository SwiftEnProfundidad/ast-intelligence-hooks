import type { RuleSet } from '../RuleSet';

export const backendRuleSet: RuleSet = [
  {
    id: 'backend.no-console-log',
    description: 'Disallows console.log usage in backend code.',
    severity: 'CRITICAL',
    platform: 'backend',
    locked: true,
    scope: {
      include: ['apps/backend/'],
    },
    when: {
      kind: 'FileContent',
      contains: ['console.log('],
    },
    then: {
      kind: 'Finding',
      message: 'console.log is not allowed in backend production code.',
      code: 'BACKEND_NO_CONSOLE_LOG',
    },
  },
  {
    id: 'backend.no-empty-catch',
    description: 'Disallows empty catch blocks in backend code.',
    severity: 'CRITICAL',
    platform: 'backend',
    locked: true,
    scope: {
      include: ['apps/backend/'],
    },
    when: {
      kind: 'FileContent',
      regex: ['catch\\s*\\([^)]*\\)\\s*\\{\\s*\\}'],
    },
    then: {
      kind: 'Finding',
      message: 'Empty catch blocks are not allowed in backend code.',
      code: 'BACKEND_NO_EMPTY_CATCH',
    },
  },
  {
    id: 'backend.avoid-explicit-any',
    description: 'Warns when explicit any is used in backend code.',
    severity: 'WARN',
    platform: 'backend',
    locked: true,
    scope: {
      include: ['apps/backend/'],
    },
    when: {
      kind: 'FileContent',
      regex: [':\\s*any\\b'],
    },
    then: {
      kind: 'Finding',
      message: 'Avoid explicit any in backend code.',
      code: 'BACKEND_AVOID_EXPLICIT_ANY',
    },
  },
];
