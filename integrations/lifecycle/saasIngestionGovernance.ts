import { createHash } from 'node:crypto';
import { z } from 'zod';
import { stableStringify } from '../../core/utils/stableStringify';
import type { HotspotsSaasIngestionAuditEvent } from './saasIngestionAudit';
import type { HotspotsSaasIngestionPayloadV1 } from './saasIngestionContract';

const governancePolicySchema = z
  .object({
    version: z.literal('1'),
    generated_at: z.string().datetime({ offset: true }),
    tenant_id: z.string().min(1),
    repository_id: z.string().min(1),
    isolation: z
      .object({
        enforce_tenant_header: z.boolean(),
        enforce_repository_header: z.boolean(),
        block_on_mismatch: z.boolean(),
      })
      .strict(),
    retention: z
      .object({
        audit_events_ttl_days: z.number().int().positive(),
        metrics_ttl_days: z.number().int().positive(),
        contract_ttl_days: z.number().int().positive(),
      })
      .strict(),
    privacy: z
      .object({
        redact_tenant_id: z.boolean(),
        redact_repository_id: z.boolean(),
        hash_payload_hash: z.boolean(),
        allow_raw_path_labels: z.boolean(),
      })
      .strict(),
  })
  .strict();

export type HotspotsSaasGovernancePolicyV1 = z.infer<typeof governancePolicySchema>;

export type CreateHotspotsSaasGovernancePolicyParams = {
  tenantId: string;
  repositoryId: string;
  generatedAt?: string;
  auditEventsTtlDays?: number;
  metricsTtlDays?: number;
  contractTtlDays?: number;
  redactTenantId?: boolean;
  redactRepositoryId?: boolean;
  hashPayloadHash?: boolean;
  allowRawPathLabels?: boolean;
};

export type HotspotsSaasGovernancePolicyValidationResult =
  | {
      kind: 'valid';
    }
  | {
      kind: 'invalid';
      reason:
        | 'tenant_mismatch'
        | 'repository_mismatch'
        | 'retention_invalid'
        | 'privacy_invalid';
      message: string;
    };

const DEFAULT_AUDIT_EVENTS_TTL_DAYS = 90;
const DEFAULT_METRICS_TTL_DAYS = 365;
const DEFAULT_CONTRACT_TTL_DAYS = 30;

const toNormalizedGovernanceHashSource = (policy: HotspotsSaasGovernancePolicyV1): unknown => {
  return {
    version: policy.version,
    generated_at: policy.generated_at,
    tenant_id: policy.tenant_id,
    repository_id: policy.repository_id,
    isolation: {
      enforce_tenant_header: policy.isolation.enforce_tenant_header,
      enforce_repository_header: policy.isolation.enforce_repository_header,
      block_on_mismatch: policy.isolation.block_on_mismatch,
    },
    retention: {
      audit_events_ttl_days: policy.retention.audit_events_ttl_days,
      metrics_ttl_days: policy.retention.metrics_ttl_days,
      contract_ttl_days: policy.retention.contract_ttl_days,
    },
    privacy: {
      redact_tenant_id: policy.privacy.redact_tenant_id,
      redact_repository_id: policy.privacy.redact_repository_id,
      hash_payload_hash: policy.privacy.hash_payload_hash,
      allow_raw_path_labels: policy.privacy.allow_raw_path_labels,
    },
  };
};

const hashString = (value: string): string =>
  createHash('sha256').update(value, 'utf8').digest('hex');

const hashStable = (value: unknown): string => hashString(stableStringify(value));

const anonymizeToken = (value: string): string => `sha256:${hashString(value).slice(0, 16)}`;

const normalizePositiveInt = (value: number | undefined, fallback: number): number => {
  if (!Number.isInteger(value) || (value ?? 0) <= 0) {
    return fallback;
  }
  return value as number;
};

export const createHotspotsSaasGovernancePolicy = (
  params: CreateHotspotsSaasGovernancePolicyParams
): HotspotsSaasGovernancePolicyV1 => {
  return governancePolicySchema.parse({
    version: '1',
    generated_at: params.generatedAt ?? new Date().toISOString(),
    tenant_id: params.tenantId,
    repository_id: params.repositoryId,
    isolation: {
      enforce_tenant_header: true,
      enforce_repository_header: true,
      block_on_mismatch: true,
    },
    retention: {
      audit_events_ttl_days: normalizePositiveInt(
        params.auditEventsTtlDays,
        DEFAULT_AUDIT_EVENTS_TTL_DAYS
      ),
      metrics_ttl_days: normalizePositiveInt(params.metricsTtlDays, DEFAULT_METRICS_TTL_DAYS),
      contract_ttl_days: normalizePositiveInt(params.contractTtlDays, DEFAULT_CONTRACT_TTL_DAYS),
    },
    privacy: {
      redact_tenant_id: params.redactTenantId ?? false,
      redact_repository_id: params.redactRepositoryId ?? false,
      hash_payload_hash: params.hashPayloadHash ?? false,
      allow_raw_path_labels: params.allowRawPathLabels ?? true,
    },
  });
};

export const createHotspotsSaasGovernancePolicyHash = (
  policy: HotspotsSaasGovernancePolicyV1
): string => {
  return hashStable(toNormalizedGovernanceHashSource(governancePolicySchema.parse(policy)));
};

export const validateHotspotsSaasGovernancePolicy = (params: {
  policy: HotspotsSaasGovernancePolicyV1;
  payload: Pick<HotspotsSaasIngestionPayloadV1, 'tenant_id' | 'repository'>;
}): HotspotsSaasGovernancePolicyValidationResult => {
  const policy = governancePolicySchema.parse(params.policy);
  if (policy.tenant_id !== params.payload.tenant_id) {
    return {
      kind: 'invalid',
      reason: 'tenant_mismatch',
      message: 'tenant_mismatch',
    };
  }
  if (policy.repository_id !== params.payload.repository.repository_id) {
    return {
      kind: 'invalid',
      reason: 'repository_mismatch',
      message: 'repository_mismatch',
    };
  }
  if (
    policy.retention.audit_events_ttl_days <= 0 ||
    policy.retention.metrics_ttl_days <= 0 ||
    policy.retention.contract_ttl_days <= 0
  ) {
    return {
      kind: 'invalid',
      reason: 'retention_invalid',
      message: 'retention_invalid',
    };
  }
  if (policy.privacy.redact_tenant_id && !policy.privacy.redact_repository_id) {
    return {
      kind: 'invalid',
      reason: 'privacy_invalid',
      message: 'privacy_invalid',
    };
  }
  return {
    kind: 'valid',
  };
};

export const applyHotspotsSaasGovernancePrivacy = (params: {
  event: HotspotsSaasIngestionAuditEvent;
  policy: HotspotsSaasGovernancePolicyV1;
}): HotspotsSaasIngestionAuditEvent => {
  const policy = governancePolicySchema.parse(params.policy);
  return {
    ...params.event,
    tenant_id: policy.privacy.redact_tenant_id
      ? anonymizeToken(params.event.tenant_id)
      : params.event.tenant_id,
    repository_id: policy.privacy.redact_repository_id
      ? anonymizeToken(params.event.repository_id)
      : params.event.repository_id,
    payload_hash: policy.privacy.hash_payload_hash
      ? anonymizeToken(params.event.payload_hash)
      : params.event.payload_hash,
  };
};
