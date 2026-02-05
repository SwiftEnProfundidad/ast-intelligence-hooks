import type { Finding } from '../../core/gate/Finding';
import { evaluateStagedIOS } from './evaluateStagedIOS';

const formatFinding = (finding: Finding): string => {
  return `${finding.ruleId}: ${finding.message}`;
};

export async function runPreCommitIOS(): Promise<number> {
  const { outcome, findings } = evaluateStagedIOS({ stage: 'PRE_COMMIT' });
  if (outcome === 'BLOCK') {
    for (const finding of findings) {
      console.log(formatFinding(finding));
    }
    return 1;
  }
  return 0;
}
