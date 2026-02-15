import type { Fact } from '../../core/facts/Fact';
import type { FileChangeFact } from '../../core/facts/FileChangeFact';
import type { FileContentFact } from '../../core/facts/FileContentFact';

export type ChangeFact = FileChangeFact & { source: string };
export type ContentFact = FileContentFact & { source: string };

export type GitChange = {
  path: string;
  changeType: 'added' | 'modified' | 'deleted';
};

export const parseNameStatus = (output: string): GitChange[] => {
  const trimmed = output.trim();
  if (!trimmed) {
    return [];
  }

  const changes: GitChange[] = [];
  for (const line of trimmed.split('\n')) {
    if (!line) {
      continue;
    }
    const parts = line.split('\t');
    const status = parts[0];
    const statusCode = status[0];
    const path = statusCode === 'R' || statusCode === 'C' ? parts[2] : parts[1];
    if (!path) {
      continue;
    }

    const changeType =
      statusCode === 'A'
        ? 'added'
        : statusCode === 'M'
          ? 'modified'
          : statusCode === 'D'
            ? 'deleted'
            : statusCode === 'R' || statusCode === 'C'
              ? 'modified'
              : null;
    if (!changeType) {
      continue;
    }

    changes.push({ path, changeType });
  }

  return changes;
};

export const hasAllowedExtension = (
  path: string,
  extensions: ReadonlyArray<string>
): boolean => {
  return extensions.some((extension) => path.endsWith(extension));
};

export const buildFactsFromChanges = (
  changes: ReadonlyArray<GitChange>,
  source: string,
  getFileContent: (path: string) => string
): ReadonlyArray<Fact> => {
  const facts: Fact[] = [];

  for (const change of changes) {
    const changeFact: ChangeFact = {
      kind: 'FileChange',
      path: change.path,
      changeType: change.changeType,
      source,
    };
    facts.push(changeFact);

    if (change.changeType === 'deleted') {
      continue;
    }

    const content = getFileContent(change.path);
    const contentFact: ContentFact = {
      kind: 'FileContent',
      path: change.path,
      content,
      source,
    };
    facts.push(contentFact);
  }

  return facts;
};
