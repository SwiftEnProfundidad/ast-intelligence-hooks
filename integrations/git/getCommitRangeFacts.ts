import type { Fact } from '../../core/facts/Fact';
import { parseNameStatus, hasAllowedExtension, buildFactsFromChanges } from './gitDiffUtils';
import type { IGitService } from './GitService';
import { GitService } from './GitService';

const defaultGit: IGitService = new GitService();

const isResolvableRef = (git: IGitService, ref: string): boolean => {
  try {
    git.runGit(['rev-parse', '--verify', ref]);
    return true;
  } catch {
    return false;
  }
};

const isRangeResolutionError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }
  return /unknown revision|bad revision|ambiguous argument|fatal:\s+invalid object name/i.test(
    error.message
  );
};

export async function getFactsForCommitRange(params: {
  fromRef: string;
  toRef: string;
  extensions: string[];
  git?: IGitService;
}): Promise<ReadonlyArray<Fact>> {
  const git = params.git ?? defaultGit;
  if (!isResolvableRef(git, params.fromRef) || !isResolvableRef(git, params.toRef)) {
    return [];
  }

  let diffOutput = '';
  try {
    diffOutput = git.runGit([
      'diff',
      '--name-status',
      `${params.fromRef}..${params.toRef}`,
    ]);
  } catch (error) {
    if (isRangeResolutionError(error)) {
      return [];
    }
    throw error;
  }
  const changes = parseNameStatus(diffOutput).filter((change) =>
    hasAllowedExtension(change.path, params.extensions)
  );

  const source = `git:range:${params.fromRef}..${params.toRef}`;
  return buildFactsFromChanges(changes, source, (filePath) =>
    git.runGit(['show', `${params.toRef}:${filePath}`])
  );
}
