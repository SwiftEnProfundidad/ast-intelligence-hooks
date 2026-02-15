import type { AiEvidenceV2_1 } from '../evidence/schema';
import { sortPlatforms } from './evidenceFacets';
import {
  capRequestedLimit,
  sliceByOffsetAndLimit,
  toPaginationPayload,
} from './evidencePayloadCollectionsPaging';
import {
  MAX_PLATFORMS_LIMIT,
  normalizeQueryToken,
  parseBooleanQuery,
  parseNonNegativeIntQuery,
} from './evidencePayloadConfig';

export const toPlatformsPayload = (evidence: AiEvidenceV2_1, requestUrl: URL) => {
  const detectedOnly = parseBooleanQuery(requestUrl.searchParams.get('detectedOnly')) ?? true;
  const confidenceFilter = normalizeQueryToken(requestUrl.searchParams.get('confidence'));
  const requestedLimit = parseNonNegativeIntQuery(requestUrl.searchParams.get('limit'));
  const limit = capRequestedLimit(requestedLimit, MAX_PLATFORMS_LIMIT);
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
  const platforms = sliceByOffsetAndLimit(filteredPlatforms, offset, limit);
  return {
    version: evidence.version,
    timestamp: evidence.timestamp,
    total_count: filteredPlatforms.length,
    filters: {
      detectedOnly,
      confidence: confidenceFilter ?? null,
    },
    pagination: toPaginationPayload({
      requestedLimit,
      maxLimit: MAX_PLATFORMS_LIMIT,
      limit,
      offset,
      pageSize: platforms.length,
      totalCount: filteredPlatforms.length,
    }),
    platforms,
  };
};
