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

const getFactPath = (fact: Fact) => {
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

const ALLOWED_PIN_KEYS = new Set(['ios', 'android', 'backend', 'frontend']);

const readPinnedPlatformsFromEnv = (): ReadonlySet<keyof DetectedPlatforms> | null => {
  const raw = process.env.PUMUKI_PIN_PLATFORMS?.trim().toLowerCase();
  if (!raw) {
    return null;
  }
  const tokens = raw
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
    .filter((token) => ALLOWED_PIN_KEYS.has(token)) as Array<keyof DetectedPlatforms>;
  if (tokens.length === 0) {
    return null;
  }
  return new Set(tokens);
};

const applyPinnedPlatformsFilter = (
  detected: DetectedPlatforms,
  pin: ReadonlySet<keyof DetectedPlatforms>
): DetectedPlatforms => {
  const next: DetectedPlatforms = {};
  for (const key of pin) {
    const state = detected[key];
    if (state) {
      next[key] = state;
    }
  }
  return next;
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

  const pin = readPinnedPlatformsFromEnv();
  if (pin && pin.size > 0) {
    return applyPinnedPlatformsFilter(result, pin);
  }

  return result;
};
