import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  parseFiniteIssueNumber,
  resolveIssueStateWithGh,
  resolveIssueNumberByIdWithGh,
} from './backlog-consumer-gh';
import {
  collectBacklogHeadingDrift,
  collectBacklogIdIssueMap,
  collectBacklogWatchEntries,
  dedupeBacklogWatchEntriesById,
} from './watch-consumer-backlog-parse';
import type {
  BacklogIssueNumberResolver,
  BacklogIssueState,
  BacklogWatchIdIssueMap,
  BacklogWatchResult,
} from './watch-consumer-backlog-types';
export type {
  BacklogHeadingDriftEntry,
  BacklogIssueNumberResolver,
  BacklogStatusEmoji,
  BacklogWatchClassification,
  BacklogWatchEntry,
  BacklogWatchIdIssueMap,
  BacklogWatchResolutionTrace,
  BacklogWatchResult,
} from './watch-consumer-backlog-types';
export {
  collectBacklogHeadingDrift,
  collectBacklogIdIssueMap,
  collectBacklogWatchEntries,
  dedupeBacklogWatchEntriesById,
  resolveIssueNumberByIdWithGh,
};

export const runBacklogWatch = async (params: {
  filePath: string;
  repo?: string;
  idIssueMap?: BacklogWatchIdIssueMap;
  readFile?: (path: string) => string;
  resolveIssueNumberById?: BacklogIssueNumberResolver;
  resolveIssueState?: (issueNumber: number, repo?: string) => BacklogIssueState | Promise<BacklogIssueState>;
}): Promise<BacklogWatchResult> => {
  const filePath = resolve(params.filePath);
  const readFile = params.readFile ?? ((path: string) => readFileSync(path, 'utf8'));
  const resolveIssueState = params.resolveIssueState ?? resolveIssueStateWithGh;

  const markdown = readFile(filePath);
  const entries = collectBacklogWatchEntries(markdown);
  const headingDrift = collectBacklogHeadingDrift(markdown);
  const nonClosedRaw = entries.filter((entry) => entry.status !== '✅');
  const nonClosed = dedupeBacklogWatchEntriesById(nonClosedRaw);
  const resolvedByMapSet = new Set<string>();
  const nonClosedWithIssueMap = nonClosed.map((entry) => {
    if (entry.issueNumber !== null) {
      return entry;
    }
    const mappedIssue = params.idIssueMap?.[entry.id];
    if (typeof mappedIssue !== 'number' || !Number.isFinite(mappedIssue)) {
      return entry;
    }
    resolvedByMapSet.add(entry.id);
    return {
      ...entry,
      issueNumber: Math.trunc(mappedIssue),
    };
  });
  const resolveIssueNumberById = params.resolveIssueNumberById;
  const resolvedIssueById = new Map<string, number>();
  const resolvedByGhLookupSet = new Set<string>();
  if (typeof resolveIssueNumberById === 'function') {
    const unresolvedIds = Array.from(
      new Set(nonClosedWithIssueMap.filter((entry) => entry.issueNumber === null).map((entry) => entry.id))
    );
    for (const backlogId of unresolvedIds) {
      const resolvedIssue = await resolveIssueNumberById(backlogId, params.repo);
      const parsedIssue = parseFiniteIssueNumber(resolvedIssue);
      if (parsedIssue === null) {
        continue;
      }
      resolvedIssueById.set(backlogId, parsedIssue);
      resolvedByGhLookupSet.add(backlogId);
    }
  }
  const nonClosedWithIssueResolution = nonClosedWithIssueMap.map((entry) => {
    if (entry.issueNumber !== null) {
      return entry;
    }
    const resolvedIssue = resolvedIssueById.get(entry.id);
    if (typeof resolvedIssue !== 'number') {
      return entry;
    }
    return {
      ...entry,
      issueNumber: resolvedIssue,
    };
  });

  const issueNumbers = Array.from(
    new Set(
      nonClosedWithIssueResolution
        .map((entry) => entry.issueNumber)
        .filter((value): value is number => typeof value === 'number')
    )
  ).sort((a, b) => a - b);

  const issueStates = new Map<number, BacklogIssueState>();
  for (const issueNumber of issueNumbers) {
    issueStates.set(issueNumber, await resolveIssueState(issueNumber, params.repo));
  }

  const needsIssue = nonClosedWithIssueResolution.filter((entry) => entry.issueNumber === null);
  const driftClosedIssue = nonClosedWithIssueResolution.filter(
    (entry) => typeof entry.issueNumber === 'number' && issueStates.get(entry.issueNumber) === 'CLOSED'
  );
  const activeIssue = nonClosedWithIssueResolution.filter(
    (entry) => typeof entry.issueNumber === 'number' && issueStates.get(entry.issueNumber) === 'OPEN'
  );

  const unresolvedIds = Array.from(new Set(needsIssue.map((entry) => entry.id))).sort();
  const resolvedByMap = Array.from(resolvedByMapSet).sort();
  const resolvedByGhLookup = Array.from(resolvedByGhLookupSet).sort();

  return {
    filePath,
    repo: params.repo,
    entriesScanned: entries.length,
    nonClosedEntries: nonClosed.length,
    issueStatesResolved: issueNumbers.length,
    classification: {
      needsIssue,
      driftClosedIssue,
      activeIssue,
    },
    resolution: {
      resolvedByMap,
      resolvedByGhLookup,
      unresolvedIds,
    },
    headingDrift,
    hasActionRequired: needsIssue.length > 0 || driftClosedIssue.length > 0 || headingDrift.length > 0,
  };
};
