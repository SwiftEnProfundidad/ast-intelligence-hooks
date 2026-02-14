import type { RuleSet } from '../RuleSet';

export const androidRuleSet: RuleSet = [
  {
    id: 'android.no-thread-sleep',
    description: 'Disallows Thread.sleep usage in Android code.',
    severity: 'CRITICAL',
    platform: 'android',
    locked: true,
    scope: {
      include: ['apps/android/'],
    },
    when: {
      kind: 'FileContent',
      contains: ['Thread.sleep('],
    },
    then: {
      kind: 'Finding',
      message: 'Thread.sleep is not allowed in Android code.',
      code: 'ANDROID_NO_THREAD_SLEEP',
    },
  },
  {
    id: 'android.no-global-scope',
    description: 'Avoids GlobalScope usage in Android coroutines.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    scope: {
      include: ['apps/android/'],
    },
    when: {
      kind: 'FileContent',
      contains: ['GlobalScope.'],
    },
    then: {
      kind: 'Finding',
      message: 'Use structured concurrency instead of GlobalScope.',
      code: 'ANDROID_NO_GLOBAL_SCOPE',
    },
  },
  {
    id: 'android.no-run-blocking',
    description: 'Avoids runBlocking in Android production code.',
    severity: 'WARN',
    platform: 'android',
    locked: true,
    scope: {
      include: ['apps/android/'],
      exclude: ['**/*Test*/**', '**/*Spec*/**'],
    },
    when: {
      kind: 'FileContent',
      contains: ['runBlocking('],
    },
    then: {
      kind: 'Finding',
      message: 'runBlocking should be avoided in Android production code.',
      code: 'ANDROID_NO_RUN_BLOCKING',
    },
  },
];
