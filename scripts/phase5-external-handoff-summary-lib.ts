import {
  dedupePhase5ExternalHandoffValues,
  type Phase5ExternalHandoffSummary,
  type SummarizePhase5ExternalHandoffParams,
} from './phase5-external-handoff-contract';
import {
  collectPhase5ExternalHandoffArtifactFindings,
  collectPhase5ExternalHandoffMissingInputs,
  collectPhase5ExternalHandoffVerdictBlockers,
  collectPhase5ExternalHandoffVerdictWarnings,
  resolvePhase5ExternalHandoffSummaryVerdict,
} from './phase5-external-handoff-summary-helpers-lib';

export const summarizePhase5ExternalHandoff = (
  params: SummarizePhase5ExternalHandoffParams
): Phase5ExternalHandoffSummary => {
  const missingInputs = collectPhase5ExternalHandoffMissingInputs(params);
  const blockers =
    missingInputs.length === 0 ? collectPhase5ExternalHandoffVerdictBlockers(params) : [];
  const warnings =
    missingInputs.length === 0 ? collectPhase5ExternalHandoffVerdictWarnings(params) : [];
  const artifactFindings = collectPhase5ExternalHandoffArtifactFindings(params);
  blockers.push(...artifactFindings.blockers);
  warnings.push(...artifactFindings.warnings);
  const verdict = resolvePhase5ExternalHandoffSummaryVerdict({
    missingInputs,
    blockers,
  });

  return {
    verdict,
    blockers: dedupePhase5ExternalHandoffValues(blockers),
    missingInputs: dedupePhase5ExternalHandoffValues(missingInputs),
    warnings: dedupePhase5ExternalHandoffValues(warnings),
    phase5StatusVerdict: params.phase5StatusVerdict,
    phase5BlockersVerdict: params.phase5BlockersVerdict,
    consumerUnblockVerdict: params.consumerUnblockVerdict,
    mockAbVerdict: params.mockAbVerdict,
    runReportVerdict: params.runReportVerdict,
    artifactUrls: dedupePhase5ExternalHandoffValues(params.artifactUrls),
    requireArtifactUrls: params.requireArtifactUrls,
    requireMockAbReport: params.requireMockAbReport,
  };
};
