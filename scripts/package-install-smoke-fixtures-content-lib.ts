export const SMOKE_BASELINE_FILE = {
  path: 'apps/backend/src/baseline.ts',
  content: ["export const baseline = (): string => 'ok';", ''].join('\n'),
};

export const SMOKE_RANGE_PAYLOAD_FILES: Record<string, string> = {
  'apps/backend/src/range-smoke.ts': [
    'export const backendRangeSmoke = (): string => {',
    "  console.log('backend-range-smoke');",
    "  return 'ok';",
    '};',
    '',
  ].join('\n'),
  'apps/web/src/range-smoke.tsx': [
    'export function FrontendRangeSmoke(): string {',
    "  console.log('frontend-range-smoke');",
    "  return 'ok';",
    '}',
    '',
  ].join('\n'),
  'apps/android/app/src/main/java/com/example/RangeSmoke.kt': [
    'package com.example',
    '',
    'class RangeSmoke {',
    '  fun block(): String {',
    '    Thread.sleep(1000)',
    '    return "ok"',
    '  }',
    '}',
    '',
  ].join('\n'),
  'apps/ios/RangeSmoke.swift': [
    'import Foundation',
    '',
    'func rangeSmoke() -> String {',
    '  let value: String? = "ok"',
    '  return value!',
    '}',
    '',
  ].join('\n'),
};

export const SMOKE_STAGED_ONLY_FILE = {
  path: 'apps/backend/src/staged-smoke.ts',
  content: ['export const stagedSmoke = (): string => "ok";', ''].join('\n'),
};

export const SMOKE_STAGED_ONLY_VIOLATION_FILE = {
  path: 'apps/backend/src/staged-smoke.ts',
  content: [
    'export const stagedSmoke = (): string => {',
    "  console.log('backend-staged-smoke');",
    "  return 'ok';",
    '};',
    '',
  ].join('\n'),
};
