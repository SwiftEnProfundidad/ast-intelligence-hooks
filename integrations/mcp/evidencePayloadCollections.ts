import type { AiEvidenceV2_1 } from '../evidence/schema';
import { includeSuppressedFromQuery } from './evidencePayloadConfig';
import { sortSnapshotFindings } from './evidencePayloadCollectionsSorters';
export { toFindingsPayload } from './evidencePayloadCollectionsFindings';
export { toPlatformsPayload } from './evidencePayloadCollectionsPlatforms';
export {
  toLedgerPayload,
  toLedgerPayloadWithFilters,
} from './evidencePayloadCollectionsLedger';
export { toRulesetsPayload } from './evidencePayloadCollectionsRulesets';

export {
  inferFindingPlatform,
  sortLedger,
  sortSnapshotFindings,
} from './evidencePayloadCollectionsSorters';

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
