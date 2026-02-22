import assert from 'node:assert/strict';
import test from 'node:test';
import type { Fact } from '../../../core/facts/Fact';
import { detectPlatformsFromFacts } from '../detectPlatforms';

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
  filePath: 'apps/backend/src/a.ts',
  source: 'test',
});

const dependency = (): Fact => ({
  kind: 'Dependency',
  from: 'a',
  to: 'b',
  source: 'test',
});

test('detectPlatformsFromFacts retorna vacío cuando no hay facts de archivo', () => {
  const detected = detectPlatformsFromFacts([heuristic(), dependency()]);
  assert.deepEqual(detected, {});
});

test('detectPlatformsFromFacts detecta iOS por extensión .swift', () => {
  const detected = detectPlatformsFromFacts([
    fileContent('docs/specs/Feature.swift', 'struct FeatureView: View {}'),
  ]);

  assert.deepEqual(detected, {
    ios: {
      detected: true,
      confidence: 'HIGH',
    },
  });
});

test('detectPlatformsFromFacts detecta backend/frontend/android por rutas soportadas', () => {
  const detected = detectPlatformsFromFacts([
    fileChange('apps/backend/src/service.ts'),
    fileChange('apps/web/src/components/Banner.tsx'),
    fileChange('apps/android/app/src/main/java/com/example/Main.kt'),
  ]);

  assert.deepEqual(detected, {
    backend: {
      detected: true,
      confidence: 'HIGH',
    },
    frontend: {
      detected: true,
      confidence: 'HIGH',
    },
    android: {
      detected: true,
      confidence: 'HIGH',
    },
  });
});

test('detectPlatformsFromFacts detecta plataformas en estructuras genéricas sin apps/*', () => {
  const detected = detectPlatformsFromFacts([
    fileChange('src/server/health.ts'),
    fileChange('packages/ui/src/App.tsx'),
    fileChange('mobile/android/src/main/kotlin/com/example/Main.kt'),
  ]);

  assert.deepEqual(detected, {
    backend: {
      detected: true,
      confidence: 'HIGH',
    },
    frontend: {
      detected: true,
      confidence: 'HIGH',
    },
    android: {
      detected: true,
      confidence: 'HIGH',
    },
  });
});

test('detectPlatformsFromFacts aplica fallback ambigüo para repos TS/JS sin señales claras', () => {
  const detected = detectPlatformsFromFacts([
    fileChange('src/main.ts'),
  ]);

  assert.deepEqual(detected, {
    backend: {
      detected: true,
      confidence: 'MEDIUM',
    },
    frontend: {
      detected: true,
      confidence: 'MEDIUM',
    },
  });
});

test('detectPlatformsFromFacts no marca plataformas cuando las extensiones no aplican', () => {
  const detected = detectPlatformsFromFacts([
    fileChange('apps/backend/src/service.json'),
    fileChange('apps/android/app/src/main/java/com/example/Main.java'),
    fileChange('apps/web/src/styles/main.css'),
  ]);

  assert.deepEqual(detected, {});
});

test('detectPlatformsFromFacts permite combinación completa y prioriza presencia detectada', () => {
  const detected = detectPlatformsFromFacts([
    fileChange('apps/ios/App/Feature.swift'),
    fileChange('apps/backend/src/health.ts'),
    fileContent('apps/frontend/src/App.jsx', 'export const App = () => null'),
    fileContent('apps/android/app/build.gradle.kts', 'plugins {}'),
    heuristic(),
  ]);

  assert.deepEqual(detected, {
    ios: {
      detected: true,
      confidence: 'HIGH',
    },
    backend: {
      detected: true,
      confidence: 'HIGH',
    },
    frontend: {
      detected: true,
      confidence: 'HIGH',
    },
    android: {
      detected: true,
      confidence: 'HIGH',
    },
  });
});
