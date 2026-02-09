import type { Phase5ExternalHandoffSummary } from './phase5-external-handoff-contract';
import { dedupePhase5ExternalHandoffValues } from './phase5-external-handoff-contract';

export const summarizePhase5ExternalHandoff = (params: {
  hasPhase5StatusReport: boolean;
  hasPhase5BlockersReport: boolean;
  hasConsumerUnblockReport: boolean;
  hasMockAbReport: boolean;
  hasRunReport: boolean;
  phase5StatusVerdict?: string;
  phase5BlockersVerdict?: string;
  consumerUnblockVerdict?: string;
  mockAbVerdict?: string;
  runReportVerdict?: string;
  artifactUrls: ReadonlyArray<string>;
  requireArtifactUrls: boolean;
  requireMockAbReport: boolean;
}): Phase5ExternalHandoffSummary => {
  const missingInputs: string[] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!params.hasPhase5StatusReport) {
    missingInputs.push('Missing Phase 5 execution closure status report');
  }
  if (!params.hasPhase5BlockersReport) {
    missingInputs.push('Missing Phase 5 blockers readiness report');
  }
  if (!params.hasConsumerUnblockReport) {
    missingInputs.push('Missing consumer startup unblock status report');
  }
  if (params.requireMockAbReport && !params.hasMockAbReport) {
    missingInputs.push('Missing mock consumer A/B report');
  }

  if (missingInputs.length === 0) {
    if ((params.phase5StatusVerdict ?? '').toUpperCase() !== 'READY') {
      blockers.push(
        `Phase 5 execution closure status verdict is ${params.phase5StatusVerdict ?? 'unknown'}`
      );
    }
    if ((params.phase5BlockersVerdict ?? '').toUpperCase() !== 'READY') {
      blockers.push(
        `Phase 5 blockers readiness verdict is ${params.phase5BlockersVerdict ?? 'unknown'}`
      );
    }
    if ((params.consumerUnblockVerdict ?? '').toUpperCase() !== 'READY_FOR_RETEST') {
      blockers.push(
        `Consumer startup unblock verdict is ${params.consumerUnblockVerdict ?? 'unknown'}`
      );
    }

    if (params.requireMockAbReport) {
      if ((params.mockAbVerdict ?? '').toUpperCase() !== 'READY') {
        blockers.push(
          `Mock consumer A/B verdict is ${params.mockAbVerdict ?? 'unknown'}`
        );
      }
    } else if (params.hasMockAbReport && (params.mockAbVerdict ?? '').toUpperCase() !== 'READY') {
      warnings.push(
        `Mock consumer A/B verdict is ${params.mockAbVerdict ?? 'unknown'} (not required in current mode)`
      );
    }

    if (params.hasRunReport && (params.runReportVerdict ?? '').toUpperCase() !== 'READY') {
      warnings.push(
        `Phase 5 closure run report verdict is ${params.runReportVerdict ?? 'unknown'}`
      );
    }
  }

  if (params.requireArtifactUrls && params.artifactUrls.length === 0) {
    blockers.push('No artifact URLs were provided');
  } else if (!params.requireArtifactUrls && params.artifactUrls.length === 0) {
    warnings.push(
      'No artifact URLs were provided (recommended before external handoff)'
    );
  }

  const verdict: Phase5ExternalHandoffSummary['verdict'] =
    missingInputs.length > 0 ? 'MISSING_INPUTS' : blockers.length > 0 ? 'BLOCKED' : 'READY';

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
