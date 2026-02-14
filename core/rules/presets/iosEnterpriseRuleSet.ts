import type { RuleSet } from '../RuleSet';

export const iosEnterpriseRuleSet: RuleSet = [
  {
    id: 'ios.tdd.domain-changes-require-tests',
    description: 'Requires tests when domain code changes.',
    severity: 'CRITICAL',
    platform: 'ios',
    stage: 'PRE_COMMIT',
    locked: true,
    scope: {
      include: ['**/*.swift'],
      exclude: ['**/*Tests*/**', '**/*UITests*/**'],
    },
    when: {
      kind: 'All',
      conditions: [
        {
          kind: 'FileChange',
          where: {
            pathPrefix: 'Domain/',
          },
        },
        {
          kind: 'Not',
          condition: {
            kind: 'FileChange',
            where: {
              pathPrefix: 'Tests/Domain/',
            },
          },
        },
      ],
    },
    then: {
      kind: 'Finding',
      message: 'Domain changes require corresponding test updates.',
      code: 'IOS_TDD_DOMAIN_TESTS',
    },
  },
  {
    id: 'ios.no-gcd',
    description: 'Disallows GCD and OperationQueue usage in iOS code.',
    severity: 'CRITICAL',
    platform: 'ios',
    stage: 'PRE_COMMIT',
    locked: true,
    scope: {
      include: ['**/*.swift'],
      exclude: ['**/*Tests*/**', '**/Legacy/**', '**/Bridges/**'],
    },
    when: {
      kind: 'FileContent',
      contains: ['DispatchQueue.', 'DispatchGroup', 'DispatchSemaphore', 'OperationQueue'],
    },
    then: {
      kind: 'Finding',
      message: 'GCD and OperationQueue usage is not allowed in iOS code.',
      code: 'IOS_NO_GCD',
    },
  },
  {
    id: 'ios.no-anyview',
    description: 'Disallows AnyView usage in iOS code.',
    severity: 'CRITICAL',
    platform: 'ios',
    stage: 'PRE_COMMIT',
    locked: true,
    scope: {
      include: ['**/*.swift'],
    },
    when: {
      kind: 'FileContent',
      contains: ['AnyView'],
    },
    then: {
      kind: 'Finding',
      message: 'AnyView usage is not allowed in iOS code.',
      code: 'IOS_NO_ANYVIEW',
    },
  },
  {
    id: 'ios.no-print',
    description: 'Disallows print() usage in iOS code.',
    severity: 'ERROR',
    platform: 'ios',
    stage: 'PRE_PUSH',
    locked: true,
    scope: {
      include: ['**/*.swift'],
    },
    when: {
      kind: 'FileContent',
      contains: ['print('],
    },
    then: {
      kind: 'Finding',
      message: 'print() usage is not allowed in iOS code.',
      code: 'IOS_NO_PRINT',
    },
  },
  {
    id: 'ios.no-jsonserialization',
    description: 'Disallows JSONSerialization usage in iOS code.',
    severity: 'CRITICAL',
    platform: 'ios',
    stage: 'PRE_COMMIT',
    locked: true,
    scope: {
      include: ['**/*.swift'],
    },
    when: {
      kind: 'FileContent',
      contains: ['JSONSerialization'],
    },
    then: {
      kind: 'Finding',
      message: 'JSONSerialization usage is not allowed in iOS code.',
      code: 'IOS_NO_JSONSERIALIZATION',
    },
  },
  {
    id: 'ios.no-alamofire',
    description: 'Disallows Alamofire usage in iOS code.',
    severity: 'CRITICAL',
    platform: 'ios',
    stage: 'PRE_COMMIT',
    locked: true,
    scope: {
      include: ['**/*.swift'],
    },
    when: {
      kind: 'FileContent',
      contains: ['Alamofire'],
    },
    then: {
      kind: 'Finding',
      message: 'Alamofire usage is not allowed in iOS code.',
      code: 'IOS_NO_ALAMOFIRE',
    },
  },
  {
    id: 'ios.no-force-unwrap',
    description: 'Disallows force unwraps in iOS code.',
    severity: 'CRITICAL',
    platform: 'ios',
    stage: 'PRE_COMMIT',
    locked: true,
    scope: {
      include: ['**/*.swift'],
    },
    when: {
      kind: 'All',
      conditions: [
        {
          kind: 'FileContent',
          contains: ['!'],
        },
        {
          kind: 'Not',
          condition: {
            kind: 'FileContent',
            contains: ['IBOutlet'],
          },
        },
      ],
    },
    then: {
      kind: 'Finding',
      message: 'Force unwraps are not allowed in iOS code.',
      code: 'IOS_NO_FORCE_UNWRAP',
    },
  },
  {
    id: 'ios.no-completion-handlers-outside-bridges',
    description: 'Disallows completion handlers outside bridges and tests.',
    severity: 'CRITICAL',
    platform: 'ios',
    stage: 'PRE_COMMIT',
    locked: true,
    scope: {
      include: ['**/*.swift'],
      exclude: ['**/Bridges/**', '**/*Tests*/**'],
    },
    when: {
      kind: 'Any',
      conditions: [
        {
          kind: 'FileContent',
          contains: ['@escaping'],
        },
        {
          kind: 'FileContent',
          contains: ['completion:'],
        },
      ],
    },
    then: {
      kind: 'Finding',
      message: 'Completion handlers are not allowed outside bridges and tests.',
      code: 'IOS_NO_COMPLETION_HANDLERS',
    },
  },
];
