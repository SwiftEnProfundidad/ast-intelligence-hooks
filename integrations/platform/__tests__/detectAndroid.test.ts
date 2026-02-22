import assert from 'node:assert/strict';
import test from 'node:test';
import type { Fact } from '../../../core/facts/Fact';
import { detectAndroidFromFacts } from '../detectAndroid';

const fileChange = (
  path: string,
  changeType: 'added' | 'modified' | 'deleted' = 'modified'
): Fact => ({
  kind: 'FileChange',
  path,
  changeType,
  source: 'test',
});

const fileContent = (path: string, content = ''): Fact => ({
  kind: 'FileContent',
  path,
  content,
  source: 'test',
});

const heuristic = (): Fact => ({
  kind: 'Heuristic',
  ruleId: 'rule.test',
  severity: 'WARN',
  code: 'W001',
  message: 'heuristic fact',
  filePath: 'apps/android/app/src/main/java/com/example/Main.kt',
  source: 'test',
});

const dependency = (): Fact => ({
  kind: 'Dependency',
  from: 'a',
  to: 'b',
  source: 'test',
});

test('detectAndroidFromFacts detects Kotlin source files under apps/android', () => {
  const detected = detectAndroidFromFacts([
    fileChange('apps/android/app/src/main/java/com/example/Main.kt'),
  ]);

  assert.deepEqual(detected, {
    detected: true,
    confidence: 'HIGH',
  });
});

test('detectAndroidFromFacts detects Kotlin script files under apps/android', () => {
  const detected = detectAndroidFromFacts([
    fileContent('apps/android/app/build.gradle.kts', 'plugins {}'),
  ]);

  assert.deepEqual(detected, {
    detected: true,
    confidence: 'HIGH',
  });
});

test('detectAndroidFromFacts detects Kotlin files in generic repo structures', () => {
  const detected = detectAndroidFromFacts([
    fileChange('mobile/android/src/main/kotlin/com/example/MainActivity.kt'),
  ]);

  assert.deepEqual(detected, {
    detected: true,
    confidence: 'HIGH',
  });
});

test('detectAndroidFromFacts ignores unsupported extensions', () => {
  const detected = detectAndroidFromFacts([
    fileChange('apps/android/app/src/main/java/com/example/Main.java'),
    fileContent('apps/web/src/main.ts', 'export {}'),
  ]);

  assert.deepEqual(detected, {
    detected: false,
    confidence: 'LOW',
  });
});

test('detectAndroidFromFacts ignores non-file facts', () => {
  const detected = detectAndroidFromFacts([heuristic(), dependency()]);

  assert.deepEqual(detected, {
    detected: false,
    confidence: 'LOW',
  });
});
