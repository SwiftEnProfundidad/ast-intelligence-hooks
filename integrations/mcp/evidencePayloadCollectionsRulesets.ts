import type { AiEvidenceV2_1 } from '../evidence/schema';
import { sortRulesets } from './evidenceFacets';
import {
  capRequestedLimit,
  sliceByOffsetAndLimit,
  toPaginationPayload,
} from './evidencePayloadCollectionsPaging';
import {
  MAX_RULESETS_LIMIT,
  normalizeQueryToken,
  parseNonNegativeIntQuery,
} from './evidencePayloadConfig';

export const toRulesetsPayload = (evidence: AiEvidenceV2_1, requestUrl: URL) => {
  const platformFilter = normalizeQueryToken(requestUrl.searchParams.get('platform'));
  const bundleFilter = normalizeQueryToken(requestUrl.searchParams.get('bundle'));
  const requestedLimit = parseNonNegativeIntQuery(requestUrl.searchParams.get('limit'));
  const limit = capRequestedLimit(requestedLimit, MAX_RULESETS_LIMIT);
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
  const rulesets = sliceByOffsetAndLimit(filteredRulesets, offset, limit);

  return {
    version: evidence.version,
    timestamp: evidence.timestamp,
    total_count: filteredRulesets.length,
    filters: {
      platform: platformFilter ?? null,
      bundle: bundleFilter ?? null,
    },
    pagination: toPaginationPayload({
      requestedLimit,
      maxLimit: MAX_RULESETS_LIMIT,
      limit,
      offset,
      pageSize: rulesets.length,
      totalCount: filteredRulesets.length,
    }),
    rulesets,
  };
};
