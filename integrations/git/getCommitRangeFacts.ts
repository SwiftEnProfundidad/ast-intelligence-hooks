import type { Fact } from '../../core/facts/Fact';
import { parseNameStatus, hasAllowedExtension, buildFactsFromChanges } from './gitDiffUtils';
import type { IGitService } from './GitService';
import { GitService } from './GitService';

const defaultGit: IGitService = new GitService();

export async function getFactsForCommitRange(params: {
  fromRef: string;
  toRef: string;
  extensions: string[];
  git?: IGitService;
}): Promise<ReadonlyArray<Fact>> {
  const git = params.git ?? defaultGit;
  const diffOutput = git.runGit([
    'diff',
    '--name-status',
    `${params.fromRef}..${params.toRef}`,
  ]);
  const changes = parseNameStatus(diffOutput).filter((change) =>
    hasAllowedExtension(change.path, params.extensions)
  );

  const source = `git:range:${params.fromRef}..${params.toRef}`;
  return buildFactsFromChanges(changes, source, (filePath) =>
    git.runGit(['show', `${params.toRef}:${filePath}`])
  );
}
