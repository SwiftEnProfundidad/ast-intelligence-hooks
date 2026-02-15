import type { AiEvidenceV2_1 } from '../evidence/schema';
import {
  inferFindingPlatform,
  sortSnapshotFindings,
} from './evidencePayloadCollectionsSorters';
import {
  capRequestedLimit,
  sliceByOffsetAndLimit,
  toPaginationPayload,
} from './evidencePayloadCollectionsPaging';
import {
  MAX_FINDINGS_LIMIT,
  includeSuppressedFromQuery,
  normalizeQueryToken,
  parseNonNegativeIntQuery,
} from './evidencePayloadConfig';
export { toRulesetsPayload } from './evidencePayloadCollectionsRulesets';
export { toPlatformsPayload } from './evidencePayloadCollectionsPlatforms';
export {
  toLedgerPayload,
  toLedgerPayloadWithFilters,
} from './evidencePayloadCollectionsLedger';

export { sortSnapshotFindings, sortLedger, inferFindingPlatform } from './evidencePayloadCollectionsSorters';

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
  const limit = capRequestedLimit(requestedLimit, MAX_FINDINGS_LIMIT);
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
  const findings = sliceByOffsetAndLimit(filteredFindings, offset, limit);

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
    pagination: toPaginationPayload({
      requestedLimit,
      maxLimit: MAX_FINDINGS_LIMIT,
      limit,
      offset,
      pageSize: findings.length,
      totalCount: filteredFindings.length,
    }),
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
