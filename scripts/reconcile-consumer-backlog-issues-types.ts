import type { BacklogIssueNumberResolver, BacklogIssueState, BacklogStatusEmoji } from './backlog-consumer-types';

export type { BacklogIssueNumberResolver, BacklogIssueState, BacklogStatusEmoji } from './backlog-consumer-types';

export type BacklogIssueEntry = {
  issueNumber: number;
  lineNumber: number;
  currentEmoji: BacklogStatusEmoji;
  line: string;
};

export type BacklogIssueChange = {
  issueNumber: number;
  lineNumber: number;
  from: BacklogStatusEmoji;
  to: BacklogStatusEmoji;
  issueState: BacklogIssueState;
  line: string;
};

export type BacklogIssueReferenceChange = {
  id: string;
  issueNumber: number;
  lineNumber: number;
  from: string;
  to: string;
  line: string;
};

export type BacklogSectionHeadingChange = {
  id: string;
  lineNumber: number;
  from: BacklogStatusEmoji;
  to: BacklogStatusEmoji;
  line: string;
};

export type BacklogStatusSummary = {
  closed: number;
  inProgress: number;
  pending: number;
  blocked: number;
  inProgressIds: ReadonlyArray<string>;
  blockedIds: ReadonlyArray<string>;
};

export type BacklogMappingSource = 'none' | 'json' | 'markdown' | 'merged';

export type BacklogReferenceResolution = {
  resolvedByProvidedMap: ReadonlyArray<string>;
  resolvedByLookup: ReadonlyArray<string>;
  unresolvedReferenceIds: ReadonlyArray<string>;
};

export type BacklogReconcileResult = {
  filePath: string;
  repo?: string;
  apply: boolean;
  mappingSource: BacklogMappingSource;
  entriesScanned: number;
  issuesResolved: number;
  referenceChanges: ReadonlyArray<BacklogIssueReferenceChange>;
  referenceResolution: BacklogReferenceResolution;
  changes: ReadonlyArray<BacklogIssueChange>;
  summaryUpdated: boolean;
  nextStepUpdated: boolean;
  headingUpdated: boolean;
  summary: BacklogStatusSummary;
  updated: boolean;
  headingChanges: ReadonlyArray<BacklogSectionHeadingChange>;
};
