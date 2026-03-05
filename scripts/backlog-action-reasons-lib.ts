export type WatchActionReason =
  | 'needs_issue'
  | 'drift_closed_issue'
  | 'heading_drift';

export type ReconcileActionReason =
  | 'reference_changes'
  | 'issue_changes'
  | 'heading_changes'
  | 'summary_updated'
  | 'next_step_updated';

export const buildWatchActionRequiredReasons = (input: {
  needsIssueCount: number;
  driftClosedIssueCount: number;
  headingDriftCount: number;
}): ReadonlyArray<WatchActionReason> => [
  ...(input.needsIssueCount > 0 ? (['needs_issue'] as const) : []),
  ...(input.driftClosedIssueCount > 0 ? (['drift_closed_issue'] as const) : []),
  ...(input.headingDriftCount > 0 ? (['heading_drift'] as const) : []),
];

export const buildReconcileActionRequiredReasons = (input: {
  referenceChangesCount: number;
  issueChangesCount: number;
  headingChangesCount: number;
  summaryUpdated: boolean;
  nextStepUpdated: boolean;
}): ReadonlyArray<ReconcileActionReason> => [
  ...(input.referenceChangesCount > 0 ? (['reference_changes'] as const) : []),
  ...(input.issueChangesCount > 0 ? (['issue_changes'] as const) : []),
  ...(input.headingChangesCount > 0 ? (['heading_changes'] as const) : []),
  ...(input.summaryUpdated ? (['summary_updated'] as const) : []),
  ...(input.nextStepUpdated ? (['next_step_updated'] as const) : []),
];

export const formatActionReasonsForHuman = (reasons: ReadonlyArray<string>): string =>
  reasons.length > 0 ? reasons.join(',') : 'none';
