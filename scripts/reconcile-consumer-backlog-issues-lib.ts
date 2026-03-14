import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveIssueStateWithGh } from './backlog-consumer-gh';
import {
  applyBacklogIssueReferenceMapping,
  collectBacklogIssueEntries,
  resolveBacklogIdIssueMap,
} from './reconcile-consumer-backlog-issues-parse';
import {
  buildBacklogStatusSummary,
  reconcileBacklogMarkdown,
  syncBacklogNextStepNarrative,
  syncBacklogSectionHeadingStatus,
  syncBacklogStatusSummary,
} from './reconcile-consumer-backlog-issues-sync';
import type {
  BacklogIssueNumberResolver,
  BacklogIssueState,
  BacklogMappingSource,
  BacklogReconcileResult,
  BacklogReferenceResolution,
} from './reconcile-consumer-backlog-issues-types';
export type {
  BacklogIssueChange,
  BacklogIssueEntry,
  BacklogIssueNumberResolver,
  BacklogIssueReferenceChange,
  BacklogIssueState,
  BacklogMappingSource,
  BacklogReconcileResult,
  BacklogReferenceResolution,
  BacklogSectionHeadingChange,
  BacklogStatusEmoji,
  BacklogStatusSummary,
} from './reconcile-consumer-backlog-issues-types';
export {
  buildBacklogStatusSummary,
  reconcileBacklogMarkdown,
  syncBacklogNextStepNarrative,
  syncBacklogSectionHeadingStatus,
  syncBacklogStatusSummary,
} from './reconcile-consumer-backlog-issues-sync';
export {
  applyBacklogIssueReferenceMapping,
  collectBacklogIssueEntries,
  collectBacklogOperationalStatusEntries,
} from './reconcile-consumer-backlog-issues-parse';

export const runBacklogIssuesReconcile = async (params: {
  filePath: string;
  repo?: string;
  apply?: boolean;
  mappingSource?: BacklogMappingSource;
  idIssueMap?: ReadonlyMap<string, number>;
  resolveIssueNumberById?: BacklogIssueNumberResolver;
  readFile?: (path: string) => string;
  writeFile?: (path: string, contents: string) => void;
  resolveIssueState?: (issueNumber: number, repo?: string) => BacklogIssueState | Promise<BacklogIssueState>;
}): Promise<BacklogReconcileResult> => {
  const filePath = resolve(params.filePath);
  const readFile = params.readFile ?? ((path: string) => readFileSync(path, 'utf8'));
  const writeFile = params.writeFile ?? ((path: string, contents: string) => writeFileSync(path, contents, 'utf8'));
  const resolveIssueState = params.resolveIssueState ?? resolveIssueStateWithGh;

  const markdown = readFile(filePath);
  const resolvedIssueMap = await resolveBacklogIdIssueMap({
    markdown,
    providedIssueMap: params.idIssueMap,
    resolveIssueNumberById: params.resolveIssueNumberById,
    repo: params.repo,
  });
  const mapped = applyBacklogIssueReferenceMapping({
    markdown,
    idIssueMap: resolvedIssueMap.idIssueMap,
  });
  const referenceResolution: BacklogReferenceResolution = {
    resolvedByProvidedMap: resolvedIssueMap.resolvedByProvidedMap,
    resolvedByLookup: resolvedIssueMap.resolvedByLookup,
    unresolvedReferenceIds: resolvedIssueMap.unresolvedReferenceIds,
  };
  const entries = collectBacklogIssueEntries(mapped.updatedMarkdown);
  const uniqueIssueNumbers = Array.from(new Set(entries.map((entry) => entry.issueNumber))).sort((a, b) => a - b);

  const issueStates = new Map<number, BacklogIssueState>();
  for (const issueNumber of uniqueIssueNumbers) {
    issueStates.set(issueNumber, await resolveIssueState(issueNumber, params.repo));
  }

  const reconciled = reconcileBacklogMarkdown({
    markdown: mapped.updatedMarkdown,
    issueStates,
  });

  const apply = params.apply === true;
  if (
    apply &&
    (mapped.changes.length > 0 ||
      reconciled.changes.length > 0 ||
      reconciled.summaryUpdated ||
      reconciled.nextStepUpdated ||
      reconciled.headingUpdated)
  ) {
    writeFile(filePath, reconciled.updatedMarkdown);
  }

  return {
    filePath,
    repo: params.repo,
    apply,
    mappingSource: params.mappingSource ?? (params.idIssueMap && params.idIssueMap.size > 0 ? 'json' : 'none'),
    entriesScanned: entries.length,
    issuesResolved: uniqueIssueNumbers.length,
    referenceChanges: mapped.changes,
    referenceResolution,
    changes: reconciled.changes,
    summaryUpdated: reconciled.summaryUpdated,
    nextStepUpdated: reconciled.nextStepUpdated,
    headingUpdated: reconciled.headingUpdated,
    summary: reconciled.summary,
    headingChanges: reconciled.headingChanges,
    updated:
      apply &&
      (mapped.changes.length > 0 ||
        reconciled.changes.length > 0 ||
        reconciled.summaryUpdated ||
        reconciled.nextStepUpdated ||
        reconciled.headingUpdated),
  };
};
