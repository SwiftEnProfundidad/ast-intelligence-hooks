import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import {
  toFindingsByPlatform,
  toFindingsFilesCount,
  toFindingsRulesCount,
  toFindingsWithLinesCount,
} from '../evidenceFacetsFindings';

const sampleFindings: AiEvidenceV2_1['snapshot']['findings'] = [
  {
    ruleId: 'ios.no-anyview',
    severity: 'WARN',
    code: 'NO_ANYVIEW',
    message: 'AnyView usage is not allowed.',
    file: 'apps/ios/App/Feature.swift',
    lines: [12],
  },
  {
    ruleId: 'ios.no-force-unwrap',
    severity: 'ERROR',
    code: 'NO_FORCE_UNWRAP',
    message: 'Force unwrap is not allowed.',
    file: 'apps/ios/App/Dashboard.SWIFT',
    lines: '45',
  },
  {
    ruleId: 'backend.avoid-explicit-any',
    severity: 'WARN',
    code: 'AVOID_ANY',
    message: 'Avoid explicit any.',
    file: 'apps/backend/src/domain/ReservationPolicy.ts',
    lines: [],
  },
  {
    ruleId: 'backend.no-empty-catch',
    severity: 'ERROR',
    code: 'NO_EMPTY_CATCH',
    message: 'Empty catch blocks are not allowed.',
    file: 'apps/backend/src/application/ReservationCoordinator.ts',
    lines: [30, 31],
  },
  {
    ruleId: 'frontend.no-console-log',
    severity: 'WARN',
    code: 'NO_CONSOLE_LOG',
    message: 'console.log is not allowed.',
    file: 'apps/frontend/src/components/Banner.tsx',
  },
  {
    ruleId: 'android.no-thread-sleep',
    severity: 'ERROR',
    code: 'NO_THREAD_SLEEP',
    message: 'Thread.sleep is not allowed.',
    file: 'apps/android/app/src/main/java/com/example/Main.kt',
  },
  {
    ruleId: 'android.no-global-scope',
    severity: 'ERROR',
    code: 'NO_GLOBAL_SCOPE',
    message: 'GlobalScope is not allowed.',
    file: 'apps/android/app/build.gradle.kts',
  },
  {
    ruleId: 'generic.no-debugger',
    severity: 'WARN',
    code: 'NO_DEBUGGER',
    message: 'debugger statement is not allowed.',
    file: 'src/shared/debug.ts',
  },
  {
    ruleId: 'ios.no-anyview',
    severity: 'WARN',
    code: 'NO_ANYVIEW',
    message: 'AnyView usage is not allowed.',
    file: 'apps/ios/App/Feature.swift',
  },
];

test('findings counters compute unique files and rules', () => {
  assert.equal(toFindingsFilesCount(sampleFindings), 8);
  assert.equal(toFindingsRulesCount(sampleFindings), 8);
});

test('toFindingsWithLinesCount counts only findings with non-empty array lines', () => {
  assert.equal(toFindingsWithLinesCount(sampleFindings), 2);
});

test('toFindingsByPlatform aggregates findings by inferred platform in deterministic order', () => {
  assert.deepEqual(toFindingsByPlatform(sampleFindings), {
    android: 2,
    backend: 2,
    frontend: 1,
    generic: 1,
    ios: 3,
  });
});
