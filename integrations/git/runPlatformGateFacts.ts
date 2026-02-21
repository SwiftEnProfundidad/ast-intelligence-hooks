import type { Fact } from '../../core/facts/Fact';
import type { IGitService } from './GitService';
import { getFactsForCommitRange } from './getCommitRangeFacts';

export type GateScope =
  | {
    kind: 'staged';
    extensions?: string[];
  }
  | {
    kind: 'repo';
    extensions?: string[];
  }
  | {
    kind: 'repoAndStaged';
    extensions?: string[];
  }
  | {
    kind: 'workingTree';
    extensions?: string[];
  }
  | {
    kind: 'range';
    fromRef: string;
    toRef: string;
    extensions?: string[];
  };

const DEFAULT_EXTENSIONS = ['.swift', '.ts', '.tsx', '.js', '.jsx', '.kt', '.kts'];

export const countScannedFilesFromFacts = (facts: ReadonlyArray<Fact>): number => {
  const contentPaths = new Set<string>();
  const changedPaths = new Set<string>();

  for (const fact of facts) {
    if (fact.kind === 'FileContent') {
      contentPaths.add(fact.path);
      continue;
    }
    if (fact.kind === 'FileChange') {
      changedPaths.add(fact.path);
    }
  }

  if (contentPaths.size > 0) {
    return contentPaths.size;
  }

  return changedPaths.size;
};

export const resolveFactsForGateScope = async (params: {
  scope: GateScope;
  git: IGitService;
}): Promise<ReadonlyArray<Fact>> => {
  const extensions = params.scope.extensions ?? DEFAULT_EXTENSIONS;
  if (params.scope.kind === 'staged') {
    return params.git.getStagedFacts(extensions);
  }
  if (params.scope.kind === 'repo') {
    return params.git.getRepoFacts(extensions);
  }
  if (params.scope.kind === 'repoAndStaged') {
    return params.git.getRepoAndStagedFacts(extensions);
  }
  if (params.scope.kind === 'workingTree') {
    return params.git.getStagedAndUnstagedFacts(extensions);
  }

  return getFactsForCommitRange({
    fromRef: params.scope.fromRef,
    toRef: params.scope.toRef,
    extensions: [...extensions],
    git: params.git,
  });
};
