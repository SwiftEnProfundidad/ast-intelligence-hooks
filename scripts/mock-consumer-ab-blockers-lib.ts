import {
  isBlockEvidenceOrPreGateBlockHealthy,
  isEvidenceHealthy,
} from './mock-consumer-ab-evidence-lib';
import type { MockConsumerAbMarkdownParams } from './mock-consumer-ab-markdown-contract';

export const buildMockConsumerAbBlockers = (
  params: MockConsumerAbMarkdownParams
): ReadonlyArray<string> => {
  const blockers: string[] = [];

  if (!params.blockReady) {
    blockers.push('Package smoke block mode summary is not in expected blocking state');
  }
  if (!params.minimalReady) {
    blockers.push('Package smoke minimal mode summary is not in expected pass state');
  }
  if (!isBlockEvidenceOrPreGateBlockHealthy(params.blockEvidence, params.blockReady)) {
    if (params.blockEvidence.parseError) {
      blockers.push('block evidence file is not valid JSON');
    } else {
      blockers.push('block evidence does not expose expected v2.1 BLOCK snapshot or pre-gate block summary');
    }
  }

  if (!isEvidenceHealthy(params.minimalEvidence, 'PASS')) {
    if (!params.minimalEvidence.exists) {
      blockers.push('minimal evidence file is missing');
    } else if (params.minimalEvidence.parseError) {
      blockers.push('minimal evidence file is not valid JSON');
    } else {
      blockers.push('minimal evidence does not expose expected v2.1 CI PASS snapshot');
    }
  }

  return blockers;
};
