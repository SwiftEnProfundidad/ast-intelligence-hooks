import type { AiEvidenceV2_1 } from '../evidence/schema';
import {
  toSuppressedShareDirection,
  toSuppressedShareDirectionCode,
  toSuppressedShareDirectionConfidence,
  toSuppressedShareDirectionLabel,
  toSuppressedShareDirectionStrengthBucket,
  toSuppressedShareDirectionTriageHint,
} from './evidenceFacetsSuppressedShareCore';

export const toSuppressedShareDirectionPriorityScore = (evidence: AiEvidenceV2_1): number => {
  const confidence = toSuppressedShareDirectionConfidence(evidence);
  const direction = toSuppressedShareDirection(evidence);
  if (direction === 'balanced') {
    return 0;
  }
  return Number(confidence.toFixed(2));
};

export const toSuppressedShareTriageSummary = (evidence: AiEvidenceV2_1): string => {
  const label = toSuppressedShareDirectionLabel(evidence);
  const bucket = toSuppressedShareDirectionStrengthBucket(evidence);
  const priorityScore = toSuppressedShareDirectionPriorityScore(evidence);
  const triageHint = toSuppressedShareDirectionTriageHint(evidence);
  return `${label} | ${bucket} | priority ${priorityScore} | ${triageHint}`;
};

export const toSuppressedShareTriageDigest = (evidence: AiEvidenceV2_1): string => {
  const directionCode = toSuppressedShareDirectionCode(evidence);
  const bucket = toSuppressedShareDirectionStrengthBucket(evidence);
  const priorityScore = toSuppressedShareDirectionPriorityScore(evidence);
  return `${directionCode}:${bucket}:${priorityScore}`;
};

export const toSuppressedShareTriageAction = (evidence: AiEvidenceV2_1): string => {
  const direction = toSuppressedShareDirection(evidence);
  const confidence = toSuppressedShareDirectionConfidence(evidence);
  if (direction === 'balanced') {
    return 'review_both_paths';
  }
  if (direction === 'replacement') {
    return confidence >= 66.67
      ? 'review_replacement_first'
      : 'review_replacement_then_non_replacement';
  }
  return confidence >= 66.67
    ? 'review_non_replacement_first'
    : 'review_non_replacement_then_replacement';
};

export const toSuppressedShareTriagePlaybook = (evidence: AiEvidenceV2_1): string => {
  const action = toSuppressedShareTriageAction(evidence);
  if (action === 'review_replacement_first') {
    return 'review_replacement_rules>validate_replacements>check_non_replacement_fallbacks';
  }
  if (action === 'review_replacement_then_non_replacement') {
    return 'review_replacement_rules>review_non_replacement_paths>validate_balance_delta';
  }
  if (action === 'review_non_replacement_first') {
    return 'review_non_replacement_paths>validate_suppression_justification>check_replacement_rules';
  }
  if (action === 'review_non_replacement_then_replacement') {
    return 'review_non_replacement_paths>review_replacement_rules>validate_balance_delta';
  }
  return 'review_replacement_rules>review_non_replacement_paths>validate_balance_delta';
};

export const toSuppressedShareTriagePriorityBand = (
  evidence: AiEvidenceV2_1,
): 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' => {
  const score = toSuppressedShareDirectionPriorityScore(evidence);
  if (score <= 0) {
    return 'NONE';
  }
  if (score >= 80) {
    return 'HIGH';
  }
  if (score >= 50) {
    return 'MEDIUM';
  }
  return 'LOW';
};

export const toSuppressedShareTriageOrder = (evidence: AiEvidenceV2_1): string => {
  const action = toSuppressedShareTriageAction(evidence);
  if (action === 'review_replacement_first') {
    return 'replacement>non_replacement';
  }
  if (action === 'review_replacement_then_non_replacement') {
    return 'replacement>non_replacement';
  }
  if (action === 'review_non_replacement_first') {
    return 'non_replacement>replacement';
  }
  if (action === 'review_non_replacement_then_replacement') {
    return 'non_replacement>replacement';
  }
  return 'replacement=non_replacement';
};

export const toSuppressedShareTriagePrimarySide = (
  evidence: AiEvidenceV2_1,
): 'replacement' | 'non_replacement' | 'balanced' => {
  return toSuppressedShareDirection(evidence);
};

export const toSuppressedShareTriageSecondarySide = (
  evidence: AiEvidenceV2_1,
): 'replacement' | 'non_replacement' | 'balanced' => {
  const primarySide = toSuppressedShareTriagePrimarySide(evidence);
  if (primarySide === 'replacement') {
    return 'non_replacement';
  }
  if (primarySide === 'non_replacement') {
    return 'replacement';
  }
  return 'balanced';
};

export const toSuppressedShareTriageSidePair = (evidence: AiEvidenceV2_1): string => {
  const primarySide = toSuppressedShareTriagePrimarySide(evidence);
  const secondarySide = toSuppressedShareTriageSecondarySide(evidence);
  if (primarySide === 'balanced' && secondarySide === 'balanced') {
    return 'balanced=balanced';
  }
  return `${primarySide}>${secondarySide}`;
};

export const toSuppressedShareTriageSideAlignment = (
  evidence: AiEvidenceV2_1,
): 'balanced' | 'same' | 'opposed' => {
  const primarySide = toSuppressedShareTriagePrimarySide(evidence);
  const secondarySide = toSuppressedShareTriageSecondarySide(evidence);
  if (primarySide === 'balanced' && secondarySide === 'balanced') {
    return 'balanced';
  }
  if (primarySide === secondarySide) {
    return 'same';
  }
  return 'opposed';
};

export const toSuppressedShareTriageFocusTarget = (evidence: AiEvidenceV2_1): string => {
  const primarySide = toSuppressedShareTriagePrimarySide(evidence);
  if (primarySide === 'replacement') {
    return 'replacement_rules';
  }
  if (primarySide === 'non_replacement') {
    return 'non_replacement_paths';
  }
  return 'both_paths';
};

export const toSuppressedShareTriageFocusOrder = (evidence: AiEvidenceV2_1): string => {
  const focusTarget = toSuppressedShareTriageFocusTarget(evidence);
  if (focusTarget === 'replacement_rules') {
    return 'replacement_rules>non_replacement_paths';
  }
  if (focusTarget === 'non_replacement_paths') {
    return 'non_replacement_paths>replacement_rules';
  }
  return 'replacement_rules=non_replacement_paths';
};

export const toSuppressedShareTriageFocusMode = (
  evidence: AiEvidenceV2_1,
): 'single' | 'dual' => {
  const focusTarget = toSuppressedShareTriageFocusTarget(evidence);
  if (focusTarget === 'both_paths') {
    return 'dual';
  }
  return 'single';
};

export const toSuppressedShareTriageIntensity = (evidence: AiEvidenceV2_1): number => {
  const priorityScore = toSuppressedShareDirectionPriorityScore(evidence);
  if (priorityScore <= 0) {
    return 0;
  }
  const focusMode = toSuppressedShareTriageFocusMode(evidence);
  const multiplier = focusMode === 'dual' ? 0.5 : 1;
  return Number((priorityScore * multiplier).toFixed(2));
};

export const toSuppressedShareTriageLane = (evidence: AiEvidenceV2_1): string => {
  const priorityBand = toSuppressedShareTriagePriorityBand(evidence);
  const primarySide = toSuppressedShareTriagePrimarySide(evidence);
  if (priorityBand === 'NONE') {
    return 'watch_lane';
  }
  if (primarySide === 'balanced') {
    return `balanced_${priorityBand.toLowerCase()}_lane`;
  }
  if (primarySide === 'replacement') {
    return priorityBand === 'HIGH' ? 'replacement_fast_lane' : 'replacement_standard_lane';
  }
  return priorityBand === 'HIGH'
    ? 'non_replacement_fast_lane'
    : 'non_replacement_standard_lane';
};

export const toSuppressedShareTriageRoute = (evidence: AiEvidenceV2_1): string => {
  const lane = toSuppressedShareTriageLane(evidence);
  if (lane === 'watch_lane') {
    return 'watch_lane:observe';
  }
  const focusOrder = toSuppressedShareTriageFocusOrder(evidence);
  return `${lane}:${focusOrder}`;
};

export const toSuppressedShareTriageChannel = (
  evidence: AiEvidenceV2_1,
): 'watch' | 'balanced' | 'fast' | 'standard' => {
  const lane = toSuppressedShareTriageLane(evidence);
  if (lane === 'watch_lane') {
    return 'watch';
  }
  if (lane.startsWith('balanced_')) {
    return 'balanced';
  }
  if (lane.endsWith('_fast_lane')) {
    return 'fast';
  }
  return 'standard';
};

export const toSuppressedShareTriageTrack = (evidence: AiEvidenceV2_1): string => {
  const channel = toSuppressedShareTriageChannel(evidence);
  if (channel === 'watch') {
    return 'monitor_track';
  }
  if (channel === 'balanced') {
    return 'balanced_track';
  }
  const primarySide = toSuppressedShareTriagePrimarySide(evidence);
  if (primarySide === 'replacement') {
    return channel === 'fast' ? 'replacement_fast_track' : 'replacement_standard_track';
  }
  if (primarySide === 'non_replacement') {
    return channel === 'fast'
      ? 'non_replacement_fast_track'
      : 'non_replacement_standard_track';
  }
  return 'balanced_track';
};

export const toSuppressedShareTriageStream = (evidence: AiEvidenceV2_1): string => {
  const track = toSuppressedShareTriageTrack(evidence);
  if (track === 'monitor_track') {
    return 'observation_stream';
  }
  if (track === 'balanced_track') {
    return 'balanced_stream';
  }
  if (track === 'replacement_fast_track') {
    return 'replacement_priority_stream';
  }
  if (track === 'non_replacement_fast_track') {
    return 'non_replacement_priority_stream';
  }
  if (track === 'replacement_standard_track') {
    return 'replacement_standard_stream';
  }
  return 'non_replacement_standard_stream';
};

export const toSuppressedShareTriageStreamClass = (
  evidence: AiEvidenceV2_1,
): 'observation' | 'balanced' | 'priority' | 'standard' => {
  const stream = toSuppressedShareTriageStream(evidence);
  if (stream === 'observation_stream') {
    return 'observation';
  }
  if (stream === 'balanced_stream') {
    return 'balanced';
  }
  if (stream.endsWith('_priority_stream')) {
    return 'priority';
  }
  return 'standard';
};

export const toSuppressedShareTriageStreamRank = (
  evidence: AiEvidenceV2_1,
): 0 | 1 | 2 | 3 => {
  const streamClass = toSuppressedShareTriageStreamClass(evidence);
  if (streamClass === 'observation') {
    return 0;
  }
  if (streamClass === 'balanced') {
    return 1;
  }
  if (streamClass === 'standard') {
    return 2;
  }
  return 3;
};

export const toSuppressedShareTriageStreamScore = (evidence: AiEvidenceV2_1): number => {
  const rank = toSuppressedShareTriageStreamRank(evidence);
  return Number(((rank / 3) * 100).toFixed(2));
};

export const toSuppressedShareTriageStreamScoreBand = (
  evidence: AiEvidenceV2_1,
): 'LOW' | 'MEDIUM' | 'HIGH' => {
  const score = toSuppressedShareTriageStreamScore(evidence);
  if (score >= 80) {
    return 'HIGH';
  }
  if (score >= 40) {
    return 'MEDIUM';
  }
  return 'LOW';
};

export const toSuppressedShareTriageStreamSignal = (evidence: AiEvidenceV2_1): string => {
  const streamClass = toSuppressedShareTriageStreamClass(evidence);
  const scoreBand = toSuppressedShareTriageStreamScoreBand(evidence);
  return `${streamClass}:${scoreBand}`;
};

export const toSuppressedShareTriageStreamSignalCode = (evidence: AiEvidenceV2_1): string => {
  const streamClass = toSuppressedShareTriageStreamClass(evidence);
  const scoreBand = toSuppressedShareTriageStreamScoreBand(evidence);
  const classCode = (() => {
    if (streamClass === 'observation') {
      return 'OBS';
    }
    if (streamClass === 'balanced') {
      return 'BAL';
    }
    if (streamClass === 'priority') {
      return 'PRI';
    }
    return 'STD';
  })();
  const bandCode = scoreBand === 'HIGH' ? 'H' : scoreBand === 'MEDIUM' ? 'M' : 'L';
  return `${classCode}-${bandCode}`;
};

export const toSuppressedShareTriageStreamSignalFamily = (evidence: AiEvidenceV2_1): string => {
  const streamClass = toSuppressedShareTriageStreamClass(evidence);
  if (streamClass === 'observation') {
    return 'observation_family';
  }
  if (streamClass === 'balanced') {
    return 'balanced_family';
  }
  if (streamClass === 'priority') {
    return 'priority_family';
  }
  return 'standard_family';
};

export const toSuppressedShareTriageStreamSignalFamilyCode = (evidence: AiEvidenceV2_1): string => {
  const family = toSuppressedShareTriageStreamSignalFamily(evidence);
  if (family === 'observation_family') {
    return 'OBS_FAM';
  }
  if (family === 'balanced_family') {
    return 'BAL_FAM';
  }
  if (family === 'priority_family') {
    return 'PRI_FAM';
  }
  return 'STD_FAM';
};

export const toSuppressedShareTriageStreamSignalFamilyRank = (
  evidence: AiEvidenceV2_1,
): 0 | 1 | 2 | 3 => {
  const family = toSuppressedShareTriageStreamSignalFamily(evidence);
  if (family === 'observation_family') {
    return 0;
  }
  if (family === 'balanced_family') {
    return 1;
  }
  if (family === 'standard_family') {
    return 2;
  }
  return 3;
};

export const toSuppressedShareTriageStreamSignalFamilyWeight = (
  evidence: AiEvidenceV2_1,
): number => {
  const rank = toSuppressedShareTriageStreamSignalFamilyRank(evidence);
  return Number(((rank / 3) * 100).toFixed(2));
};

export const toSuppressedShareTriageStreamSignalFamilyBucket = (
  evidence: AiEvidenceV2_1,
): 'LOW' | 'MEDIUM' | 'HIGH' => {
  const weight = toSuppressedShareTriageStreamSignalFamilyWeight(evidence);
  if (weight >= 80) {
    return 'HIGH';
  }
  if (weight >= 40) {
    return 'MEDIUM';
  }
  return 'LOW';
};

export const toSuppressedShareTriageStreamSignalFamilyDigest = (evidence: AiEvidenceV2_1): string => {
  const familyCode = toSuppressedShareTriageStreamSignalFamilyCode(evidence);
  const bucket = toSuppressedShareTriageStreamSignalFamilyBucket(evidence);
  return `${familyCode}:${bucket}`;
};

export const toSuppressedShareTriageStreamSignalFamilyDigestCode = (
  evidence: AiEvidenceV2_1,
): string => {
  const familyCode = toSuppressedShareTriageStreamSignalFamilyCode(evidence);
  const bucket = toSuppressedShareTriageStreamSignalFamilyBucket(evidence);
  return `${familyCode}_${bucket}`;
};

export const toSuppressedShareTriageStreamSignalFamilyTrace = (evidence: AiEvidenceV2_1): string => {
  const digestCode = toSuppressedShareTriageStreamSignalFamilyDigestCode(evidence);
  const route = toSuppressedShareTriageRoute(evidence);
  return `${digestCode}@${route}`;
};

export const toSuppressedShareTriageStreamSignalFamilyTraceCode = (
  evidence: AiEvidenceV2_1,
): string => {
  const trace = toSuppressedShareTriageStreamSignalFamilyTrace(evidence);
  return trace
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

export const toSuppressedShareTriageStreamSignalFamilyTraceHash = (
  evidence: AiEvidenceV2_1,
): string => {
  const trace = toSuppressedShareTriageStreamSignalFamilyTrace(evidence);
  let hash = 0x811c9dc5;
  for (const character of trace) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).toUpperCase().padStart(8, '0');
};

export const toSuppressedShareTriageStreamSignalFamilyTraceHashCode = (
  evidence: AiEvidenceV2_1,
): string => {
  const traceHash = toSuppressedShareTriageStreamSignalFamilyTraceHash(evidence);
  return `TRACE_HASH_${traceHash}`;
};

export const toSuppressedShareTriageStreamSignalFamilyTraceHashBucket = (
  evidence: AiEvidenceV2_1,
): 'LOW' | 'MEDIUM' | 'HIGH' => {
  const traceHash = toSuppressedShareTriageStreamSignalFamilyTraceHash(evidence);
  const leadByte = Number.parseInt(traceHash.slice(0, 2), 16);
  if (leadByte >= 170) {
    return 'HIGH';
  }
  if (leadByte >= 85) {
    return 'MEDIUM';
  }
  return 'LOW';
};

export const toSuppressedShareTriageStreamSignalFamilyTraceHashRank = (
  evidence: AiEvidenceV2_1,
): 0 | 1 | 2 => {
  const bucket = toSuppressedShareTriageStreamSignalFamilyTraceHashBucket(evidence);
  if (bucket === 'HIGH') {
    return 2;
  }
  if (bucket === 'MEDIUM') {
    return 1;
  }
  return 0;
};

export const toSuppressedShareTriageStreamSignalFamilyTraceHashWeight = (
  evidence: AiEvidenceV2_1,
): number => {
  const rank = toSuppressedShareTriageStreamSignalFamilyTraceHashRank(evidence);
  return Number(((rank / 2) * 100).toFixed(2));
};
