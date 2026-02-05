import type { RuleSet } from '../RuleSet';

export const exampleRuleSet: RuleSet = [
  {
    id: 'domain-change-without-tests',
    description: 'Flags when domain code changes without corresponding domain test changes.',
    severity: 'CRITICAL',
    when: {
      kind: 'All',
      conditions: [
        {
          kind: 'FileChange',
          where: {
            pathPrefix: 'domain/',
          },
        },
        {
          kind: 'Not',
          condition: {
            kind: 'FileChange',
            where: {
              pathPrefix: 'tests/domain/',
            },
          },
        },
      ],
    },
    then: {
      kind: 'Finding',
      message: 'Domain changed without updating tests under tests/domain/.',
      code: 'TESTS_REQUIRED',
    },
  },
];
