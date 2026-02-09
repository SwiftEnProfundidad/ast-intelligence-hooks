import type { Phase5ExternalHandoffSummary } from './phase5-external-handoff-contract';
import { appendPhase5ExternalHandoffListSection } from './phase5-external-handoff-markdown-list-lib';
import { appendPhase5ExternalHandoffNextActions } from './phase5-external-handoff-markdown-next-actions-lib';

export const appendArtifactUrlsSection = (params: {
  lines: string[];
  summary: Phase5ExternalHandoffSummary;
}): void => {
  appendPhase5ExternalHandoffListSection({
    lines: params.lines,
    title: '## Artifact URLs',
    values: params.summary.artifactUrls,
  });
};

export const appendMissingInputsSection = (params: {
  lines: string[];
  summary: Phase5ExternalHandoffSummary;
}): void => {
  appendPhase5ExternalHandoffListSection({
    lines: params.lines,
    title: '## Missing Inputs',
    values: params.summary.missingInputs,
  });
};

export const appendBlockersSection = (params: {
  lines: string[];
  summary: Phase5ExternalHandoffSummary;
}): void => {
  appendPhase5ExternalHandoffListSection({
    lines: params.lines,
    title: '## Blockers',
    values: params.summary.blockers,
  });
};

export const appendWarningsSection = (params: {
  lines: string[];
  summary: Phase5ExternalHandoffSummary;
}): void => {
  appendPhase5ExternalHandoffListSection({
    lines: params.lines,
    title: '## Warnings',
    values: params.summary.warnings,
  });
};

export const appendNextActionsSection = (params: {
  lines: string[];
  summary: Phase5ExternalHandoffSummary;
}): void => {
  appendPhase5ExternalHandoffNextActions(params);
};
