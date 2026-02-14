import type { SkillsCompiledRule } from './skillsLock';

export const SKILLS_LOCK_COMPILER_VERSION = '1.0.0';

export type SkillsRuleTemplate = Omit<SkillsCompiledRule, 'sourceSkill' | 'sourcePath'>;

export type SkillsCompilerTemplate = {
  name: string;
  description: string;
  rules: ReadonlyArray<SkillsRuleTemplate>;
};

export const skillsCompilerTemplates: Record<string, SkillsCompilerTemplate> = {
  'ios-guidelines': {
    name: 'ios-guidelines',
    description: 'Curated enforcement mapping for iOS skill baseline.',
    rules: [
      {
        id: 'skills.ios.no-force-unwrap',
        description: 'Disallow force unwrap in production iOS code.',
        severity: 'ERROR',
        platform: 'ios',
        confidence: 'HIGH',
        locked: true,
      },
      {
        id: 'skills.ios.no-force-try',
        description: 'Disallow force try in production iOS code.',
        severity: 'ERROR',
        platform: 'ios',
        confidence: 'HIGH',
        locked: true,
      },
      {
        id: 'skills.ios.no-anyview',
        description: 'Disallow AnyView in production iOS code.',
        severity: 'ERROR',
        platform: 'ios',
        confidence: 'HIGH',
        locked: true,
      },
      {
        id: 'skills.ios.no-callback-style-outside-bridges',
        description: 'Disallow callback-style signatures outside approved iOS bridge layers.',
        severity: 'WARN',
        platform: 'ios',
        confidence: 'MEDIUM',
        stage: 'PRE_PUSH',
        locked: true,
      },
    ],
  },
  'backend-guidelines': {
    name: 'backend-guidelines',
    description: 'Curated enforcement mapping for backend skill baseline.',
    rules: [
      {
        id: 'skills.backend.no-empty-catch',
        description: 'Disallow empty catch blocks in backend runtime code.',
        severity: 'CRITICAL',
        platform: 'backend',
        confidence: 'HIGH',
        locked: true,
      },
      {
        id: 'skills.backend.no-console-log',
        description: 'Disallow console.log in backend runtime code.',
        severity: 'ERROR',
        platform: 'backend',
        confidence: 'HIGH',
        stage: 'PRE_PUSH',
        locked: true,
      },
      {
        id: 'skills.backend.avoid-explicit-any',
        description: 'Avoid explicit any in backend runtime code.',
        severity: 'WARN',
        platform: 'backend',
        confidence: 'MEDIUM',
        stage: 'PRE_COMMIT',
        locked: true,
      },
    ],
  },
  'frontend-guidelines': {
    name: 'frontend-guidelines',
    description: 'Curated enforcement mapping for frontend skill baseline.',
    rules: [
      {
        id: 'skills.frontend.no-console-log',
        description: 'Disallow console.log in frontend production code.',
        severity: 'ERROR',
        platform: 'frontend',
        confidence: 'HIGH',
        stage: 'PRE_PUSH',
        locked: true,
      },
      {
        id: 'skills.frontend.no-empty-catch',
        description: 'Disallow empty catch blocks in frontend runtime code.',
        severity: 'ERROR',
        platform: 'frontend',
        confidence: 'HIGH',
        stage: 'PRE_PUSH',
        locked: true,
      },
      {
        id: 'skills.frontend.avoid-explicit-any',
        description: 'Avoid explicit any in frontend runtime code.',
        severity: 'WARN',
        platform: 'frontend',
        confidence: 'MEDIUM',
        stage: 'PRE_COMMIT',
        locked: true,
      },
    ],
  },
  'android-guidelines': {
    name: 'android-guidelines',
    description: 'Curated enforcement mapping for Android skill baseline.',
    rules: [
      {
        id: 'skills.android.no-thread-sleep',
        description: 'Disallow Thread.sleep in Android production code.',
        severity: 'ERROR',
        platform: 'android',
        confidence: 'HIGH',
        stage: 'PRE_PUSH',
        locked: true,
      },
      {
        id: 'skills.android.no-globalscope',
        description: 'Disallow GlobalScope in Android production code.',
        severity: 'ERROR',
        platform: 'android',
        confidence: 'HIGH',
        stage: 'PRE_PUSH',
        locked: true,
      },
      {
        id: 'skills.android.no-runblocking',
        description: 'Disallow runBlocking in Android production code.',
        severity: 'WARN',
        platform: 'android',
        confidence: 'MEDIUM',
        stage: 'PRE_COMMIT',
        locked: true,
      },
    ],
  },
};
