import type {
  ConsumerMenuCanaryPlatform,
  ConsumerMenuCanaryScenario,
  ConsumerMenuCanaryStage,
} from './framework-menu-matrix-canary-types';

const buildCanarySuffix = (): string => {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
};

export const resolveConsumerMenuCanaryScenario = (params?: {
  stage?: ConsumerMenuCanaryStage;
  platform?: ConsumerMenuCanaryPlatform;
}): ConsumerMenuCanaryScenario => {
  const stage = params?.stage ?? 'PRE_COMMIT';
  const platform = params?.platform ?? 'backend';
  const suffix = buildCanarySuffix();

  if (platform === 'frontend') {
    return {
      stage,
      platform,
      option: stage === 'PRE_COMMIT' ? '1' : '2',
      expectedRuleId: 'skills.frontend.avoid-explicit-any',
      canaryRelativePath: `apps/frontend/__pumuki_matrix_canary_frontend_${suffix}.ts`,
      canarySource: [
        'export const __pumukiMatrixCanaryFrontend = (): void => {',
        '  const risky: any = {};',
        '  void risky;',
        '};',
        '',
      ].join('\n'),
    };
  }

  if (platform === 'ios') {
    return {
      stage,
      platform,
      option: stage === 'PRE_COMMIT' ? '1' : '2',
      expectedRuleId: 'skills.ios.no-force-unwrap',
      canaryRelativePath: `apps/ios/App/__pumuki_matrix_canary_ios_${suffix}.swift`,
      canarySource: [
        'import Foundation',
        '',
        'func __pumukiMatrixCanaryIOS() {',
        '  let value: String? = "canary"',
        '  _ = value!',
        '}',
        '',
      ].join('\n'),
    };
  }

  if (platform === 'android') {
    return {
      stage,
      platform,
      option: stage === 'PRE_COMMIT' ? '1' : '2',
      expectedRuleId: 'skills.android.no-runblocking',
      canaryRelativePath: `apps/android/app/src/main/java/com/pumuki/__pumuki_matrix_canary_android_${suffix}.kt`,
      canarySource: [
        'package com.pumuki',
        '',
        'import kotlinx.coroutines.runBlocking',
        '',
        'fun pumukiMatrixCanaryAndroid() {',
        '  runBlocking {',
        '  }',
        '}',
        '',
      ].join('\n'),
    };
  }

  return {
    stage,
    platform: 'backend',
    option: stage === 'PRE_COMMIT' ? '1' : '2',
    expectedRuleId: 'skills.backend.no-empty-catch',
    canaryRelativePath: `apps/backend/src/__pumuki_matrix_canary_backend_${suffix}.ts`,
    canarySource: [
      'export const __pumukiMatrixCanaryBackend = (): void => {',
      '  try {',
      "    throw new Error('pumuki-matrix-canary')",
      '  } catch {}',
      '};',
      '',
    ].join('\n'),
  };
};
