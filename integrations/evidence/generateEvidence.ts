import { join } from 'node:path';
import { buildEvidence, type BuildEvidenceParams } from './buildEvidence';
import type { AiEvidenceV2_1 } from './schema';
import { writeEvidence, type WriteEvidenceResult } from './writeEvidence';

const EVIDENCE_FILE_BASENAME = '.ai_evidence.json';

export type GenerateEvidenceResult = {
  evidence: AiEvidenceV2_1;
  write: WriteEvidenceResult;
};

export type GenerateEvidenceParams = BuildEvidenceParams & {
  repoRoot?: string;
  skipDiskWrite?: boolean;
};

export const generateEvidence = (params: GenerateEvidenceParams): GenerateEvidenceResult => {
  const { repoRoot, skipDiskWrite, ...buildParams } = params;
  const evidence = buildEvidence(buildParams);
  if (skipDiskWrite === true) {
    if (typeof repoRoot !== 'string' || repoRoot.length === 0) {
      throw new Error('generateEvidence: repoRoot is required when skipDiskWrite is true');
    }
    return {
      evidence,
      write: {
        ok: true,
        path: join(repoRoot, EVIDENCE_FILE_BASENAME),
        skipped: true,
      },
    };
  }
  const write = writeEvidence(evidence, { repoRoot });
  return { evidence, write };
};
