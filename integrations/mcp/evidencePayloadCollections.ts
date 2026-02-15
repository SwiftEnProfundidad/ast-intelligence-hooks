import type { AiEvidenceV2_1 } from '../evidence/schema';
import { sortPlatforms, sortRulesets } from './evidenceFacets';
import {
  inferFindingPlatform,
  sortLedger,
  sortSnapshotFindings,
} from './evidencePayloadCollectionsSorters';
import {
  MAX_FINDINGS_LIMIT,
  MAX_LEDGER_LIMIT,
  MAX_PLATFORMS_LIMIT,
  MAX_RULESETS_LIMIT,
  includeSuppressedFromQuery,
  normalizeQueryToken,
  parseBooleanQuery,
  parseNonNegativeIntQuery,
} from './evidencePayloadConfig';

export { sortSnapshotFindings, sortLedger, inferFindingPlatform };

export const toRulesetsPayload = (evidence: AiEvidenceV2_1, requestUrl: URL) => {
  const platformFilter = normalizeQueryToken(requestUrl.searchParams.get('platform'));
  const bundleFilter = normalizeQueryToken(requestUrl.searchParams.get('bundle'));
  const requestedLimit = parseNonNegativeIntQuery(requestUrl.searchParams.get('limit'));
  const limit =
    requestedLimit === undefined ? undefined : Math.min(requestedLimit, MAX_RULESETS_LIMIT);
  const offset = parseNonNegativeIntQuery(requestUrl.searchParams.get('offset')) ?? 0;

  const filteredRulesets = sortRulesets(evidence.rulesets).filter((ruleset) => {
    if (platformFilter && ruleset.platform.toLowerCase() !== platformFilter) {
      return false;
    }
    if (bundleFilter && ruleset.bundle.toLowerCase() !== bundleFilter) {
      return false;
    }
    return true;
  });
  const rulesets =
    limit === undefined
      ? filteredRulesets.slice(offset)
      : filteredRulesets.slice(offset, offset + limit);

  return {
    version: evidence.version,
    timestamp: evidence.timestamp,
    total_count: filteredRulesets.length,
    filters: {
      platform: platformFilter ?? null,
      bundle: bundleFilter ?? null,
    },
    pagination: {
      requested_limit: requestedLimit ?? null,
      max_limit: MAX_RULESETS_LIMIT,
      limit: limit ?? null,
      offset,
      ...(requestedLimit !== undefined
        ? { has_more: offset + rulesets.length < filteredRulesets.length }
        : {}),
    },
    rulesets,
  };
};

export const toPlatformsPayload = (evidence: AiEvidenceV2_1, requestUrl: URL) => {
  const detectedOnly = parseBooleanQuery(requestUrl.searchParams.get('detectedOnly')) ?? true;
  const confidenceFilter = normalizeQueryToken(requestUrl.searchParams.get('confidence'));
  const requestedLimit = parseNonNegativeIntQuery(requestUrl.searchParams.get('limit'));
  const limit =
    requestedLimit === undefined ? undefined : Math.min(requestedLimit, MAX_PLATFORMS_LIMIT);
  const offset = parseNonNegativeIntQuery(requestUrl.searchParams.get('offset')) ?? 0;
  const filteredPlatforms = sortPlatforms(evidence.platforms).filter((entry) => {
    if (detectedOnly && !entry.detected) {
      return false;
    }
    if (confidenceFilter && entry.confidence.toLowerCase() !== confidenceFilter) {
      return false;
    }
    return true;
  });
  const platforms =
    limit === undefined
      ? filteredPlatforms.slice(offset)
      : filteredPlatforms.slice(offset, offset + limit);
  return {
    version: evidence.version,
    timestamp: evidence.timestamp,
    total_count: filteredPlatforms.length,
    filters: {
      detectedOnly,
      confidence: confidenceFilter ?? null,
    },
    pagination: {
      requested_limit: requestedLimit ?? null,
      max_limit: MAX_PLATFORMS_LIMIT,
      limit: limit ?? null,
      offset,
      ...(requestedLimit !== undefined
        ? { has_more: offset + platforms.length < filteredPlatforms.length }
        : {}),
    },
    platforms,
  };
};

export const toLedgerPayload = (evidence: AiEvidenceV2_1) => {
  const ledger = sortLedger(evidence.ledger);
  return {
    version: evidence.version,
    timestamp: evidence.timestamp,
    total_count: ledger.length,
    filters: {
      lastSeenAfter: null,
      lastSeenBefore: null,
    },
    pagination: {
      requested_limit: null,
      max_limit: MAX_LEDGER_LIMIT,
      limit: null,
      offset: 0,
    },
    ledger,
  };
};

export const toLedgerPayloadWithFilters = (evidence: AiEvidenceV2_1, requestUrl: URL) => {
  const lastSeenAfter = normalizeQueryToken(requestUrl.searchParams.get('lastSeenAfter'));
  const lastSeenBefore = normalizeQueryToken(requestUrl.searchParams.get('lastSeenBefore'));
  const requestedLimit = parseNonNegativeIntQuery(requestUrl.searchParams.get('limit'));
  const limit = requestedLimit === undefined ? undefined : Math.min(requestedLimit, MAX_LEDGER_LIMIT);
  const offset = parseNonNegativeIntQuery(requestUrl.searchParams.get('offset')) ?? 0;
  const filteredLedger = sortLedger(evidence.ledger).filter((entry) => {
    if (lastSeenAfter && entry.lastSeen.toLowerCase() < lastSeenAfter) {
      return false;
    }
    if (lastSeenBefore && entry.lastSeen.toLowerCase() > lastSeenBefore) {
      return false;
    }
    return true;
  });
  const ledger =
    limit === undefined
      ? filteredLedger.slice(offset)
      : filteredLedger.slice(offset, offset + limit);

  return {
    version: evidence.version,
    timestamp: evidence.timestamp,
    total_count: filteredLedger.length,
    filters: {
      lastSeenAfter: lastSeenAfter ?? null,
      lastSeenBefore: lastSeenBefore ?? null,
    },
    pagination: {
      requested_limit: requestedLimit ?? null,
      max_limit: MAX_LEDGER_LIMIT,
      limit: limit ?? null,
      offset,
      ...(requestedLimit !== undefined
        ? { has_more: offset + ledger.length < filteredLedger.length }
        : {}),
    },
    ledger,
  };
};

export const toSnapshotPayload = (evidence: AiEvidenceV2_1) => {
  return {
    version: evidence.version,
    timestamp: evidence.timestamp,
    snapshot: {
      stage: evidence.snapshot.stage,
      outcome: evidence.snapshot.outcome,
      findings_count: evidence.snapshot.findings.length,
      findings: sortSnapshotFindings(evidence.snapshot.findings),
    },
  };
};

export const toFindingsPayload = (evidence: AiEvidenceV2_1, requestUrl: URL) => {
  const severityFilter = normalizeQueryToken(requestUrl.searchParams.get('severity'));
  const ruleIdFilter = normalizeQueryToken(requestUrl.searchParams.get('ruleId'));
  const platformFilter = normalizeQueryToken(requestUrl.searchParams.get('platform'));

  const requestedLimit = parseNonNegativeIntQuery(requestUrl.searchParams.get('limit'));
  const limit =
    requestedLimit === undefined ? undefined : Math.min(requestedLimit, MAX_FINDINGS_LIMIT);
  const offset = parseNonNegativeIntQuery(requestUrl.searchParams.get('offset')) ?? 0;

  const filteredFindings = sortSnapshotFindings(evidence.snapshot.findings).filter((finding) => {
    if (severityFilter && finding.severity.toLowerCase() !== severityFilter) {
      return false;
    }
    if (ruleIdFilter && finding.ruleId.toLowerCase() !== ruleIdFilter) {
      return false;
    }
    if (platformFilter && inferFindingPlatform(finding) !== platformFilter) {
      return false;
    }
    return true;
  });
  const findings =
    limit === undefined
      ? filteredFindings.slice(offset)
      : filteredFindings.slice(offset, offset + limit);

  return {
    version: evidence.version,
    timestamp: evidence.timestamp,
    snapshot: {
      stage: evidence.snapshot.stage,
      outcome: evidence.snapshot.outcome,
    },
    findings_count: findings.length,
    total_count: filteredFindings.length,
    filters: {
      severity: severityFilter ?? null,
      ruleId: ruleIdFilter ?? null,
      platform: platformFilter ?? null,
    },
    pagination: {
      requested_limit: requestedLimit ?? null,
      max_limit: MAX_FINDINGS_LIMIT,
      limit: limit ?? null,
      offset,
      ...(requestedLimit !== undefined
        ? { has_more: offset + findings.length < filteredFindings.length }
        : {}),
    },
    findings,
  };
};

export const toResponsePayload = (evidence: AiEvidenceV2_1, requestUrl: URL): unknown => {
  if (includeSuppressedFromQuery(requestUrl)) {
    return evidence;
  }
  const { consolidation: _ignored, ...rest } = evidence;
  return rest;
};
