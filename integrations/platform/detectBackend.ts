import type { Fact } from '../../core/facts/Fact';
import type { PlatformState } from '../evidence/schema';

const isBackendTypeScriptPath = (path: string): boolean => {
  const normalized = path.toLowerCase().replace(/\\/g, '/');
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

  if (normalized.startsWith('apps/backend/')) {
    return true;
  }

  return /(^|\/)(backend|server|api)(\/|$)/.test(normalized);
};

export const detectBackendFromFacts = (
  facts: ReadonlyArray<Fact>
): PlatformState => {
  const detected = facts.some((fact) => {
    if (fact.kind !== 'FileChange' && fact.kind !== 'FileContent') {
      return false;
    }
    return isBackendTypeScriptPath(fact.path);
  });

  return {
    detected,
    confidence: detected ? 'HIGH' : 'LOW',
  };
};
