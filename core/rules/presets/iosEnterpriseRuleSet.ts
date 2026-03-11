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
    id: 'ios.solid.ocp.discriminator-switch-branching',
    description:
      'Blocks iOS application or presentation types that must be modified to support new discriminator cases instead of extending behavior through abstractions.',
    severity: 'CRITICAL',
    platform: 'ios',
    stage: 'PRE_COMMIT',
    locked: true,
    scope: {
      include: ['**/*.swift'],
      exclude: ['**/*Tests*/**', '**/*UITests*/**'],
    },
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.solid.ocp.discriminator-switch.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'iOS application or presentation type branches by discriminator switch and must be modified directly to support new cases.',
      code: 'IOS_SOLID_OCP_DISCRIMINATOR_SWITCH_BRANCHING',
      source: 'ios-solid-ocp',
    },
  },
  {
    id: 'ios.solid.dip.concrete-framework-dependency',
    description:
      'Blocks iOS application or presentation types that depend directly on concrete framework services instead of abstractions.',
    severity: 'CRITICAL',
    platform: 'ios',
    stage: 'PRE_COMMIT',
    locked: true,
    scope: {
      include: ['**/*.swift'],
      exclude: ['**/*Tests*/**', '**/*UITests*/**'],
    },
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.solid.dip.concrete-framework-dependency.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'iOS application or presentation type depends directly on concrete framework services instead of ports or abstractions.',
      code: 'IOS_SOLID_DIP_CONCRETE_FRAMEWORK_DEPENDENCY',
      source: 'ios-solid-dip',
    },
  },
  {
    id: 'ios.solid.isp.fat-protocol-dependency',
    description:
      'Blocks iOS application or presentation types that depend on fat protocols instead of a minimal port tailored to the members they actually use.',
    severity: 'CRITICAL',
    platform: 'ios',
    stage: 'PRE_COMMIT',
    locked: true,
    scope: {
      include: ['**/*.swift'],
      exclude: ['**/*Tests*/**', '**/*UITests*/**'],
    },
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.solid.isp.fat-protocol-dependency.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'iOS application or presentation type depends on a fat protocol and consumes only a narrow subset of that contract.',
      code: 'IOS_SOLID_ISP_FAT_PROTOCOL_DEPENDENCY',
      source: 'ios-solid-isp',
    },
  },
  {
    id: 'ios.solid.lsp.narrowed-precondition-substitution',
    description:
      'Blocks iOS application or presentation types whose subtype narrows the contract preconditions and becomes unsafe to substitute for the base protocol or abstraction.',
    severity: 'CRITICAL',
    platform: 'ios',
    stage: 'PRE_COMMIT',
    locked: true,
    scope: {
      include: ['**/*.swift'],
      exclude: ['**/*Tests*/**', '**/*UITests*/**'],
    },
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.solid.lsp.narrowed-precondition.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'iOS application or presentation subtype narrows the base contract preconditions and breaks safe substitution.',
      code: 'IOS_SOLID_LSP_NARROWED_PRECONDITION_SUBSTITUTION',
      source: 'ios-solid-lsp',
    },
  },
  {
    id: 'ios.solid.srp.presentation-mixed-responsibilities',
    description:
      'Blocks iOS presentation types that mix session, networking, persistence and navigation responsibilities in the same semantic node.',
    severity: 'CRITICAL',
    platform: 'ios',
    stage: 'PRE_COMMIT',
    locked: true,
    scope: {
      include: ['**/*.swift'],
      exclude: ['**/*Tests*/**', '**/*UITests*/**'],
    },
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.solid.srp.presentation-mixed-responsibilities.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'iOS presentation type mixes session, networking, persistence and navigation responsibilities in a single semantic node.',
      code: 'IOS_SOLID_SRP_PRESENTATION_MIXED_RESPONSIBILITIES',
      source: 'ios-solid-srp',
    },
  },
  {
    id: 'ios.canary-001.presentation-mixed-responsibilities',
    description:
      'Blocks iOS ViewModels that mix singleton, network, persistence and navigation responsibilities in the same node.',
    severity: 'CRITICAL',
    platform: 'ios',
    stage: 'PRE_COMMIT',
    locked: true,
    scope: {
      include: ['**/*.swift'],
      exclude: ['**/*Tests*/**', '**/*UITests*/**'],
    },
    when: {
      kind: 'Heuristic',
      where: {
        ruleId: 'heuristics.ios.canary-001.presentation-mixed-responsibilities.ast',
      },
    },
    then: {
      kind: 'Finding',
      message:
        'iOS ViewModel mixes singleton, networking, persistence or navigation responsibilities in a single semantic node.',
      code: 'IOS_CANARY_001_PRESENTATION_MIXED_RESPONSIBILITIES',
      source: 'ios-canary-001',
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
          kind: 'Heuristic',
          where: {
            ruleId: 'heuristics.ios.force-unwrap.ast',
          },
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
