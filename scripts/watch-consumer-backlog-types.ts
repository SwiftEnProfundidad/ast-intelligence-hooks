import type { BacklogIssueNumberResolver, BacklogStatusEmoji } from './backlog-consumer-types';

export type { BacklogIssueNumberResolver, BacklogStatusEmoji } from './backlog-consumer-types';

export type BacklogWatchEntry = {
  id: string;
  status: BacklogStatusEmoji;
  issueNumber: number | null;
  lineNumber: number;
  line: string;
};

export type BacklogWatchClassification = {
  needsIssue: ReadonlyArray<BacklogWatchEntry>;
  driftClosedIssue: ReadonlyArray<BacklogWatchEntry>;
  activeIssue: ReadonlyArray<BacklogWatchEntry>;
};

export type BacklogWatchResolutionTrace = {
  resolvedByMap: ReadonlyArray<string>;
  resolvedByGhLookup: ReadonlyArray<string>;
  unresolvedIds: ReadonlyArray<string>;
};

export type BacklogHeadingDriftEntry = {
  id: string;
  lineNumber: number;
  headingStatus: BacklogStatusEmoji;
  effectiveStatus: BacklogStatusEmoji;
  line: string;
};

export type BacklogWatchResult = {
  filePath: string;
  repo?: string;
  entriesScanned: number;
  nonClosedEntries: number;
  issueStatesResolved: number;
  classification: BacklogWatchClassification;
  resolution: BacklogWatchResolutionTrace;
  headingDrift: ReadonlyArray<BacklogHeadingDriftEntry>;
  hasActionRequired: boolean;
};

export type BacklogWatchIdIssueMap = Readonly<Record<string, number>>;
