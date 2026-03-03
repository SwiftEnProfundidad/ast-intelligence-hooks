import { createHash } from 'node:crypto';
import type { AiEvidenceV2_1, EvidenceChain } from './schema';

const SHA256_DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/;

const toPayloadWithoutChain = (evidence: AiEvidenceV2_1): Omit<AiEvidenceV2_1, 'evidence_chain'> => {
  const { evidence_chain: _ignored, ...payload } = evidence;
  return payload;
};

const toPayloadString = (evidence: AiEvidenceV2_1): string => {
  return JSON.stringify(toPayloadWithoutChain(evidence));
};

const toSha256Digest = (value: string): string => {
  return `sha256:${createHash('sha256').update(value, 'utf8').digest('hex')}`;
};

export const computeEvidencePayloadHash = (evidence: AiEvidenceV2_1): string => {
  return toSha256Digest(toPayloadString(evidence));
};

const isValidDigest = (digest: unknown): digest is string => {
  return typeof digest === 'string' && SHA256_DIGEST_PATTERN.test(digest);
};

const isValidPreviousDigest = (digest: unknown): digest is string | null => {
  return digest === null || isValidDigest(digest);
};

const isValidSequence = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
};

export const isEvidenceChain = (value: unknown): value is EvidenceChain => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<EvidenceChain>;
  return (
    candidate.algorithm === 'sha256' &&
    isValidPreviousDigest(candidate.previous_payload_hash) &&
    isValidDigest(candidate.payload_hash) &&
    isValidSequence(candidate.sequence)
  );
};

export const buildEvidenceChain = (params: {
  evidence: AiEvidenceV2_1;
  previousChain?: EvidenceChain | null;
}): EvidenceChain => {
  const previousSequence = params.previousChain?.sequence ?? 0;
  return {
    algorithm: 'sha256',
    previous_payload_hash: params.previousChain?.payload_hash ?? null,
    payload_hash: computeEvidencePayloadHash(params.evidence),
    sequence: previousSequence + 1,
  };
};

export type EvidenceChainValidationResult =
  | { kind: 'valid'; chain: EvidenceChain }
  | { kind: 'invalid'; reason: 'missing' | 'malformed' | 'payload-hash-mismatch' };

export const validateEvidenceChain = (evidence: AiEvidenceV2_1): EvidenceChainValidationResult => {
  if (!evidence.evidence_chain) {
    return {
      kind: 'invalid',
      reason: 'missing',
    };
  }
  if (!isEvidenceChain(evidence.evidence_chain)) {
    return {
      kind: 'invalid',
      reason: 'malformed',
    };
  }
  const computedHash = computeEvidencePayloadHash(evidence);
  if (computedHash !== evidence.evidence_chain.payload_hash) {
    return {
      kind: 'invalid',
      reason: 'payload-hash-mismatch',
    };
  }
  return {
    kind: 'valid',
    chain: evidence.evidence_chain,
  };
};
