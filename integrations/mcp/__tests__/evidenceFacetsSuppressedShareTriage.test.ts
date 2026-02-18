import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import {
  toSuppressedShareDirectionPriorityScore,
  toSuppressedShareTriageAction,
  toSuppressedShareTriageChannel,
  toSuppressedShareTriageDigest,
  toSuppressedShareTriageFocusMode,
  toSuppressedShareTriageFocusOrder,
  toSuppressedShareTriageFocusTarget,
  toSuppressedShareTriageIntensity,
  toSuppressedShareTriageLane,
  toSuppressedShareTriageOrder,
  toSuppressedShareTriagePlaybook,
  toSuppressedShareTriagePrimarySide,
  toSuppressedShareTriagePriorityBand,
  toSuppressedShareTriageRoute,
  toSuppressedShareTriageSecondarySide,
  toSuppressedShareTriageSideAlignment,
  toSuppressedShareTriageSidePair,
  toSuppressedShareTriageStream,
  toSuppressedShareTriageStreamClass,
  toSuppressedShareTriageStreamRank,
  toSuppressedShareTriageStreamScore,
  toSuppressedShareTriageStreamScoreBand,
  toSuppressedShareTriageStreamSignal,
  toSuppressedShareTriageStreamSignalCode,
  toSuppressedShareTriageStreamSignalFamily,
  toSuppressedShareTriageStreamSignalFamilyBucket,
  toSuppressedShareTriageStreamSignalFamilyCode,
  toSuppressedShareTriageStreamSignalFamilyDigest,
  toSuppressedShareTriageStreamSignalFamilyDigestCode,
  toSuppressedShareTriageStreamSignalFamilyRank,
  toSuppressedShareTriageStreamSignalFamilyTrace,
  toSuppressedShareTriageStreamSignalFamilyTraceCode,
  toSuppressedShareTriageStreamSignalFamilyTraceHash,
  toSuppressedShareTriageStreamSignalFamilyTraceHashBucket,
  toSuppressedShareTriageStreamSignalFamilyTraceHashCode,
  toSuppressedShareTriageStreamSignalFamilyTraceHashRank,
  toSuppressedShareTriageStreamSignalFamilyTraceHashWeight,
  toSuppressedShareTriageStreamSignalFamilyWeight,
  toSuppressedShareTriageSummary,
  toSuppressedShareTriageTrack,
} from '../evidenceFacetsSuppressedShareTriage';

const createEvidence = (replacementCount: number, nonReplacementCount: number): AiEvidenceV2_1 => {
  const replacementSuppressed = Array.from({ length: replacementCount }, (_, index) => ({
    ruleId: `rule-r-${index}`,
    file: `apps/backend/src/r${index}.ts`,
    replacedByRuleId: `replacement-r-${index}`,
    replacementRuleId: `replacement-r-${index}`,
    platform: 'backend',
    reason: 'replacement',
  }));

  const nonReplacementSuppressed = Array.from({ length: nonReplacementCount }, (_, index) => ({
    ruleId: `rule-n-${index}`,
    file: `apps/ios/App${index}.swift`,
    replacedByRuleId: '',
    replacementRuleId: null,
    platform: 'ios',
    reason: 'non_replacement',
  }));

  return {
    version: '2.1',
    timestamp: '2026-02-19T08:00:00.000Z',
    snapshot: {
      stage: 'PRE_COMMIT',
      outcome: 'FAIL',
      findings: [],
    },
    ledger: [],
    platforms: {},
    rulesets: [],
    human_intent: null,
    ai_gate: {
      status: 'BLOCKED',
      violations: [],
      human_intent: null,
    },
    severity_metrics: {
      gate_status: 'BLOCKED',
      total_violations: 0,
      by_severity: {
        CRITICAL: 0,
        ERROR: 0,
        WARN: 0,
        INFO: 0,
      },
    },
    consolidation: {
      suppressed: [...replacementSuppressed, ...nonReplacementSuppressed],
    },
  };
};

test('suppressed share triage calcula acciones/rutas por polaridad y fuerza', () => {
  const replacementLow = createEvidence(2, 1);
  assert.equal(toSuppressedShareDirectionPriorityScore(replacementLow), 33.34);
  assert.equal(
    toSuppressedShareTriageSummary(replacementLow),
    'Replacement Dominant | MEDIUM | priority 33.34 | Replacement-leaning suppression; review replacement paths before non-replacement.'
  );
  assert.equal(toSuppressedShareTriageDigest(replacementLow), 'R:MEDIUM:33.34');
  assert.equal(toSuppressedShareTriageAction(replacementLow), 'review_replacement_then_non_replacement');
  assert.equal(
    toSuppressedShareTriagePlaybook(replacementLow),
    'review_replacement_rules>review_non_replacement_paths>validate_balance_delta'
  );
  assert.equal(toSuppressedShareTriagePriorityBand(replacementLow), 'LOW');
  assert.equal(toSuppressedShareTriageOrder(replacementLow), 'replacement>non_replacement');
  assert.equal(toSuppressedShareTriagePrimarySide(replacementLow), 'replacement');
  assert.equal(toSuppressedShareTriageSecondarySide(replacementLow), 'non_replacement');
  assert.equal(toSuppressedShareTriageSidePair(replacementLow), 'replacement>non_replacement');
  assert.equal(toSuppressedShareTriageSideAlignment(replacementLow), 'opposed');
  assert.equal(toSuppressedShareTriageFocusTarget(replacementLow), 'replacement_rules');
  assert.equal(
    toSuppressedShareTriageFocusOrder(replacementLow),
    'replacement_rules>non_replacement_paths'
  );
  assert.equal(toSuppressedShareTriageFocusMode(replacementLow), 'single');
  assert.equal(toSuppressedShareTriageIntensity(replacementLow), 33.34);
  assert.equal(toSuppressedShareTriageLane(replacementLow), 'replacement_standard_lane');
  assert.equal(
    toSuppressedShareTriageRoute(replacementLow),
    'replacement_standard_lane:replacement_rules>non_replacement_paths'
  );
  assert.equal(toSuppressedShareTriageChannel(replacementLow), 'standard');
  assert.equal(toSuppressedShareTriageTrack(replacementLow), 'replacement_standard_track');
  assert.equal(toSuppressedShareTriageStream(replacementLow), 'replacement_standard_stream');

  const replacementHigh = createEvidence(3, 0);
  assert.equal(toSuppressedShareDirectionPriorityScore(replacementHigh), 100);
  assert.equal(toSuppressedShareTriageAction(replacementHigh), 'review_replacement_first');
  assert.equal(
    toSuppressedShareTriagePlaybook(replacementHigh),
    'review_replacement_rules>validate_replacements>check_non_replacement_fallbacks'
  );
  assert.equal(toSuppressedShareTriagePriorityBand(replacementHigh), 'HIGH');
  assert.equal(toSuppressedShareTriageLane(replacementHigh), 'replacement_fast_lane');
  assert.equal(toSuppressedShareTriageChannel(replacementHigh), 'fast');
  assert.equal(toSuppressedShareTriageTrack(replacementHigh), 'replacement_fast_track');
  assert.equal(toSuppressedShareTriageStream(replacementHigh), 'replacement_priority_stream');

  const nonReplacementLow = createEvidence(1, 2);
  assert.equal(toSuppressedShareDirectionPriorityScore(nonReplacementLow), 33.34);
  assert.equal(
    toSuppressedShareTriageAction(nonReplacementLow),
    'review_non_replacement_then_replacement'
  );
  assert.equal(
    toSuppressedShareTriagePlaybook(nonReplacementLow),
    'review_non_replacement_paths>review_replacement_rules>validate_balance_delta'
  );
  assert.equal(toSuppressedShareTriagePriorityBand(nonReplacementLow), 'LOW');
  assert.equal(toSuppressedShareTriageLane(nonReplacementLow), 'non_replacement_standard_lane');
  assert.equal(toSuppressedShareTriageChannel(nonReplacementLow), 'standard');
  assert.equal(toSuppressedShareTriageTrack(nonReplacementLow), 'non_replacement_standard_track');
  assert.equal(
    toSuppressedShareTriageStream(nonReplacementLow),
    'non_replacement_standard_stream'
  );

  const nonReplacementHigh = createEvidence(0, 3);
  assert.equal(toSuppressedShareDirectionPriorityScore(nonReplacementHigh), 100);
  assert.equal(toSuppressedShareTriageAction(nonReplacementHigh), 'review_non_replacement_first');
  assert.equal(
    toSuppressedShareTriagePlaybook(nonReplacementHigh),
    'review_non_replacement_paths>validate_suppression_justification>check_replacement_rules'
  );
  assert.equal(toSuppressedShareTriagePriorityBand(nonReplacementHigh), 'HIGH');
  assert.equal(toSuppressedShareTriageLane(nonReplacementHigh), 'non_replacement_fast_lane');
  assert.equal(toSuppressedShareTriageChannel(nonReplacementHigh), 'fast');
  assert.equal(toSuppressedShareTriageTrack(nonReplacementHigh), 'non_replacement_fast_track');
  assert.equal(
    toSuppressedShareTriageStream(nonReplacementHigh),
    'non_replacement_priority_stream'
  );

  const balanced = createEvidence(1, 1);
  assert.equal(toSuppressedShareDirectionPriorityScore(balanced), 0);
  assert.equal(
    toSuppressedShareTriageSummary(balanced),
    'Balanced | LOW | priority 0 | Balanced suppression split; inspect replacement and non-replacement paths equally.'
  );
  assert.equal(toSuppressedShareTriageDigest(balanced), 'B:LOW:0');
  assert.equal(toSuppressedShareTriageAction(balanced), 'review_both_paths');
  assert.equal(
    toSuppressedShareTriagePlaybook(balanced),
    'review_replacement_rules>review_non_replacement_paths>validate_balance_delta'
  );
  assert.equal(toSuppressedShareTriagePriorityBand(balanced), 'NONE');
  assert.equal(toSuppressedShareTriageOrder(balanced), 'replacement=non_replacement');
  assert.equal(toSuppressedShareTriagePrimarySide(balanced), 'balanced');
  assert.equal(toSuppressedShareTriageSecondarySide(balanced), 'balanced');
  assert.equal(toSuppressedShareTriageSidePair(balanced), 'balanced=balanced');
  assert.equal(toSuppressedShareTriageSideAlignment(balanced), 'balanced');
  assert.equal(toSuppressedShareTriageFocusTarget(balanced), 'both_paths');
  assert.equal(
    toSuppressedShareTriageFocusOrder(balanced),
    'replacement_rules=non_replacement_paths'
  );
  assert.equal(toSuppressedShareTriageFocusMode(balanced), 'dual');
  assert.equal(toSuppressedShareTriageIntensity(balanced), 0);
  assert.equal(toSuppressedShareTriageLane(balanced), 'watch_lane');
  assert.equal(toSuppressedShareTriageRoute(balanced), 'watch_lane:observe');
  assert.equal(toSuppressedShareTriageChannel(balanced), 'watch');
  assert.equal(toSuppressedShareTriageTrack(balanced), 'monitor_track');
  assert.equal(toSuppressedShareTriageStream(balanced), 'observation_stream');
});

test('suppressed share triage calcula señal de stream y familia determinista', () => {
  const replacementLow = createEvidence(2, 1);
  assert.equal(toSuppressedShareTriageStreamClass(replacementLow), 'standard');
  assert.equal(toSuppressedShareTriageStreamRank(replacementLow), 2);
  assert.equal(toSuppressedShareTriageStreamScore(replacementLow), 66.67);
  assert.equal(toSuppressedShareTriageStreamScoreBand(replacementLow), 'MEDIUM');
  assert.equal(toSuppressedShareTriageStreamSignal(replacementLow), 'standard:MEDIUM');
  assert.equal(toSuppressedShareTriageStreamSignalCode(replacementLow), 'STD-M');
  assert.equal(toSuppressedShareTriageStreamSignalFamily(replacementLow), 'standard_family');
  assert.equal(toSuppressedShareTriageStreamSignalFamilyCode(replacementLow), 'STD_FAM');
  assert.equal(toSuppressedShareTriageStreamSignalFamilyRank(replacementLow), 2);
  assert.equal(toSuppressedShareTriageStreamSignalFamilyWeight(replacementLow), 66.67);
  assert.equal(toSuppressedShareTriageStreamSignalFamilyBucket(replacementLow), 'MEDIUM');
  assert.equal(toSuppressedShareTriageStreamSignalFamilyDigest(replacementLow), 'STD_FAM:MEDIUM');
  assert.equal(
    toSuppressedShareTriageStreamSignalFamilyDigestCode(replacementLow),
    'STD_FAM_MEDIUM'
  );

  const replacementHigh = createEvidence(3, 0);
  assert.equal(toSuppressedShareTriageStreamClass(replacementHigh), 'priority');
  assert.equal(toSuppressedShareTriageStreamRank(replacementHigh), 3);
  assert.equal(toSuppressedShareTriageStreamScore(replacementHigh), 100);
  assert.equal(toSuppressedShareTriageStreamScoreBand(replacementHigh), 'HIGH');
  assert.equal(toSuppressedShareTriageStreamSignal(replacementHigh), 'priority:HIGH');
  assert.equal(toSuppressedShareTriageStreamSignalCode(replacementHigh), 'PRI-H');
  assert.equal(toSuppressedShareTriageStreamSignalFamily(replacementHigh), 'priority_family');
  assert.equal(toSuppressedShareTriageStreamSignalFamilyCode(replacementHigh), 'PRI_FAM');
  assert.equal(toSuppressedShareTriageStreamSignalFamilyRank(replacementHigh), 3);
  assert.equal(toSuppressedShareTriageStreamSignalFamilyWeight(replacementHigh), 100);
  assert.equal(toSuppressedShareTriageStreamSignalFamilyBucket(replacementHigh), 'HIGH');
  assert.equal(toSuppressedShareTriageStreamSignalFamilyDigest(replacementHigh), 'PRI_FAM:HIGH');
  assert.equal(
    toSuppressedShareTriageStreamSignalFamilyDigestCode(replacementHigh),
    'PRI_FAM_HIGH'
  );

  const balanced = createEvidence(1, 1);
  assert.equal(toSuppressedShareTriageStreamClass(balanced), 'observation');
  assert.equal(toSuppressedShareTriageStreamRank(balanced), 0);
  assert.equal(toSuppressedShareTriageStreamScore(balanced), 0);
  assert.equal(toSuppressedShareTriageStreamScoreBand(balanced), 'LOW');
  assert.equal(toSuppressedShareTriageStreamSignal(balanced), 'observation:LOW');
  assert.equal(toSuppressedShareTriageStreamSignalCode(balanced), 'OBS-L');
  assert.equal(toSuppressedShareTriageStreamSignalFamily(balanced), 'observation_family');
  assert.equal(toSuppressedShareTriageStreamSignalFamilyCode(balanced), 'OBS_FAM');
  assert.equal(toSuppressedShareTriageStreamSignalFamilyRank(balanced), 0);
  assert.equal(toSuppressedShareTriageStreamSignalFamilyWeight(balanced), 0);
  assert.equal(toSuppressedShareTriageStreamSignalFamilyBucket(balanced), 'LOW');
  assert.equal(toSuppressedShareTriageStreamSignalFamilyDigest(balanced), 'OBS_FAM:LOW');
  assert.equal(toSuppressedShareTriageStreamSignalFamilyDigestCode(balanced), 'OBS_FAM_LOW');
});

test('suppressed share triage deriva trazas/hash y mantiene mapeo bucket/rank/weight', () => {
  const scenarios = [createEvidence(2, 1), createEvidence(3, 0), createEvidence(1, 1)];
  const rankByBucket: Record<'LOW' | 'MEDIUM' | 'HIGH', 0 | 1 | 2> = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
  };

  for (const evidence of scenarios) {
    const trace = toSuppressedShareTriageStreamSignalFamilyTrace(evidence);
    const traceCode = toSuppressedShareTriageStreamSignalFamilyTraceCode(evidence);
    const traceHash = toSuppressedShareTriageStreamSignalFamilyTraceHash(evidence);
    const traceHashCode = toSuppressedShareTriageStreamSignalFamilyTraceHashCode(evidence);
    const bucket = toSuppressedShareTriageStreamSignalFamilyTraceHashBucket(evidence);
    const rank = toSuppressedShareTriageStreamSignalFamilyTraceHashRank(evidence);
    const weight = toSuppressedShareTriageStreamSignalFamilyTraceHashWeight(evidence);

    assert.ok(trace.includes('@'));
    assert.match(traceCode, /^[A-Z0-9_]+$/);
    assert.match(traceHash, /^[0-9A-F]{8}$/);
    assert.equal(traceHashCode, `TRACE_HASH_${traceHash}`);
    assert.equal(rank, rankByBucket[bucket]);
    assert.equal(weight, Number(((rank / 2) * 100).toFixed(2)));
  }
});
