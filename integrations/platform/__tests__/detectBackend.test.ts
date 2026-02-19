import assert from 'node:assert/strict';
import test from 'node:test';
import type { Fact } from '../../../core/facts/Fact';
import { detectBackendFromFacts } from '../detectBackend';

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
  filePath: 'apps/backend/src/health.ts',
  source: 'test',
});

const dependency = (): Fact => ({
  kind: 'Dependency',
  from: 'a',
  to: 'b',
  source: 'test',
});

test('detectBackendFromFacts detects TypeScript files under apps/backend', () => {
  const detected = detectBackendFromFacts([
    fileChange('apps/backend/src/health.ts'),
  ]);

  assert.deepEqual(detected, {
    detected: true,
    confidence: 'HIGH',
  });
});

test('detectBackendFromFacts detects backend TypeScript from file content facts', () => {
  const detected = detectBackendFromFacts([
    fileContent('apps/backend/src/domain/ReservationPolicy.ts', 'export class ReservationPolicy {}'),
  ]);

  assert.deepEqual(detected, {
    detected: true,
    confidence: 'HIGH',
  });
});

test('detectBackendFromFacts ignores unsupported extensions or non-backend paths', () => {
  const detected = detectBackendFromFacts([
    fileChange('apps/backend/src/health.js'),
    fileChange('apps/frontend/src/app.ts'),
    fileContent('apps/android/app/src/main/java/com/example/Main.kt', 'class Main'),
  ]);

  assert.deepEqual(detected, {
    detected: false,
    confidence: 'LOW',
  });
});

test('detectBackendFromFacts ignores non-file facts', () => {
  const detected = detectBackendFromFacts([heuristic(), dependency()]);

  assert.deepEqual(detected, {
    detected: false,
    confidence: 'LOW',
  });
});
