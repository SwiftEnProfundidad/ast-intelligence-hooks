import { buildEvidence, type BuildEvidenceParams } from './buildEvidence';
import type { AiEvidenceV2_1 } from './schema';
import { writeEvidence, type WriteEvidenceResult } from './writeEvidence';

export type GenerateEvidenceResult = {
  evidence: AiEvidenceV2_1;
  write: WriteEvidenceResult;
};

export const generateEvidence = (params: BuildEvidenceParams): GenerateEvidenceResult => {
  const evidence = buildEvidence(params);
  const write = writeEvidence(evidence);
  return { evidence, write };
};
