import type { AiEvidenceV2_1 } from '../evidence/schema';
import { sortSnapshotFindings } from './evidencePayloadCollectionsSorters';
import {
  includeSuppressedFromQuery,
} from './evidencePayloadConfig';
export { toRulesetsPayload } from './evidencePayloadCollectionsRulesets';
export { toPlatformsPayload } from './evidencePayloadCollectionsPlatforms';
export {
  toLedgerPayload,
  toLedgerPayloadWithFilters,
} from './evidencePayloadCollectionsLedger';
export { toFindingsPayload } from './evidencePayloadCollectionsFindings';

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

export const toResponsePayload = (evidence: AiEvidenceV2_1, requestUrl: URL): unknown => {
  if (includeSuppressedFromQuery(requestUrl)) {
    return evidence;
  }
  const { consolidation: _ignored, ...rest } = evidence;
  return rest;
};
