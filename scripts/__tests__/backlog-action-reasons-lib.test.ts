import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildReconcileActionRequiredReasons,
  buildWatchActionRequiredReasons,
  formatActionReasonsForHuman,
} from '../backlog-action-reasons-lib';

test('buildWatchActionRequiredReasons returns stable ordered reasons', () => {
  const reasons = buildWatchActionRequiredReasons({
    needsIssueCount: 1,
    driftClosedIssueCount: 0,
    headingDriftCount: 2,
  });
  assert.deepEqual(reasons, ['needs_issue', 'heading_drift']);
});

test('buildReconcileActionRequiredReasons returns stable ordered reasons', () => {
  const reasons = buildReconcileActionRequiredReasons({
    referenceChangesCount: 0,
    issueChangesCount: 1,
    headingChangesCount: 1,
    summaryUpdated: false,
    nextStepUpdated: true,
  });
  assert.deepEqual(reasons, ['issue_changes', 'heading_changes', 'next_step_updated']);
});

test('formatActionReasonsForHuman returns none for empty reasons', () => {
  assert.equal(formatActionReasonsForHuman([]), 'none');
  assert.equal(formatActionReasonsForHuman(['needs_issue']), 'needs_issue');
});
