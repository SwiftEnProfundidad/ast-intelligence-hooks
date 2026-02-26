import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { z } from 'zod';
import { stableStringify } from '../../core/utils/stableStringify';

const operationalMemoryRecordSchema = z
  .object({
    record_id: z.string().min(1),
    signal_type: z.string().min(1),
    signal_hash: z.string().regex(/^[a-f0-9]{64}$/),
    summary: z.string().min(1),
    confidence: z.number().min(0).max(1),
    created_at: z.string().datetime({ offset: true }),
    expires_at: z.string().datetime({ offset: true }),
    signature: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();

const operationalMemoryScopeSchema = z
  .object({
    scope_id: z.string().min(1),
    scope_type: z.enum(['repository', 'module', 'stage', 'file']),
    scope_name: z.string().min(1).optional(),
  })
  .strict();

const operationalMemoryBodyCoreSchema = z
  .object({
    generated_at: z.string().datetime({ offset: true }),
    source: z
      .object({
        producer: z.literal('pumuki'),
        producer_version: z.string().min(1),
        mode: z.enum(['local', 'hook', 'ci']),
      })
      .strict(),
    scope: operationalMemoryScopeSchema,
    policy: z
      .object({
        ttl_days: z.number().int().positive(),
        min_confidence: z.number().min(0).max(1),
      })
      .strict(),
    records: z.array(operationalMemoryRecordSchema),
  })
  .strict();

const operationalMemoryBodySchema = operationalMemoryBodyCoreSchema
  .extend({
    version: z.literal('1'),
  })
  .strict();

const operationalMemoryBodyCompatSchema = operationalMemoryBodyCoreSchema
  .extend({
    version: z.enum(['1', '1.0']),
  })
  .strict();

const operationalMemoryIntegritySchema = z
  .object({
    algorithm: z.literal('sha256'),
    payload_hash: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();

const operationalMemorySchema = operationalMemoryBodySchema
  .extend({
    integrity: operationalMemoryIntegritySchema,
  })
  .strict();

const operationalMemoryCompatSchema = operationalMemoryBodyCompatSchema
  .extend({
    integrity: operationalMemoryIntegritySchema,
  })
  .strict();

export type OperationalMemorySourceMode = 'local' | 'hook' | 'ci';
export type OperationalMemoryContractSupportedVersion = '1' | '1.0';
export type OperationalMemoryContractBodyV1 = z.infer<typeof operationalMemoryBodySchema>;
export type OperationalMemoryContractBodyCompat = z.infer<typeof operationalMemoryBodyCompatSchema>;
export type OperationalMemoryContractV1 = z.infer<typeof operationalMemorySchema>;
export type OperationalMemoryRecordV1 = OperationalMemoryContractBodyV1['records'][number];

export const OPERATIONAL_MEMORY_CONTRACT_CANONICAL_VERSION: OperationalMemoryContractSupportedVersion = '1';
export const OPERATIONAL_MEMORY_CONTRACT_SUPPORTED_VERSIONS: ReadonlyArray<OperationalMemoryContractSupportedVersion> =
  ['1', '1.0'];

export type OperationalMemoryContractParseResult =
  | {
      kind: 'valid';
      contract: OperationalMemoryContractV1;
      integrity: {
        valid: true;
        source_version: OperationalMemoryContractSupportedVersion;
      };
    }
  | {
      kind: 'invalid';
      reason: string;
      version?: string;
    };

export type OperationalMemoryContractReadResult =
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
      contract: OperationalMemoryContractV1;
      integrity: {
        valid: true;
        source_version: OperationalMemoryContractSupportedVersion;
      };
    };

export type WriteOperationalMemoryContractResult = {
  path: string;
  bytes: number;
};

export type CreateOperationalMemoryRecordParams = {
  recordId: string;
  signalType: string;
  signalHash: string;
  summary: string;
  confidence: number;
  createdAt: string;
  expiresAt: string;
  signature: string;
};

export type OperationalMemorySignalFingerprintParams = {
  signalType: string;
  signalHash: string;
};

export type CreateOperationalMemoryContractParams = {
  producerVersion: string;
  scopeId: string;
  scopeType: OperationalMemoryContractBodyV1['scope']['scope_type'];
  scopeName?: string;
  ttlDays: number;
  minConfidence: number;
  records: ReadonlyArray<CreateOperationalMemoryRecordParams>;
  sourceMode?: OperationalMemorySourceMode;
  generatedAt?: string;
};

const DEFAULT_OPERATIONAL_MEMORY_CONTRACT_PATH = '.pumuki/artifacts/operational-memory-v1.json';

const extractVersionCandidate = (value: unknown): string | undefined => {
  if (typeof value !== 'object' || value === null || !('version' in value)) {
    return undefined;
  }
  const candidate = (value as { version?: unknown }).version;
  return typeof candidate === 'string' ? candidate : undefined;
};

export const resolveOperationalMemoryContractPath = (repoRoot: string): string => {
  const configured = process.env.PUMUKI_OPERATIONAL_MEMORY_CONTRACT_PATH?.trim();
  const candidate =
    configured && configured.length > 0
      ? configured
      : DEFAULT_OPERATIONAL_MEMORY_CONTRACT_PATH;
  if (isAbsolute(candidate)) {
    return candidate;
  }
  return resolve(repoRoot, candidate);
};

const normalizeBodyForIntegrity = (
  body: OperationalMemoryContractBodyV1 | OperationalMemoryContractBodyCompat
): unknown => {
  const orderedRecords = body.records
    .slice()
    .sort((a, b) => a.record_id.localeCompare(b.record_id))
    .map((record) => ({
      record_id: record.record_id,
      signal_type: record.signal_type,
      signal_hash: record.signal_hash,
      summary: record.summary,
      confidence: record.confidence,
      created_at: record.created_at,
      expires_at: record.expires_at,
      signature: record.signature,
    }));

  return {
    version: body.version,
    generated_at: body.generated_at,
    source: {
      producer: body.source.producer,
      producer_version: body.source.producer_version,
      mode: body.source.mode,
    },
    scope: {
      scope_id: body.scope.scope_id,
      scope_type: body.scope.scope_type,
      scope_name: body.scope.scope_name ?? null,
    },
    policy: {
      ttl_days: body.policy.ttl_days,
      min_confidence: body.policy.min_confidence,
    },
    records: orderedRecords,
  };
};

export const createOperationalMemoryContractHash = (
  body: OperationalMemoryContractBodyV1 | OperationalMemoryContractBodyCompat
): string => {
  const normalized = normalizeBodyForIntegrity(body);
  return createHash('sha256').update(stableStringify(normalized)).digest('hex');
};

export const createOperationalMemorySignalFingerprint = (
  params: OperationalMemorySignalFingerprintParams
): string => {
  const normalized = {
    signal_type: params.signalType.trim(),
    signal_hash: params.signalHash.trim().toLowerCase(),
  };
  return createHash('sha256').update(stableStringify(normalized)).digest('hex');
};

const compareRecords = (
  current: OperationalMemoryRecordV1,
  incoming: OperationalMemoryRecordV1
): OperationalMemoryRecordV1 => {
  if (incoming.confidence > current.confidence) {
    return incoming;
  }
  if (incoming.confidence < current.confidence) {
    return current;
  }

  const currentCreatedAt = new Date(current.created_at).getTime();
  const incomingCreatedAt = new Date(incoming.created_at).getTime();
  if (incomingCreatedAt > currentCreatedAt) {
    return incoming;
  }
  if (incomingCreatedAt < currentCreatedAt) {
    return current;
  }

  return incoming.record_id.localeCompare(current.record_id) < 0 ? incoming : current;
};

export const dedupeOperationalMemoryRecords = (
  records: ReadonlyArray<OperationalMemoryRecordV1>
): ReadonlyArray<OperationalMemoryRecordV1> => {
  const byFingerprint = new Map<string, OperationalMemoryRecordV1>();
  for (const record of records) {
    const validated = operationalMemoryRecordSchema.parse(record);
    const fingerprint = createOperationalMemorySignalFingerprint({
      signalType: validated.signal_type,
      signalHash: validated.signal_hash,
    });
    const existing = byFingerprint.get(fingerprint);
    if (!existing) {
      byFingerprint.set(fingerprint, validated);
      continue;
    }
    byFingerprint.set(fingerprint, compareRecords(existing, validated));
  }
  return Array.from(byFingerprint.values()).sort((a, b) => a.record_id.localeCompare(b.record_id));
};

const parseValidationError = (error: z.ZodError): string =>
  error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`).join('; ');

export const parseOperationalMemoryContract = (
  value: unknown
): OperationalMemoryContractParseResult => {
  const validation = operationalMemoryCompatSchema.safeParse(value);
  if (!validation.success) {
    return {
      kind: 'invalid',
      reason: parseValidationError(validation.error),
      version: extractVersionCandidate(value),
    };
  }

  const sourceVersion = validation.data.version;
  const expectedHash = createOperationalMemoryContractHash(validation.data);
  if (validation.data.integrity.payload_hash !== expectedHash) {
    return {
      kind: 'invalid',
      reason: 'integrity_hash_mismatch',
      version: sourceVersion,
    };
  }

  const { integrity: _integrity, ...validatedBody } = validation.data;
  const canonicalBody = operationalMemoryBodySchema.parse({
    ...validatedBody,
    version: OPERATIONAL_MEMORY_CONTRACT_CANONICAL_VERSION,
  });
  const canonicalContract = operationalMemorySchema.parse({
    ...canonicalBody,
    integrity: {
      algorithm: 'sha256',
      payload_hash: expectedHash,
    },
  });

  return {
    kind: 'valid',
    contract: canonicalContract,
    integrity: {
      valid: true,
      source_version: sourceVersion,
    },
  };
};

export const createOperationalMemoryContract = (
  params: CreateOperationalMemoryContractParams
): OperationalMemoryContractV1 => {
  const normalizedRecords = dedupeOperationalMemoryRecords(
    params.records.map((record) => ({
      record_id: record.recordId,
      signal_type: record.signalType,
      signal_hash: record.signalHash,
      summary: record.summary,
      confidence: record.confidence,
      created_at: record.createdAt,
      expires_at: record.expiresAt,
      signature: record.signature,
    }))
  );

  const body = operationalMemoryBodySchema.parse({
    version: OPERATIONAL_MEMORY_CONTRACT_CANONICAL_VERSION,
    generated_at: params.generatedAt ?? new Date().toISOString(),
    source: {
      producer: 'pumuki',
      producer_version: params.producerVersion,
      mode: params.sourceMode ?? 'local',
    },
    scope: {
      scope_id: params.scopeId,
      scope_type: params.scopeType,
      scope_name: params.scopeName,
    },
    policy: {
      ttl_days: params.ttlDays,
      min_confidence: params.minConfidence,
    },
    records: normalizedRecords,
  });

  return operationalMemorySchema.parse({
    ...body,
    integrity: {
      algorithm: 'sha256',
      payload_hash: createOperationalMemoryContractHash(body),
    },
  });
};

export const readOperationalMemoryContract = (
  repoRoot: string
): OperationalMemoryContractReadResult => {
  const path = resolveOperationalMemoryContractPath(repoRoot);
  if (!existsSync(path)) {
    return {
      kind: 'missing',
      path,
    };
  }

  let parsedValue: unknown;
  try {
    const raw = readFileSync(path, 'utf8');
    parsedValue = JSON.parse(raw) as unknown;
  } catch (error) {
    return {
      kind: 'invalid',
      path,
      reason: error instanceof Error ? error.message : 'invalid_json',
    };
  }

  const validation = parseOperationalMemoryContract(parsedValue);
  if (validation.kind === 'invalid') {
    return {
      kind: 'invalid',
      path,
      reason: validation.reason,
      version: validation.version,
    };
  }

  return {
    kind: 'valid',
    path,
    contract: validation.contract,
    integrity: validation.integrity,
  };
};

export const writeOperationalMemoryContract = (
  repoRoot: string,
  contract: OperationalMemoryContractV1
): WriteOperationalMemoryContractResult => {
  const path = resolveOperationalMemoryContractPath(repoRoot);
  const validated = operationalMemorySchema.parse(contract);
  const content = `${JSON.stringify(validated, null, 2)}\n`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf8');
  return {
    path,
    bytes: Buffer.byteLength(content, 'utf8'),
  };
};
