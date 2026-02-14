import { execFileSync } from 'node:child_process';
import type { Fact } from '../../core/facts/Fact';
import type { FileChangeFact } from '../../core/facts/FileChangeFact';
import type { FileContentFact } from '../../core/facts/FileContentFact';

type ChangeFact = FileChangeFact & { source: string };
type ContentFact = FileContentFact & { source: string };

type CommitRangeChange = {
  path: string;
  changeType: 'added' | 'modified' | 'deleted';
};

const runGit = (args: ReadonlyArray<string>): string => {
  return execFileSync('git', args, { encoding: 'utf8' });
};

const parseNameStatus = (output: string): CommitRangeChange[] => {
  const trimmed = output.trim();
  if (!trimmed) {
    return [];
  }

  const changes: CommitRangeChange[] = [];
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

const hasAllowedExtension = (
  path: string,
  extensions: ReadonlyArray<string>
): boolean => {
  return extensions.some((extension) => path.endsWith(extension));
};

export async function getFactsForCommitRange(params: {
  fromRef: string;
  toRef: string;
  extensions: string[];
}): Promise<ReadonlyArray<Fact>> {
  const diffOutput = runGit([
    'diff',
    '--name-status',
    `${params.fromRef}..${params.toRef}`,
  ]);
  const changes = parseNameStatus(diffOutput).filter((change) =>
    hasAllowedExtension(change.path, params.extensions)
  );

  const facts: Fact[] = [];
  const source = `git:range:${params.fromRef}..${params.toRef}`;

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

    const content = runGit(['show', `${params.toRef}:${change.path}`]);
    const contentFact: ContentFact = {
      kind: 'FileContent',
      path: change.path,
      content,
      source,
    };
    facts.push(contentFact);
  }

  return facts;
}
