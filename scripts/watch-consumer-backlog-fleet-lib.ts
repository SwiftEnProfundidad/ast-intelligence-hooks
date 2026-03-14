import { randomUUID } from 'node:crypto';
import {
  buildWatchActionRequiredReasons,
  formatActionReasonsForHuman,
} from './backlog-action-reasons-lib';
import {
  BACKLOG_JSON_COMPAT_CONTRACT_ID,
  BACKLOG_JSON_COMPAT_MIN_READER_VERSION,
  BACKLOG_JSON_SCHEMA_VERSION,
} from './backlog-json-contract-lib';
import { runBacklogWatch, type BacklogWatchResult } from './watch-consumer-backlog-lib';

export type FleetWatchTarget = {
  filePath: string;
  repo?: string;
  key?: string;
};

export type FleetWatchResult = BacklogWatchResult & {
  key?: string;
  actionRequiredReasons: ReadonlyArray<string>;
};

export type FleetWatchSummary = {
  targets: number;
  entriesScannedTotal: number;
  nonClosedTotal: number;
  actionRequiredTargets: number;
  hasActionRequired: boolean;
};

export type FleetWatchJsonPayload = {
  tool: string;
  schema_version: string;
  generated_at: string;
  run_id: string;
  compat: {
    contract_id: string;
    min_reader_version: string;
    is_backward_compatible: boolean;
    breaking_changes: ReadonlyArray<string>;
  };
  summary: {
    targets: number;
    entries_scanned_total: number;
    non_closed_total: number;
    action_required_targets: number;
    has_action_required: boolean;
  };
  results: ReadonlyArray<FleetWatchResult>;
};

export const runBacklogWatchFleet = async (
  targets: ReadonlyArray<FleetWatchTarget>
): Promise<ReadonlyArray<FleetWatchResult>> =>
  Promise.all(
    targets.map(async (target) => {
      const watchResult = await runBacklogWatch({
        filePath: target.filePath,
        repo: target.repo,
      });
      const actionRequiredReasons = buildWatchActionRequiredReasons({
        needsIssueCount: watchResult.classification.needsIssue.length,
        driftClosedIssueCount: watchResult.classification.driftClosedIssue.length,
        headingDriftCount: watchResult.headingDrift.length,
      });
      return {
        ...watchResult,
        key: target.key,
        actionRequiredReasons,
      };
    })
  );

export const summarizeBacklogWatchFleet = (
  results: ReadonlyArray<FleetWatchResult>
): FleetWatchSummary => ({
  targets: results.length,
  entriesScannedTotal: results.reduce((acc, item) => acc + item.entriesScanned, 0),
  nonClosedTotal: results.reduce((acc, item) => acc + item.nonClosedEntries, 0),
  actionRequiredTargets: results.filter((item) => item.hasActionRequired).length,
  hasActionRequired: results.some((item) => item.hasActionRequired),
});

export const formatBacklogWatchFleetHumanOutput = (
  toolName: string,
  results: ReadonlyArray<FleetWatchResult>
): string => {
  const summary = summarizeBacklogWatchFleet(results);
  const lines: string[] = [];
  lines.push(
    `[pumuki][${toolName}] targets=${summary.targets} entries_total=${summary.entriesScannedTotal} non_closed_total=${summary.nonClosedTotal} action_required_targets=${summary.actionRequiredTargets}`
  );
  for (const target of results) {
    const targetDescriptor =
      typeof target.key === 'string' && target.key.length > 0
        ? `key=${target.key} target=${target.filePath}`
        : `target=${target.filePath} repo=${target.repo ?? '-'}`;
    lines.push(
      `[pumuki][${toolName}] ${targetDescriptor} entries=${target.entriesScanned} non_closed=${target.nonClosedEntries} action_required=${target.hasActionRequired ? 'yes' : 'no'} reasons=${formatActionReasonsForHuman(target.actionRequiredReasons)}`
    );
  }
  return `${lines.join('\n')}\n`;
};

export const buildBacklogWatchFleetJsonPayload = (
  toolName: string,
  results: ReadonlyArray<FleetWatchResult>
): FleetWatchJsonPayload => {
  const summary = summarizeBacklogWatchFleet(results);
  return {
    tool: toolName,
    schema_version: BACKLOG_JSON_SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    run_id: randomUUID(),
    compat: {
      contract_id: BACKLOG_JSON_COMPAT_CONTRACT_ID,
      min_reader_version: BACKLOG_JSON_COMPAT_MIN_READER_VERSION,
      is_backward_compatible: true,
      breaking_changes: [],
    },
    summary: {
      targets: summary.targets,
      entries_scanned_total: summary.entriesScannedTotal,
      non_closed_total: summary.nonClosedTotal,
      action_required_targets: summary.actionRequiredTargets,
      has_action_required: summary.hasActionRequired,
    },
    results,
  };
};
