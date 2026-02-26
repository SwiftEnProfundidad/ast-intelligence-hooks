import { createHash } from 'node:crypto';
import { stableStringify } from '../../core/utils/stableStringify';
import type { HotspotsSaasIngestionPayloadV1 } from './saasIngestionContract';

export const HOTSPOTS_SAAS_INGESTION_IDEMPOTENCY_PREFIX = 'pumuki-hotspots-v1';

const toIdempotencySource = (payload: HotspotsSaasIngestionPayloadV1): unknown => {
  return {
    version: payload.version,
    tenant_id: payload.tenant_id,
    repository_id: payload.repository.repository_id,
    source_mode: payload.source.mode,
    generated_at: payload.generated_at,
    payload_hash: payload.integrity.payload_hash,
  };
};

export const createHotspotsSaasIngestionIdempotencyKey = (
  payload: HotspotsSaasIngestionPayloadV1
): string => {
  const digest = createHash('sha256')
    .update(stableStringify(toIdempotencySource(payload)), 'utf8')
    .digest('hex');
  return `${HOTSPOTS_SAAS_INGESTION_IDEMPOTENCY_PREFIX}-${digest.slice(0, 32)}`;
};
