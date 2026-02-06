import type { Fact } from '../../core/facts/Fact';
import type { PlatformState } from '../evidence/schema';
import { detectBackendFromFacts } from './detectBackend';

export type DetectedPlatforms = {
  ios?: PlatformState;
  backend?: PlatformState;
  frontend?: PlatformState;
  android?: PlatformState;
};

const getFactPath = (fact: Fact): string | undefined => {
  if (fact.kind !== 'FileChange' && fact.kind !== 'FileContent') {
    return undefined;
  }
  return fact.path;
};

const detectPlatformByPath = (
  facts: ReadonlyArray<Fact>,
  matcher: (path: string) => boolean
): PlatformState | undefined => {
  const detected = facts.some((fact) => {
    const path = getFactPath(fact);
    if (!path) {
      return false;
    }
    return matcher(path);
  });

  if (!detected) {
    return undefined;
  }

  return {
    detected: true,
    confidence: 'HIGH',
  };
};

export const detectPlatformsFromFacts = (
  facts: ReadonlyArray<Fact>
): DetectedPlatforms => {
  const result: DetectedPlatforms = {};

  const ios = detectPlatformByPath(facts, (path) => path.endsWith('.swift'));
  if (ios) {
    result.ios = ios;
  }

  const backend = detectBackendFromFacts(facts);
  if (backend.detected) {
    result.backend = backend;
  }

  const frontend = detectPlatformByPath(
    facts,
    (path) =>
      path.startsWith('apps/frontend/') &&
      (path.endsWith('.ts') ||
        path.endsWith('.tsx') ||
        path.endsWith('.js') ||
        path.endsWith('.jsx'))
  );
  if (frontend) {
    result.frontend = frontend;
  }

  const android = detectPlatformByPath(
    facts,
    (path) =>
      path.startsWith('apps/android/') &&
      (path.endsWith('.kt') || path.endsWith('.kts'))
  );
  if (android) {
    result.android = android;
  }

  return result;
};
