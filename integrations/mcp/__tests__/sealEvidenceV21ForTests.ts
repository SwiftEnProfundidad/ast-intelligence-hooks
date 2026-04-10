import type { AiEvidenceV2_1 } from '../../evidence/schema';
import { buildEvidenceChain } from '../../evidence/evidenceChain';

export const sealEvidenceV21ForTests = (evidence: AiEvidenceV2_1): AiEvidenceV2_1 => {
  evidence.evidence_chain = buildEvidenceChain({ evidence });
  return evidence;
};
