import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import type { HotspotsSaasIngestionAuditEvent } from './saasIngestionAudit';
import { resolveHotspotsSaasIngestionAuditPath } from './saasIngestionAudit';

const DEFAULT_SAAS_INGESTION_METRICS_PATH = '.pumuki/artifacts/saas-ingestion-metrics.json';

export type HotspotsSaasIngestionMetrics = {
  generated_at: string;
  source_path: string;
  totals: {
    events: number;
    success: number;
    error: number;
    success_rate: number;
  };
  attempts: {
    avg: number;
    max: number;
  };
  latency_ms: {
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
  };
  errors_by_code: Record<string, number>;
};

const roundToSix = (value: number): number => {
  return Math.round(value * 1_000_000) / 1_000_000;
};

const toSafeNumber = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return value;
};

const percentile = (values: ReadonlyArray<number>, q: number): number => {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1));
  return sorted[index] ?? 0;
};

const isAuditEvent = (value: unknown): value is HotspotsSaasIngestionAuditEvent => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<HotspotsSaasIngestionAuditEvent>;
  return (
    typeof candidate.event_id === 'string' &&
    typeof candidate.event_at === 'string' &&
    typeof candidate.tenant_id === 'string' &&
    typeof candidate.repository_id === 'string' &&
    typeof candidate.endpoint === 'string' &&
    typeof candidate.idempotency_key === 'string' &&
    typeof candidate.payload_hash === 'string' &&
    (candidate.outcome === 'success' || candidate.outcome === 'error') &&
    typeof candidate.attempts === 'number' &&
    typeof candidate.latency_ms === 'number'
  );
};

const parseAuditEventsFromNdjson = (content: string): ReadonlyArray<HotspotsSaasIngestionAuditEvent> => {
  const events: HotspotsSaasIngestionAuditEvent[] = [];
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      continue;
    }
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (isAuditEvent(parsed)) {
        events.push(parsed);
      }
    } catch {
      continue;
    }
  }
  return events;
};

export const readHotspotsSaasIngestionAuditEvents = (
  repoRoot: string
): ReadonlyArray<HotspotsSaasIngestionAuditEvent> => {
  const auditPath = resolveHotspotsSaasIngestionAuditPath(repoRoot);
  if (!existsSync(auditPath)) {
    return [];
  }
  return parseAuditEventsFromNdjson(readFileSync(auditPath, 'utf8'));
};

export const buildHotspotsSaasIngestionMetricsFromEvents = (params: {
  events: ReadonlyArray<HotspotsSaasIngestionAuditEvent>;
  sourcePath: string;
  generatedAt?: string;
}): HotspotsSaasIngestionMetrics => {
  const events = params.events;
  const success = events.filter((event) => event.outcome === 'success');
  const error = events.filter((event) => event.outcome === 'error');
  const attemptsValues = events.map((event) => toSafeNumber(event.attempts));
  const latencyValues = events.map((event) => toSafeNumber(event.latency_ms));

  const attemptsTotal = attemptsValues.reduce((total, value) => total + value, 0);
  const latencyTotal = latencyValues.reduce((total, value) => total + value, 0);
  const errorByCode = error.reduce<Record<string, number>>((acc, current) => {
    const code = current.error_code ?? 'UNKNOWN';
    acc[code] = (acc[code] ?? 0) + 1;
    return acc;
  }, {});

  return {
    generated_at: params.generatedAt ?? new Date().toISOString(),
    source_path: params.sourcePath,
    totals: {
      events: events.length,
      success: success.length,
      error: error.length,
      success_rate: events.length === 0 ? 0 : roundToSix(success.length / events.length),
    },
    attempts: {
      avg: events.length === 0 ? 0 : roundToSix(attemptsTotal / events.length),
      max: attemptsValues.length === 0 ? 0 : Math.max(...attemptsValues),
    },
    latency_ms: {
      min: latencyValues.length === 0 ? 0 : Math.min(...latencyValues),
      max: latencyValues.length === 0 ? 0 : Math.max(...latencyValues),
      avg: latencyValues.length === 0 ? 0 : roundToSix(latencyTotal / latencyValues.length),
      p50: percentile(latencyValues, 0.5),
      p95: percentile(latencyValues, 0.95),
    },
    errors_by_code: Object.keys(errorByCode)
      .sort((left, right) => left.localeCompare(right))
      .reduce<Record<string, number>>((acc, code) => {
        acc[code] = errorByCode[code] ?? 0;
        return acc;
      }, {}),
  };
};

export const buildHotspotsSaasIngestionMetrics = (params: {
  repoRoot: string;
  generatedAt?: string;
}): HotspotsSaasIngestionMetrics => {
  const sourcePath = resolveHotspotsSaasIngestionAuditPath(params.repoRoot);
  const events = readHotspotsSaasIngestionAuditEvents(params.repoRoot);
  return buildHotspotsSaasIngestionMetricsFromEvents({
    events,
    sourcePath,
    generatedAt: params.generatedAt,
  });
};

export const resolveHotspotsSaasIngestionMetricsPath = (repoRoot: string): string => {
  const configured = process.env.PUMUKI_SAAS_INGESTION_METRICS_PATH?.trim();
  const candidate =
    configured && configured.length > 0 ? configured : DEFAULT_SAAS_INGESTION_METRICS_PATH;
  if (isAbsolute(candidate)) {
    return candidate;
  }
  return resolve(repoRoot, candidate);
};

export const writeHotspotsSaasIngestionMetrics = (params: {
  repoRoot: string;
  metrics: HotspotsSaasIngestionMetrics;
}): string => {
  const path = resolveHotspotsSaasIngestionMetricsPath(params.repoRoot);
  const parent = dirname(path);
  if (!existsSync(parent)) {
    mkdirSync(parent, { recursive: true });
  }
  writeFileSync(path, `${JSON.stringify(params.metrics, null, 2)}\n`, 'utf8');
  return path;
};
