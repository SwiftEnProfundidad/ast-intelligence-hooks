import { buildEvidence, type BuildEvidenceParams } from './buildEvidence';
import type { AiEvidenceV2_1 } from './schema';
import { writeEvidence, type WriteEvidenceResult } from './writeEvidence';

export type GenerateEvidenceResult = {
  evidence: AiEvidenceV2_1;
  write: WriteEvidenceResult;
};

export type GenerateEvidenceParams = BuildEvidenceParams & {
  repoRoot?: string;
};

export const generateEvidence = (params: GenerateEvidenceParams): GenerateEvidenceResult => {
  const { repoRoot, ...buildParams } = params;
  const evidence = buildEvidence(buildParams);
  const write = writeEvidence(evidence, { repoRoot });
  return { evidence, write };
};
