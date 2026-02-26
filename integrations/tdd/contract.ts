import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { z } from 'zod';
import { stableStringify } from '../../core/utils/stableStringify';

const tddEventSchema = z.object({
  status: z.enum(['passed', 'failed']),
  timestamp: z.string().datetime({ offset: true }).optional(),
  run_id: z.string().min(1).optional(),
  test_ref: z.string().min(1).optional(),
});

const tddSliceSchema = z.object({
  id: z.string().min(1),
  scenario_ref: z.string().min(1),
  red: tddEventSchema,
  green: tddEventSchema,
  refactor: tddEventSchema,
});

const tddIntegritySchema = z.object({
  algorithm: z.literal('sha256'),
  payload_hash: z.string().min(1),
});

const tddBddEvidenceSchema = z.object({
  version: z.literal('1'),
  generated_at: z.string().datetime({ offset: true }),
  slices: z.array(tddSliceSchema),
  metadata: z
    .object({
      stack: z.string().min(1).optional(),
      source: z.string().min(1).optional(),
    })
    .optional(),
  integrity: tddIntegritySchema.optional(),
});

export type TddEvent = z.infer<typeof tddEventSchema>;
export type TddSlice = z.infer<typeof tddSliceSchema>;
export type TddBddEvidenceV1 = z.infer<typeof tddBddEvidenceSchema>;

export type TddBddEvidenceReadResult =
  | {
      kind: 'missing';
      path: string;
    }
  | {
      kind: 'invalid';
      path: string;
      reason: string;
      version?: string;
    }
  | {
      kind: 'valid';
      path: string;
      evidence: TddBddEvidenceV1;
      integrity: {
        present: boolean;
        valid: boolean;
      };
    };

const DEFAULT_EVIDENCE_PATH = '.pumuki/artifacts/pumuki-evidence-v1.json';

export const resolveTddBddEvidencePath = (repoRoot: string): string => {
  const candidate = process.env.PUMUKI_TDD_BDD_EVIDENCE_PATH?.trim();
  if (!candidate) {
    return resolve(repoRoot, DEFAULT_EVIDENCE_PATH);
  }
  if (isAbsolute(candidate)) {
    return candidate;
  }
  return resolve(repoRoot, candidate);
};

const stablePayloadForIntegrity = (evidence: TddBddEvidenceV1): string => {
  return stableStringify({
    version: evidence.version,
    generated_at: evidence.generated_at,
    slices: evidence.slices,
    metadata: evidence.metadata ?? null,
  });
};

const computeIntegrityHash = (evidence: TddBddEvidenceV1): string => {
  return createHash('sha256').update(stablePayloadForIntegrity(evidence), 'utf8').digest('hex');
};

const resolveIntegrityState = (
  evidence: TddBddEvidenceV1
): {
  present: boolean;
  valid: boolean;
} => {
  if (!evidence.integrity) {
    return {
      present: false,
      valid: true,
    };
  }
  const computed = computeIntegrityHash(evidence);
  return {
    present: true,
    valid: computed === evidence.integrity.payload_hash,
  };
};

const extractVersionCandidate = (parsed: unknown): string | undefined => {
  if (typeof parsed !== 'object' || parsed === null || !('version' in parsed)) {
    return undefined;
  }
  const candidate = (parsed as { version?: unknown }).version;
  return typeof candidate === 'string' ? candidate : undefined;
};

export const readTddBddEvidence = (repoRoot: string): TddBddEvidenceReadResult => {
  const path = resolveTddBddEvidencePath(repoRoot);
  if (!existsSync(path)) {
    return {
      kind: 'missing',
      path,
    };
  }

  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown;
    const validation = tddBddEvidenceSchema.safeParse(parsed);
    if (!validation.success) {
      return {
        kind: 'invalid',
        path,
        reason: validation.error.issues[0]?.message ?? 'invalid_schema',
        version: extractVersionCandidate(parsed),
      };
    }
    const integrity = resolveIntegrityState(validation.data);
    if (!integrity.valid) {
      return {
        kind: 'invalid',
        path,
        reason: 'integrity_hash_mismatch',
        version: validation.data.version,
      };
    }
    return {
      kind: 'valid',
      path,
      evidence: validation.data,
      integrity,
    };
  } catch (error) {
    return {
      kind: 'invalid',
      path,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
};
