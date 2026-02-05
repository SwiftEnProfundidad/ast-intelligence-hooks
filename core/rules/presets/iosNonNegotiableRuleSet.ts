import type { RuleSet } from '../RuleSet';

export const iosNonNegotiableRuleSet: RuleSet = [
  {
    id: 'ios.no_anyview',
    description: 'Disallow AnyView usage in iOS code.',
    severity: 'CRITICAL',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'FileChange',
      where: {
        pathPrefix: 'ios/',
      },
    },
    then: {
      kind: 'Finding',
      message: 'AnyView usage is not allowed in iOS code.',
      code: 'IOS_NO_ANYVIEW',
    },
  },
  {
    id: 'ios.no_dispatchqueue',
    description: 'Disallow DispatchQueue usage for async in iOS code.',
    severity: 'CRITICAL',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'FileChange',
      where: {
        pathPrefix: 'ios/',
      },
    },
    then: {
      kind: 'Finding',
      message: 'DispatchQueue-based async is not allowed in iOS code.',
      code: 'IOS_NO_DISPATCHQUEUE',
    },
  },
  {
    id: 'ios.no_completion_handlers',
    description: 'Disallow new completion handlers in iOS code.',
    severity: 'CRITICAL',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'FileChange',
      where: {
        pathPrefix: 'ios/',
      },
    },
    then: {
      kind: 'Finding',
      message: 'Completion handlers are not allowed for new iOS code.',
      code: 'IOS_NO_COMPLETION_HANDLERS',
    },
  },
  {
    id: 'ios.no_print',
    description: 'Disallow print() usage in iOS code.',
    severity: 'CRITICAL',
    platform: 'ios',
    locked: true,
    when: {
      kind: 'FileChange',
      where: {
        pathPrefix: 'ios/',
      },
    },
    then: {
      kind: 'Finding',
      message: 'print() usage is not allowed in iOS code.',
      code: 'IOS_NO_PRINT',
    },
  },
];
