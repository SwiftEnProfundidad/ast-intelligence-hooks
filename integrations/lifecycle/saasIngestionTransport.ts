import type { HotspotsSaasIngestionPayloadV1 } from './saasIngestionContract';
import {
  validateHotspotsSaasIngestionAuthPolicy,
  type HotspotsSaasIngestionAuthPolicy,
} from './saasIngestionAuth';
import { createHotspotsSaasIngestionIdempotencyKey } from './saasIngestionIdempotency';

export type HotspotsSaasIngestionTransportFetch = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;

export type HotspotsSaasIngestionTransportErrorCode =
  | 'AUTH_POLICY_VIOLATION'
  | 'ISOLATION_VIOLATION'
  | 'TIMEOUT'
  | 'ABORTED'
  | 'NETWORK'
  | 'HTTP_STATUS';

export type HotspotsSaasIngestionTransportSuccess = {
  kind: 'success';
  status: number;
  attempts: number;
  durationMs: number;
  idempotencyKey: string;
  requestId?: string;
  responseBody: string;
};

export type HotspotsSaasIngestionTransportError = {
  kind: 'error';
  code: HotspotsSaasIngestionTransportErrorCode;
  attempts: number;
  durationMs: number;
  idempotencyKey?: string;
  message: string;
  retryable: boolean;
  status?: number;
  responseBody?: string;
};

export type HotspotsSaasIngestionTransportResult =
  | HotspotsSaasIngestionTransportSuccess
  | HotspotsSaasIngestionTransportError;

export type SendHotspotsSaasIngestionPayloadParams = {
  endpoint: string;
  payload: HotspotsSaasIngestionPayloadV1;
  idempotencyKey?: string;
  token?: string;
  apiKey?: string;
  authPolicy?: HotspotsSaasIngestionAuthPolicy;
  headers?: Readonly<Record<string, string>>;
  timeoutMs?: number;
  maxRetries?: number;
  retryBaseDelayMs?: number;
  signal?: AbortSignal;
  fetchImpl?: HotspotsSaasIngestionTransportFetch;
  waitForRetry?: (delayMs: number) => Promise<void>;
};

export const DEFAULT_SAAS_INGESTION_TIMEOUT_MS = 5_000;
export const DEFAULT_SAAS_INGESTION_MAX_RETRIES = 2;
export const DEFAULT_SAAS_INGESTION_RETRY_BASE_DELAY_MS = 250;

const RETRYABLE_HTTP_STATUS = new Set<number>([408, 425, 429, 500, 502, 503, 504]);

const waitFor = (delayMs: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, delayMs));

const sanitizePositiveInteger = (value: number, fallback: number): number => {
  if (!Number.isInteger(value) || value <= 0) {
    return fallback;
  }
  return value;
};

const sanitizeNonNegativeInteger = (value: number, fallback: number): number => {
  if (!Number.isInteger(value) || value < 0) {
    return fallback;
  }
  return value;
};

const toAttemptDelay = (attempt: number, baseDelayMs: number): number => {
  return baseDelayMs * 2 ** Math.max(0, attempt - 1);
};

const normalizeCustomHeaders = (
  headers: Readonly<Record<string, string>> | undefined
): Record<string, string> => {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers ?? {})) {
    normalized[key.toLowerCase()] = value;
  }
  return normalized;
};

const createHeaders = (
  params: SendHotspotsSaasIngestionPayloadParams,
  idempotencyKey: string
): { kind: 'ok'; headers: Record<string, string> } | { kind: 'error'; message: string } => {
  const customHeaders = normalizeCustomHeaders(params.headers);
  const expectedTenantId = params.payload.tenant_id;
  const expectedRepositoryId = params.payload.repository.repository_id;
  const overrideTenantId = customHeaders['x-tenant-id'];
  const overrideRepositoryId = customHeaders['x-repository-id'];
  if (overrideTenantId && overrideTenantId !== expectedTenantId) {
    return {
      kind: 'error',
      message: 'tenant_id_mismatch',
    };
  }
  if (overrideRepositoryId && overrideRepositoryId !== expectedRepositoryId) {
    return {
      kind: 'error',
      message: 'repository_id_mismatch',
    };
  }
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json',
    'x-tenant-id': expectedTenantId,
    'x-repository-id': expectedRepositoryId,
    'idempotency-key': idempotencyKey,
    ...customHeaders,
  };
  if (params.token && params.token.trim().length > 0) {
    headers.authorization = `Bearer ${params.token.trim()}`;
  }
  if (params.apiKey && params.apiKey.trim().length > 0) {
    headers['x-api-key'] = params.apiKey.trim();
  }
  return {
    kind: 'ok',
    headers,
  };
};

const createAttemptController = (params: {
  timeoutMs: number;
  parentSignal?: AbortSignal;
}): {
  signal: AbortSignal;
  clear: () => void;
  didTimeout: () => boolean;
  wasParentAbort: () => boolean;
} => {
  const controller = new AbortController();
  let timedOut = false;
  let parentAborted = false;
  const onParentAbort = (): void => {
    parentAborted = true;
    controller.abort();
  };
  if (params.parentSignal) {
    if (params.parentSignal.aborted) {
      onParentAbort();
    } else {
      params.parentSignal.addEventListener('abort', onParentAbort, { once: true });
    }
  }
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, params.timeoutMs);

  return {
    signal: controller.signal,
    clear: () => {
      clearTimeout(timeout);
      if (params.parentSignal) {
        params.parentSignal.removeEventListener('abort', onParentAbort);
      }
    },
    didTimeout: () => timedOut,
    wasParentAbort: () => parentAborted,
  };
};

const toNetworkErrorResult = (params: {
  attempt: number;
  durationMs: number;
  idempotencyKey: string;
  error: unknown;
  timedOut: boolean;
  parentAborted: boolean;
}): HotspotsSaasIngestionTransportError => {
  const message = params.error instanceof Error ? params.error.message : String(params.error);
  if (params.timedOut) {
    return {
      kind: 'error',
      code: 'TIMEOUT',
      attempts: params.attempt,
      durationMs: params.durationMs,
      idempotencyKey: params.idempotencyKey,
      message,
      retryable: true,
    };
  }
  if (params.parentAborted) {
    return {
      kind: 'error',
      code: 'ABORTED',
      attempts: params.attempt,
      durationMs: params.durationMs,
      idempotencyKey: params.idempotencyKey,
      message,
      retryable: false,
    };
  }
  return {
    kind: 'error',
    code: 'NETWORK',
    attempts: params.attempt,
    durationMs: params.durationMs,
    idempotencyKey: params.idempotencyKey,
    message,
    retryable: true,
  };
};

export const sendHotspotsSaasIngestionPayload = async (
  params: SendHotspotsSaasIngestionPayloadParams
): Promise<HotspotsSaasIngestionTransportResult> => {
  const fetchImpl = params.fetchImpl ?? (globalThis.fetch as HotspotsSaasIngestionTransportFetch);
  if (typeof fetchImpl !== 'function') {
    return {
      kind: 'error',
      code: 'NETWORK',
      attempts: 0,
      durationMs: 0,
      message: 'fetch_not_available',
      retryable: false,
    };
  }
  const timeoutMs = sanitizePositiveInteger(
    params.timeoutMs ?? DEFAULT_SAAS_INGESTION_TIMEOUT_MS,
    DEFAULT_SAAS_INGESTION_TIMEOUT_MS
  );
  const maxRetries = sanitizeNonNegativeInteger(
    params.maxRetries ?? DEFAULT_SAAS_INGESTION_MAX_RETRIES,
    DEFAULT_SAAS_INGESTION_MAX_RETRIES
  );
  const retryBaseDelayMs = sanitizePositiveInteger(
    params.retryBaseDelayMs ?? DEFAULT_SAAS_INGESTION_RETRY_BASE_DELAY_MS,
    DEFAULT_SAAS_INGESTION_RETRY_BASE_DELAY_MS
  );
  const waitRetry = params.waitForRetry ?? waitFor;
  const endpoint = params.endpoint.trim();
  const body = JSON.stringify(params.payload);
  const startedAt = Date.now();
  const idempotencyKey =
    params.idempotencyKey && params.idempotencyKey.trim().length > 0
      ? params.idempotencyKey.trim()
      : createHotspotsSaasIngestionIdempotencyKey(params.payload);
  const authPolicyValidation = validateHotspotsSaasIngestionAuthPolicy({
    payload: params.payload,
    token: params.token,
    apiKey: params.apiKey,
    authPolicy: params.authPolicy,
  });
  if (authPolicyValidation.kind === 'invalid') {
    return {
      kind: 'error',
      code: 'AUTH_POLICY_VIOLATION',
      attempts: 0,
      durationMs: Date.now() - startedAt,
      idempotencyKey,
      message: authPolicyValidation.message,
      retryable: false,
    };
  }
  const headersResult = createHeaders(params, idempotencyKey);
  if (headersResult.kind === 'error') {
    return {
      kind: 'error',
      code: 'ISOLATION_VIOLATION',
      attempts: 0,
      durationMs: Date.now() - startedAt,
      idempotencyKey,
      message: headersResult.message,
      retryable: false,
    };
  }
  const headers = headersResult.headers;

  let lastError: HotspotsSaasIngestionTransportError = {
    kind: 'error',
    code: 'NETWORK',
    attempts: 0,
    durationMs: Date.now() - startedAt,
    idempotencyKey,
    message: 'transport_not_executed',
    retryable: false,
  };

  for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
    const attemptController = createAttemptController({
      timeoutMs,
      parentSignal: params.signal,
    });

    try {
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers,
        body,
        signal: attemptController.signal,
      });
      const responseBody = await response.text();
      attemptController.clear();
      if (response.ok) {
        return {
          kind: 'success',
          status: response.status,
          attempts: attempt,
          durationMs: Date.now() - startedAt,
          idempotencyKey,
          requestId: response.headers.get('x-request-id') ?? undefined,
          responseBody,
        };
      }
      const retryable = RETRYABLE_HTTP_STATUS.has(response.status);
      lastError = {
        kind: 'error',
        code: 'HTTP_STATUS',
        attempts: attempt,
        durationMs: Date.now() - startedAt,
        idempotencyKey,
        message: `http_status_${response.status}`,
        retryable,
        status: response.status,
        responseBody,
      };
      if (!retryable || attempt > maxRetries) {
        return lastError;
      }
      await waitRetry(toAttemptDelay(attempt, retryBaseDelayMs));
    } catch (error) {
      attemptController.clear();
      lastError = toNetworkErrorResult({
        attempt,
        durationMs: Date.now() - startedAt,
        idempotencyKey,
        error,
        timedOut: attemptController.didTimeout(),
        parentAborted: attemptController.wasParentAbort(),
      });
      if (!lastError.retryable || attempt > maxRetries) {
        return lastError;
      }
      await waitRetry(toAttemptDelay(attempt, retryBaseDelayMs));
    }
  }

  return lastError;
};
