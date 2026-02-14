import type { Fact } from '../../core/facts/Fact';
import type { PlatformState } from '../evidence/schema';

const isBackendTypeScriptPath = (path: string): boolean => {
  return path.startsWith('apps/backend/') && path.endsWith('.ts');
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
