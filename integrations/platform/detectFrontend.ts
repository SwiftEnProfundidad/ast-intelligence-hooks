import type { Fact } from '../../core/facts/Fact';
import type { PlatformState } from '../evidence/schema';

const isFrontendPath = (path: string): boolean => {
  const inFrontendApp = path.startsWith('apps/frontend/');
  const inWebApp = path.startsWith('apps/web/');
  const isFrontendExtension =
    path.endsWith('.ts') ||
    path.endsWith('.tsx') ||
    path.endsWith('.js') ||
    path.endsWith('.jsx');
  return (inFrontendApp || inWebApp) && isFrontendExtension;
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
