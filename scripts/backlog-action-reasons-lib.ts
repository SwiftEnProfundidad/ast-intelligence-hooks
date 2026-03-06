import type {
  BuildReconcileActionReasonsInput,
  BuildWatchActionReasonsInput,
  ReconcileActionReason,
  WatchActionReason,
} from './backlog-action-reasons-types';

export type {
  BuildReconcileActionReasonsInput,
  BuildWatchActionReasonsInput,
  ReconcileActionReason,
  WatchActionReason,
} from './backlog-action-reasons-types';

export const buildWatchActionRequiredReasons = (
  input: BuildWatchActionReasonsInput
): ReadonlyArray<WatchActionReason> => [
  ...(input.needsIssueCount > 0 ? (['needs_issue'] as const) : []),
  ...(input.driftClosedIssueCount > 0 ? (['drift_closed_issue'] as const) : []),
  ...(input.headingDriftCount > 0 ? (['heading_drift'] as const) : []),
];

export const buildReconcileActionRequiredReasons = (
  input: BuildReconcileActionReasonsInput
): ReadonlyArray<ReconcileActionReason> => [
  ...(input.referenceChangesCount > 0 ? (['reference_changes'] as const) : []),
  ...(input.issueChangesCount > 0 ? (['issue_changes'] as const) : []),
  ...(input.headingChangesCount > 0 ? (['heading_changes'] as const) : []),
  ...(input.summaryUpdated ? (['summary_updated'] as const) : []),
  ...(input.nextStepUpdated ? (['next_step_updated'] as const) : []),
];

export const formatActionReasonsForHuman = (reasons: ReadonlyArray<string>): string =>
  reasons.length > 0 ? reasons.join(',') : 'none';
