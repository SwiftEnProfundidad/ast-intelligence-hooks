import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { AiEvidenceV2_1 } from './schema';

export type EvidenceSourceDescriptor = {
  source: 'local-file';
  path: string;
  digest: string | null;
  generated_at: string | null;
};

export type EvidenceReadResult =
  | { kind: 'missing'; source_descriptor: EvidenceSourceDescriptor }
  | { kind: 'invalid'; version?: string; source_descriptor: EvidenceSourceDescriptor }
  | { kind: 'valid'; evidence: AiEvidenceV2_1; source_descriptor: EvidenceSourceDescriptor };

const toDigest = (value: string): string =>
  `sha256:${createHash('sha256').update(value, 'utf8').digest('hex')}`;

export const readEvidenceResult = (repoRoot: string): EvidenceReadResult => {
  const evidencePath = resolve(repoRoot, '.ai_evidence.json');
  if (!existsSync(evidencePath)) {
    return {
      kind: 'missing',
      source_descriptor: {
        source: 'local-file',
        path: evidencePath,
        digest: null,
        generated_at: null,
      },
    };
  }

  let raw = '';
  try {
    raw = readFileSync(evidencePath, 'utf8');
  } catch {
    return {
      kind: 'invalid',
      source_descriptor: {
        source: 'local-file',
        path: evidencePath,
        digest: null,
        generated_at: null,
      },
    };
  }
  const sourceDescriptorBase = {
    source: 'local-file' as const,
    path: evidencePath,
    digest: toDigest(raw),
  };

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'version' in parsed &&
      (parsed as { version?: unknown }).version === '2.1'
    ) {
      const evidence = parsed as AiEvidenceV2_1;
      return {
        kind: 'valid',
        evidence,
        source_descriptor: {
          ...sourceDescriptorBase,
          generated_at: evidence.timestamp,
        },
      };
    }
    const versionCandidate =
      typeof parsed === 'object' && parsed !== null && 'version' in parsed
        ? (parsed as { version?: unknown }).version
        : undefined;
    const generatedAtCandidate =
      typeof parsed === 'object' && parsed !== null && 'timestamp' in parsed
        ? (parsed as { timestamp?: unknown }).timestamp
        : undefined;
    return {
      kind: 'invalid',
      version: typeof versionCandidate === 'string' ? versionCandidate : undefined,
      source_descriptor: {
        ...sourceDescriptorBase,
        generated_at: typeof generatedAtCandidate === 'string' ? generatedAtCandidate : null,
      },
    };
  } catch {
    return {
      kind: 'invalid',
      source_descriptor: {
        ...sourceDescriptorBase,
        generated_at: null,
      },
    };
  }
};

export const readEvidence = (repoRoot: string): AiEvidenceV2_1 | undefined => {
  const result = readEvidenceResult(repoRoot);
  return result.kind === 'valid' ? result.evidence : undefined;
};
