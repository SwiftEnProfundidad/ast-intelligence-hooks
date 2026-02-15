import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { AiEvidenceV2_1 } from './schema';

export type EvidenceReadResult =
  | { kind: 'missing' }
  | { kind: 'invalid'; version?: string }
  | { kind: 'valid'; evidence: AiEvidenceV2_1 };

export const readEvidenceResult = (repoRoot: string): EvidenceReadResult => {
  const evidencePath = resolve(repoRoot, '.ai_evidence.json');
  if (!existsSync(evidencePath)) {
    return { kind: 'missing' };
  }

  try {
    const parsed: unknown = JSON.parse(readFileSync(evidencePath, 'utf8'));
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'version' in parsed &&
      (parsed as { version?: unknown }).version === '2.1'
    ) {
      return {
        kind: 'valid',
        evidence: parsed as AiEvidenceV2_1,
      };
    }
    const versionCandidate =
      typeof parsed === 'object' && parsed !== null && 'version' in parsed
        ? (parsed as { version?: unknown }).version
        : undefined;
    return {
      kind: 'invalid',
      version: typeof versionCandidate === 'string' ? versionCandidate : undefined,
    };
  } catch {
    return {
      kind: 'invalid',
    };
  }
};

export const readEvidence = (repoRoot: string): AiEvidenceV2_1 | undefined => {
  const result = readEvidenceResult(repoRoot);
  return result.kind === 'valid' ? result.evidence : undefined;
};
