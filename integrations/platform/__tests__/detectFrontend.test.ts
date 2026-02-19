import assert from 'node:assert/strict';
import test from 'node:test';
import type { Fact } from '../../../core/facts/Fact';
import { detectFrontendFromFacts } from '../detectFrontend';

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
  filePath: 'apps/frontend/src/Banner.tsx',
  source: 'test',
});

const dependency = (): Fact => ({
  kind: 'Dependency',
  from: 'a',
  to: 'b',
  source: 'test',
});

test('detectFrontendFromFacts detects frontend files under apps/frontend with supported extensions', () => {
  const detected = detectFrontendFromFacts([
    fileChange('apps/frontend/src/components/Banner.tsx'),
  ]);

  assert.deepEqual(detected, {
    detected: true,
    confidence: 'HIGH',
  });
});

test('detectFrontendFromFacts detects frontend files under apps/web with supported extensions', () => {
  const detected = detectFrontendFromFacts([
    fileContent('apps/web/src/main.js', 'console.log("hello")'),
  ]);

  assert.deepEqual(detected, {
    detected: true,
    confidence: 'HIGH',
  });
});

test('detectFrontendFromFacts ignores non frontend paths or unsupported extensions', () => {
  const detected = detectFrontendFromFacts([
    fileChange('apps/web/src/styles/main.css'),
    fileChange('apps/backend/src/controller.ts'),
    fileContent('apps/frontend/src/styles/theme.scss', '$color: red;'),
  ]);

  assert.deepEqual(detected, {
    detected: false,
    confidence: 'LOW',
  });
});

test('detectFrontendFromFacts ignores non-file facts', () => {
  const detected = detectFrontendFromFacts([heuristic(), dependency()]);

  assert.deepEqual(detected, {
    detected: false,
    confidence: 'LOW',
  });
});
