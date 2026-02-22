import type { Fact } from '../../core/facts/Fact';
import type { PlatformState } from '../evidence/schema';
import { detectAndroidFromFacts } from './detectAndroid';
import { detectBackendFromFacts } from './detectBackend';
import { detectFrontendFromFacts } from './detectFrontend';

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

const hasExtension = (path: string, extensions: ReadonlyArray<string>): boolean => {
  const normalized = path.toLowerCase();
  return extensions.some((extension) => normalized.endsWith(extension));
};

const collectFilePaths = (facts: ReadonlyArray<Fact>): string[] => {
  return facts
    .map((fact) => getFactPath(fact))
    .filter((path): path is string => typeof path === 'string');
};

export const detectPlatformsFromFacts = (
  facts: ReadonlyArray<Fact>
): DetectedPlatforms => {
  const result: DetectedPlatforms = {};
  const filePaths = collectFilePaths(facts);

  const ios = detectPlatformByPath(facts, (path) => path.endsWith('.swift'));
  if (ios) {
    result.ios = ios;
  }

  const backend = detectBackendFromFacts(facts);
  if (backend.detected) {
    result.backend = backend;
  }

  const frontend = detectFrontendFromFacts(facts);
  if (frontend.detected) {
    result.frontend = frontend;
  }

  const android = detectAndroidFromFacts(facts);
  if (android.detected) {
    result.android = android;
  }

  const hasReactLikeSignals = filePaths.some((path) =>
    hasExtension(path, ['.tsx', '.jsx'])
  );
  const hasTypeScriptOrJavaScriptSignals = filePaths.some((path) =>
    hasExtension(path, ['.ts', '.js', '.mts', '.cts', '.mjs', '.cjs'])
  );

  if (!result.frontend && hasReactLikeSignals) {
    result.frontend = {
      detected: true,
      confidence: 'MEDIUM',
    };
  }

  if (!result.backend && !result.frontend && hasTypeScriptOrJavaScriptSignals) {
    result.backend = {
      detected: true,
      confidence: 'MEDIUM',
    };
    result.frontend = {
      detected: true,
      confidence: 'MEDIUM',
    };
  }

  return result;
};
