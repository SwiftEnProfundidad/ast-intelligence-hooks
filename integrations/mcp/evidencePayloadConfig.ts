export const MAX_FINDINGS_LIMIT = 100;
export const MAX_RULESETS_LIMIT = 100;
export const MAX_PLATFORMS_LIMIT = 100;
export const MAX_LEDGER_LIMIT = 100;

export const truthyQueryValues = new Set(['1', 'true', 'yes', 'on']);
export const falsyQueryValues = new Set(['0', 'false', 'no', 'off']);

export const CONTEXT_API_CAPABILITIES = {
  endpoints: [
    '/health',
    '/status',
    '/ai-evidence',
    '/ai-evidence/summary',
    '/ai-evidence/snapshot',
    '/ai-evidence/findings',
    '/ai-evidence/rulesets',
    '/ai-evidence/platforms',
    '/ai-evidence/ledger',
  ],
  filters: {
    findings: ['severity', 'ruleId', 'platform', 'limit', 'offset', 'maxLimit'],
    rulesets: ['platform', 'bundle', 'limit', 'offset', 'maxLimit'],
    platforms: ['detectedOnly', 'confidence', 'limit', 'offset', 'maxLimit'],
    ledger: ['lastSeenAfter', 'lastSeenBefore', 'limit', 'offset', 'maxLimit'],
  },
  pagination_bounds: {
    findings: { max_limit: MAX_FINDINGS_LIMIT },
    rulesets: { max_limit: MAX_RULESETS_LIMIT },
    platforms: { max_limit: MAX_PLATFORMS_LIMIT },
    ledger: { max_limit: MAX_LEDGER_LIMIT },
  },
} as const;


export const parseBooleanQuery = (value: string | null) => {
  if (!value) {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  if (truthyQueryValues.has(normalized)) {
    return true;
  }
  if (falsyQueryValues.has(normalized)) {
    return false;
  }
  return undefined;
};

export const parseNonNegativeIntQuery = (value: string | null) => {
  if (!value) {
    return undefined;
  }
  if (!/^\d+$/.test(value.trim())) {
    return undefined;
  }
  return Number.parseInt(value.trim(), 10);
};

export const includeSuppressedFromQuery = (requestUrl: URL): boolean => {
  const view = requestUrl.searchParams.get('view')?.trim().toLowerCase();
  if (view === 'compact') {
    return false;
  }
  if (view === 'full') {
    return true;
  }

  const parsed = parseBooleanQuery(requestUrl.searchParams.get('includeSuppressed'));
  return parsed ?? true;
};

export const normalizeQueryToken = (value: string | null) => {
  if (!value) {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : undefined;
};
