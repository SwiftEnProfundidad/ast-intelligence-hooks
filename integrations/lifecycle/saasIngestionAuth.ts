import type { HotspotsSaasIngestionPayloadV1 } from './saasIngestionContract';

export type HotspotsSaasIngestionAuthScheme = 'bearer' | 'api_key' | 'either';

export type HotspotsSaasIngestionAuthPolicy = {
  required?: boolean;
  scheme?: HotspotsSaasIngestionAuthScheme;
  rotatedAt: string;
  expiresAt: string;
  scopeTenantId: string;
  scopeRepositoryId: string;
  now?: string;
};

export type HotspotsSaasIngestionAuthValidationResult =
  | {
      kind: 'valid';
    }
  | {
      kind: 'invalid';
      reason:
        | 'auth_missing'
        | 'auth_scheme_mismatch'
        | 'token_rotation_invalid'
        | 'token_expired'
        | 'scope_tenant_mismatch'
        | 'scope_repository_mismatch';
      message: string;
    };

const parseTimestamp = (value: string): number | undefined => {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  return parsed;
};

export const validateHotspotsSaasIngestionAuthPolicy = (params: {
  payload: HotspotsSaasIngestionPayloadV1;
  token?: string;
  apiKey?: string;
  authPolicy?: HotspotsSaasIngestionAuthPolicy;
}): HotspotsSaasIngestionAuthValidationResult => {
  const policy = params.authPolicy;
  if (!policy) {
    return {
      kind: 'valid',
    };
  }

  const token = params.token?.trim();
  const apiKey = params.apiKey?.trim();
  const hasBearer = Boolean(token && token.length > 0);
  const hasApiKey = Boolean(apiKey && apiKey.length > 0);
  const required = policy.required ?? true;
  if (required && !hasBearer && !hasApiKey) {
    return {
      kind: 'invalid',
      reason: 'auth_missing',
      message: 'auth_missing',
    };
  }

  const scheme = policy.scheme ?? 'either';
  if (scheme === 'bearer' && !hasBearer) {
    return {
      kind: 'invalid',
      reason: 'auth_scheme_mismatch',
      message: 'auth_scheme_mismatch',
    };
  }
  if (scheme === 'api_key' && !hasApiKey) {
    return {
      kind: 'invalid',
      reason: 'auth_scheme_mismatch',
      message: 'auth_scheme_mismatch',
    };
  }

  const rotatedAt = parseTimestamp(policy.rotatedAt);
  const expiresAt = parseTimestamp(policy.expiresAt);
  const now = parseTimestamp(policy.now ?? new Date().toISOString());
  if (rotatedAt === undefined || expiresAt === undefined || now === undefined || rotatedAt > now) {
    return {
      kind: 'invalid',
      reason: 'token_rotation_invalid',
      message: 'token_rotation_invalid',
    };
  }
  if (expiresAt <= now) {
    return {
      kind: 'invalid',
      reason: 'token_expired',
      message: 'token_expired',
    };
  }
  if (policy.scopeTenantId !== params.payload.tenant_id) {
    return {
      kind: 'invalid',
      reason: 'scope_tenant_mismatch',
      message: 'scope_tenant_mismatch',
    };
  }
  if (policy.scopeRepositoryId !== params.payload.repository.repository_id) {
    return {
      kind: 'invalid',
      reason: 'scope_repository_mismatch',
      message: 'scope_repository_mismatch',
    };
  }
  return {
    kind: 'valid',
  };
};
