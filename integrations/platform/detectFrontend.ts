import type { Fact } from '../../core/facts/Fact';
import type { PlatformState } from '../evidence/schema';

const isFrontendPath = (path: string): boolean => {
  const normalized = path.toLowerCase().replace(/\\/g, '/');
  const isReactExtension = normalized.endsWith('.tsx') || normalized.endsWith('.jsx');
  if (isReactExtension) {
    return true;
  }

  const isTypeScriptOrJavaScript =
    normalized.endsWith('.ts') ||
    normalized.endsWith('.js') ||
    normalized.endsWith('.mts') ||
    normalized.endsWith('.cts') ||
    normalized.endsWith('.mjs') ||
    normalized.endsWith('.cjs');

  if (!isTypeScriptOrJavaScript) {
    return false;
  }

  if (normalized.startsWith('apps/frontend/') || normalized.startsWith('apps/web/')) {
    return true;
  }

  return /(^|\/)(frontend|web|client)(\/|$)/.test(normalized);
};

export const detectFrontendFromFacts = (
  facts: ReadonlyArray<Fact>
): PlatformState => {
  const detected = facts.some((fact) => {
    if (fact.kind !== 'FileChange' && fact.kind !== 'FileContent') {
      return false;
    }
    return isFrontendPath(fact.path);
  });

  return {
    detected,
    confidence: detected ? 'HIGH' : 'LOW',
  };
};
