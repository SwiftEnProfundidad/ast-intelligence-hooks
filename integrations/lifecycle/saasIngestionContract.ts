import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { z } from 'zod';
import { stableStringify } from '../../core/utils/stableStringify';
import type { TddBddSnapshot } from '../tdd/types';
import type { LocalHotspotsReport } from './analyticsHotspots';

const enterpriseSeverityCountSchema = z
  .object({
    CRITICAL: z.number().int().nonnegative(),
    HIGH: z.number().int().nonnegative(),
    MEDIUM: z.number().int().nonnegative(),
    LOW: z.number().int().nonnegative(),
  })
  .strict();

const hotspotEntrySchema = z
  .object({
    rank: z.number().int().positive(),
    path: z.string().min(1),
    raw_score: z.number().nonnegative(),
    normalized_score: z.number().min(0).max(1),
    findings_total: z.number().int().nonnegative(),
    findings_by_enterprise_severity: enterpriseSeverityCountSchema,
    findings_distinct_rules: z.number().int().nonnegative(),
    churn_commits: z.number().int().nonnegative(),
    churn_distinct_authors: z.number().int().nonnegative(),
    churn_total_lines: z.number().int().nonnegative(),
  })
  .strict();

const tddBddComplianceSchema = z
  .object({
    status: z.enum(['skipped', 'passed', 'blocked', 'waived']),
    in_scope: z.boolean(),
    slices_total: z.number().int().nonnegative(),
    slices_valid: z.number().int().nonnegative(),
    slices_invalid: z.number().int().nonnegative(),
    waiver_applied: z.boolean(),
  })
  .strict();

const hotspotsIngestionBodyCoreSchema = z
  .object({
    generated_at: z.string().datetime({ offset: true }),
    tenant_id: z.string().min(1),
    repository: z
      .object({
        repository_id: z.string().min(1),
        name: z.string().min(1),
        default_branch: z.string().min(1).optional(),
      })
      .strict(),
    source: z
      .object({
        producer: z.literal('pumuki'),
        producer_version: z.string().min(1),
        mode: z.enum(['local', 'hook', 'ci']),
      })
      .strict(),
    hotspots: z
      .object({
        top_n: z.number().int().positive(),
        since_days: z.number().int().positive(),
        churn_signals: z.number().int().nonnegative(),
        technical_signals: z.number().int().nonnegative(),
        ranked: z.number().int().nonnegative(),
        entries: z.array(hotspotEntrySchema),
      })
      .strict(),
    compliance: z
      .object({
        tdd_bdd: tddBddComplianceSchema.optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

const hotspotsIngestionBodySchema = hotspotsIngestionBodyCoreSchema
  .extend({
    version: z.literal('1'),
  })
  .strict();

const hotspotsIngestionBodyCompatSchema = hotspotsIngestionBodyCoreSchema
  .extend({
    version: z.enum(['1', '1.0']),
  })
  .strict();

const hotspotsIngestionIntegritySchema = z
  .object({
    algorithm: z.literal('sha256'),
    payload_hash: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();

const hotspotsIngestionSchema = hotspotsIngestionBodySchema
  .extend({
    integrity: hotspotsIngestionIntegritySchema,
  })
  .strict();

const hotspotsIngestionCompatSchema = hotspotsIngestionBodyCompatSchema
  .extend({
    integrity: hotspotsIngestionIntegritySchema,
  })
  .strict();

export type HotspotsSaasIngestionSourceMode = 'local' | 'hook' | 'ci';
export type HotspotsSaasIngestionSupportedVersion = '1' | '1.0';
export type HotspotsSaasIngestionPayloadBodyV1 = z.infer<typeof hotspotsIngestionBodySchema>;
export type HotspotsSaasIngestionPayloadBodyCompat = z.infer<typeof hotspotsIngestionBodyCompatSchema>;
export type HotspotsSaasIngestionPayloadV1 = z.infer<typeof hotspotsIngestionSchema>;

export const HOTSPOTS_SAAS_INGESTION_CANONICAL_VERSION: HotspotsSaasIngestionSupportedVersion = '1';
export const HOTSPOTS_SAAS_INGESTION_SUPPORTED_VERSIONS: ReadonlyArray<HotspotsSaasIngestionSupportedVersion> =
  ['1', '1.0'];

export type HotspotsSaasIngestionParseResult =
  | {
      kind: 'valid';
      contract: HotspotsSaasIngestionPayloadV1;
      integrity: {
        valid: true;
        source_version: HotspotsSaasIngestionSupportedVersion;
      };
    }
  | {
      kind: 'invalid';
      reason: string;
      version?: string;
    };

export type HotspotsSaasIngestionReadResult =
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
      contract: HotspotsSaasIngestionPayloadV1;
      integrity: {
        valid: true;
        source_version: HotspotsSaasIngestionSupportedVersion;
      };
    };

export type CreateHotspotsSaasIngestionPayloadParams = {
  tenantId: string;
  repositoryId: string;
  repositoryName: string;
  report: LocalHotspotsReport;
  producerVersion: string;
  sourceMode?: HotspotsSaasIngestionSourceMode;
  generatedAt?: string;
  repositoryDefaultBranch?: string;
  tddBdd?: TddBddSnapshot;
};

const DEFAULT_HOTSPOTS_SAAS_INGESTION_PATH = '.pumuki/artifacts/hotspots-saas-ingestion-v1.json';

const extractVersionCandidate = (value: unknown): string | undefined => {
  if (typeof value !== 'object' || value === null || !('version' in value)) {
    return undefined;
  }
  const candidate = (value as { version?: unknown }).version;
  return typeof candidate === 'string' ? candidate : undefined;
};

export const resolveHotspotsSaasIngestionPayloadPath = (repoRoot: string): string => {
  const configured = process.env.PUMUKI_SAAS_INGESTION_PAYLOAD_PATH?.trim();
  const candidate =
    configured && configured.length > 0
      ? configured
      : DEFAULT_HOTSPOTS_SAAS_INGESTION_PATH;
  if (isAbsolute(candidate)) {
    return candidate;
  }
  return resolve(repoRoot, candidate);
};

const toHotspotEntries = (
  report: LocalHotspotsReport
): HotspotsSaasIngestionPayloadBodyV1['hotspots']['entries'] => {
  return report.hotspots.map((entry) => ({
    rank: entry.rank,
    path: entry.path,
    raw_score: entry.rawScore,
    normalized_score: entry.normalizedScore,
    findings_total: entry.findingsTotal,
    findings_by_enterprise_severity: {
      CRITICAL: entry.findingsByEnterpriseSeverity.CRITICAL,
      HIGH: entry.findingsByEnterpriseSeverity.HIGH,
      MEDIUM: entry.findingsByEnterpriseSeverity.MEDIUM,
      LOW: entry.findingsByEnterpriseSeverity.LOW,
    },
    findings_distinct_rules: entry.findingsDistinctRules,
    churn_commits: entry.churnCommits,
    churn_distinct_authors: entry.churnDistinctAuthors,
    churn_total_lines: entry.churnTotalLines,
  }));
};

const toTddBddCompliance = (
  snapshot: TddBddSnapshot | undefined
): HotspotsSaasIngestionPayloadBodyV1['compliance'] => {
  if (!snapshot) {
    return undefined;
  }
  return {
    tdd_bdd: {
      status: snapshot.status,
      in_scope: snapshot.scope.in_scope,
      slices_total: snapshot.evidence.slices_total,
      slices_valid: snapshot.evidence.slices_valid,
      slices_invalid: snapshot.evidence.slices_invalid,
      waiver_applied: snapshot.waiver.applied,
    },
  };
};

const normalizeBodyForIntegrity = (
  body: HotspotsSaasIngestionPayloadBodyV1 | HotspotsSaasIngestionPayloadBodyCompat
): unknown => {
  return {
    version: body.version,
    generated_at: body.generated_at,
    tenant_id: body.tenant_id,
    repository: {
      repository_id: body.repository.repository_id,
      name: body.repository.name,
      default_branch: body.repository.default_branch ?? null,
    },
    source: {
      producer: body.source.producer,
      producer_version: body.source.producer_version,
      mode: body.source.mode,
    },
    hotspots: {
      top_n: body.hotspots.top_n,
      since_days: body.hotspots.since_days,
      churn_signals: body.hotspots.churn_signals,
      technical_signals: body.hotspots.technical_signals,
      ranked: body.hotspots.ranked,
      entries: body.hotspots.entries.map((entry) => ({
        rank: entry.rank,
        path: entry.path,
        raw_score: entry.raw_score,
        normalized_score: entry.normalized_score,
        findings_total: entry.findings_total,
        findings_by_enterprise_severity: {
          CRITICAL: entry.findings_by_enterprise_severity.CRITICAL,
          HIGH: entry.findings_by_enterprise_severity.HIGH,
          MEDIUM: entry.findings_by_enterprise_severity.MEDIUM,
          LOW: entry.findings_by_enterprise_severity.LOW,
        },
        findings_distinct_rules: entry.findings_distinct_rules,
        churn_commits: entry.churn_commits,
        churn_distinct_authors: entry.churn_distinct_authors,
        churn_total_lines: entry.churn_total_lines,
      })),
    },
    compliance: body.compliance?.tdd_bdd
      ? {
          tdd_bdd: {
            status: body.compliance.tdd_bdd.status,
            in_scope: body.compliance.tdd_bdd.in_scope,
            slices_total: body.compliance.tdd_bdd.slices_total,
            slices_valid: body.compliance.tdd_bdd.slices_valid,
            slices_invalid: body.compliance.tdd_bdd.slices_invalid,
            waiver_applied: body.compliance.tdd_bdd.waiver_applied,
          },
        }
      : null,
  };
};

export const createHotspotsSaasIngestionPayloadHash = (
  body: HotspotsSaasIngestionPayloadBodyV1 | HotspotsSaasIngestionPayloadBodyCompat
): string => {
  return createHash('sha256')
    .update(stableStringify(normalizeBodyForIntegrity(body)), 'utf8')
    .digest('hex');
};

export const createHotspotsSaasIngestionPayload = (
  params: CreateHotspotsSaasIngestionPayloadParams
): HotspotsSaasIngestionPayloadV1 => {
  const body = hotspotsIngestionBodySchema.parse({
    version: HOTSPOTS_SAAS_INGESTION_CANONICAL_VERSION,
    generated_at: params.generatedAt ?? new Date().toISOString(),
    tenant_id: params.tenantId,
    repository: {
      repository_id: params.repositoryId,
      name: params.repositoryName,
      ...(params.repositoryDefaultBranch ? { default_branch: params.repositoryDefaultBranch } : {}),
    },
    source: {
      producer: 'pumuki',
      producer_version: params.producerVersion,
      mode: params.sourceMode ?? 'local',
    },
    hotspots: {
      top_n: params.report.options.topN,
      since_days: params.report.options.sinceDays,
      churn_signals: params.report.totals.churnSignals,
      technical_signals: params.report.totals.technicalSignals,
      ranked: params.report.totals.ranked,
      entries: toHotspotEntries(params.report),
    },
    compliance: toTddBddCompliance(params.tddBdd),
  });

  return hotspotsIngestionSchema.parse({
    ...body,
    integrity: {
      algorithm: 'sha256',
      payload_hash: createHotspotsSaasIngestionPayloadHash(body),
    },
  });
};

export const parseHotspotsSaasIngestionPayload = (
  value: unknown
): HotspotsSaasIngestionParseResult => {
  const validation = hotspotsIngestionCompatSchema.safeParse(value);
  if (!validation.success) {
    return {
      kind: 'invalid',
      reason: validation.error.issues[0]?.message ?? 'invalid_schema',
      version: extractVersionCandidate(value),
    };
  }
  const { integrity, ...body } = validation.data;
  const expectedHash = createHotspotsSaasIngestionPayloadHash(body);
  if (integrity.payload_hash !== expectedHash) {
    return {
      kind: 'invalid',
      reason: 'integrity_hash_mismatch',
      version: validation.data.version,
    };
  }
  const sourceVersion = validation.data.version;
  if (sourceVersion === HOTSPOTS_SAAS_INGESTION_CANONICAL_VERSION) {
    return {
      kind: 'valid',
      contract: hotspotsIngestionSchema.parse(validation.data),
      integrity: {
        valid: true,
        source_version: sourceVersion,
      },
    };
  }
  const canonicalBody = hotspotsIngestionBodySchema.parse({
    ...body,
    version: HOTSPOTS_SAAS_INGESTION_CANONICAL_VERSION,
  });
  const canonicalContract = hotspotsIngestionSchema.parse({
    ...canonicalBody,
    integrity: {
      algorithm: 'sha256',
      payload_hash: createHotspotsSaasIngestionPayloadHash(canonicalBody),
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

export const readHotspotsSaasIngestionPayload = (
  repoRoot: string
): HotspotsSaasIngestionReadResult => {
  const path = resolveHotspotsSaasIngestionPayloadPath(repoRoot);
  if (!existsSync(path)) {
    return {
      kind: 'missing',
      path,
    };
  }
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown;
    const validation = parseHotspotsSaasIngestionPayload(parsed);
    if (validation.kind !== 'valid') {
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
  } catch (error) {
    return {
      kind: 'invalid',
      path,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
};
