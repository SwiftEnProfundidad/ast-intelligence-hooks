import type { Fact } from '../../core/facts/Fact';
import type { PlatformState } from '../evidence/schema';

const isAndroidPath = (path: string): boolean => {
  return path.endsWith('.kt') || path.endsWith('.kts');
};

export const detectAndroidFromFacts = (
  facts: ReadonlyArray<Fact>
): PlatformState => {
  const detected = facts.some((fact) => {
    if (fact.kind !== 'FileChange' && fact.kind !== 'FileContent') {
      return false;
    }
    return isAndroidPath(fact.path);
  });

  return {
    detected,
    confidence: detected ? 'HIGH' : 'LOW',
  };
};
