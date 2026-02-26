import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { stableStringify } from '../../core/utils/stableStringify';
import type { HotspotsSaasIngestionPayloadV1 } from './saasIngestionContract';
import {
  sendHotspotsSaasIngestionPayload,
  type SendHotspotsSaasIngestionPayloadParams,
  type HotspotsSaasIngestionTransportResult,
} from './saasIngestionTransport';

const DEFAULT_SAAS_INGESTION_AUDIT_PATH = '.pumuki/artifacts/saas-ingestion-audit.ndjson';

export type HotspotsSaasIngestionAuditEvent = {
  event_id: string;
  event_at: string;
  tenant_id: string;
  repository_id: string;
  endpoint: string;
  idempotency_key: string;
  payload_hash: string;
  outcome: 'success' | 'error';
  attempts: number;
  latency_ms: number;
  request_id?: string;
  status?: number;
  error_code?: string;
  retryable?: boolean;
};

export const resolveHotspotsSaasIngestionAuditPath = (repoRoot: string): string => {
  const configured = process.env.PUMUKI_SAAS_INGESTION_AUDIT_PATH?.trim();
  const candidate =
    configured && configured.length > 0 ? configured : DEFAULT_SAAS_INGESTION_AUDIT_PATH;
  if (isAbsolute(candidate)) {
    return candidate;
  }
  return resolve(repoRoot, candidate);
};

const toAuditEventSeed = (event: Omit<HotspotsSaasIngestionAuditEvent, 'event_id'>): unknown => {
  return {
    event_at: event.event_at,
    tenant_id: event.tenant_id,
    repository_id: event.repository_id,
    endpoint: event.endpoint,
    idempotency_key: event.idempotency_key,
    payload_hash: event.payload_hash,
    outcome: event.outcome,
    attempts: event.attempts,
    latency_ms: event.latency_ms,
    request_id: event.request_id ?? null,
    status: event.status ?? null,
    error_code: event.error_code ?? null,
    retryable: event.retryable ?? null,
  };
};

const createAuditEventId = (event: Omit<HotspotsSaasIngestionAuditEvent, 'event_id'>): string => {
  const digest = createHash('sha256')
    .update(stableStringify(toAuditEventSeed(event)), 'utf8')
    .digest('hex');
  return `saas-ingestion-${digest.slice(0, 24)}`;
};

export const createHotspotsSaasIngestionAuditEvent = (params: {
  endpoint: string;
  payload: HotspotsSaasIngestionPayloadV1;
  result: HotspotsSaasIngestionTransportResult;
  eventAt?: string;
}): HotspotsSaasIngestionAuditEvent => {
  const baseEvent = {
    event_at: params.eventAt ?? new Date().toISOString(),
    tenant_id: params.payload.tenant_id,
    repository_id: params.payload.repository.repository_id,
    endpoint: params.endpoint,
    idempotency_key:
      params.result.kind === 'success'
        ? params.result.idempotencyKey
        : params.result.idempotencyKey ?? 'unknown',
    payload_hash: params.payload.integrity.payload_hash,
    outcome: params.result.kind === 'success' ? 'success' : 'error',
    attempts: params.result.attempts,
    latency_ms: params.result.durationMs,
    request_id: params.result.kind === 'success' ? params.result.requestId : undefined,
    status: params.result.kind === 'success' ? params.result.status : params.result.status,
    error_code: params.result.kind === 'error' ? params.result.code : undefined,
    retryable: params.result.kind === 'error' ? params.result.retryable : undefined,
  } satisfies Omit<HotspotsSaasIngestionAuditEvent, 'event_id'>;

  return {
    event_id: createAuditEventId(baseEvent),
    ...baseEvent,
  };
};

export const appendHotspotsSaasIngestionAuditEvent = (params: {
  repoRoot: string;
  event: HotspotsSaasIngestionAuditEvent;
}): string => {
  const path = resolveHotspotsSaasIngestionAuditPath(params.repoRoot);
  const parent = dirname(path);
  if (!existsSync(parent)) {
    mkdirSync(parent, { recursive: true });
  }
  appendFileSync(path, `${JSON.stringify(params.event)}\n`, 'utf8');
  return path;
};

export const sendHotspotsSaasIngestionPayloadWithAudit = async (
  params: SendHotspotsSaasIngestionPayloadParams & {
    repoRoot: string;
    eventAt?: string;
  }
): Promise<{
  result: HotspotsSaasIngestionTransportResult;
  event: HotspotsSaasIngestionAuditEvent;
  auditPath: string;
}> => {
  const result = await sendHotspotsSaasIngestionPayload(params);
  const event = createHotspotsSaasIngestionAuditEvent({
    endpoint: params.endpoint,
    payload: params.payload,
    result,
    eventAt: params.eventAt,
  });
  const auditPath = appendHotspotsSaasIngestionAuditEvent({
    repoRoot: params.repoRoot,
    event,
  });
  return {
    result,
    event,
    auditPath,
  };
};
