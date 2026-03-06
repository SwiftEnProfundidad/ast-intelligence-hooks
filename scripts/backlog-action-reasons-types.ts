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

export type BuildWatchActionReasonsInput = Readonly<{
  needsIssueCount: number;
  driftClosedIssueCount: number;
  headingDriftCount: number;
}>;

export type BuildReconcileActionReasonsInput = Readonly<{
  referenceChangesCount: number;
  issueChangesCount: number;
  headingChangesCount: number;
  summaryUpdated: boolean;
  nextStepUpdated: boolean;
}>;
