import type { SummarizePhase5ExternalHandoffParams } from './phase5-external-handoff-contract';

export const collectPhase5ExternalHandoffMissingInputs = (
  params: SummarizePhase5ExternalHandoffParams
): string[] => {
  const missingInputs: string[] = [];

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

  return missingInputs;
};

export const collectPhase5ExternalHandoffArtifactFindings = (
  params: SummarizePhase5ExternalHandoffParams
): { blockers: string[]; warnings: string[] } => {
  if (params.requireArtifactUrls && params.artifactUrls.length === 0) {
    return {
      blockers: ['No artifact URLs were provided'],
      warnings: [],
    };
  }

  if (!params.requireArtifactUrls && params.artifactUrls.length === 0) {
    return {
      blockers: [],
      warnings: ['No artifact URLs were provided (recommended before external handoff)'],
    };
  }

  return {
    blockers: [],
    warnings: [],
  };
};
