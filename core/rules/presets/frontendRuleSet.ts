import type { RuleSet } from '../RuleSet';

export const frontendRuleSet: RuleSet = [
  {
    id: 'frontend.no-console-log',
    description: 'Disallows console.log usage in frontend code.',
    severity: 'CRITICAL',
    platform: 'frontend',
    locked: true,
    scope: {
      include: ['apps/frontend/', 'apps/web/'],
    },
    when: {
      kind: 'FileContent',
      contains: ['console.log('],
    },
    then: {
      kind: 'Finding',
      message: 'console.log usage is not allowed in frontend code.',
      code: 'FRONTEND_NO_CONSOLE_LOG',
    },
  },
  {
    id: 'frontend.no-debugger',
    description: 'Avoids debugger statements in frontend code.',
    severity: 'WARN',
    platform: 'frontend',
    locked: true,
    scope: {
      include: ['apps/frontend/', 'apps/web/'],
    },
    when: {
      kind: 'FileContent',
      contains: ['debugger'],
    },
    then: {
      kind: 'Finding',
      message: 'debugger statements should be removed from frontend code.',
      code: 'FRONTEND_NO_DEBUGGER',
    },
  },
  {
    id: 'frontend.avoid-single-letter-variables',
    description: 'Encourages descriptive variable names in frontend code.',
    severity: 'WARN',
    platform: 'frontend',
    locked: true,
    scope: {
      include: ['apps/frontend/', 'apps/web/'],
    },
    when: {
      kind: 'FileContent',
      regex: ['\\b(?:const|let|var)\\s+[a-zA-Z]\\s*='],
    },
    then: {
      kind: 'Finding',
      message: 'Use descriptive variable names instead of single-letter names.',
      code: 'FRONTEND_DESCRIPTIVE_NAMES',
    },
  },
];
