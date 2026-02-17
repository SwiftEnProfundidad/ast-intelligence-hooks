import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import type { ILifecycleGitService } from './gitService';

const PUMUKI_ARTIFACTS = ['.ai_evidence.json', '.AI_EVIDENCE.json'] as const;

const isTrackedArtifactAlias = (params: {
  git: ILifecycleGitService;
  repoRoot: string;
  relativePath: (typeof PUMUKI_ARTIFACTS)[number];
}): boolean => {
  const canonical = params.relativePath.toLowerCase();
  return PUMUKI_ARTIFACTS.some((candidate) => {
    if (candidate.toLowerCase() !== canonical) {
      return false;
    }
    return params.git.isPathTracked(params.repoRoot, candidate);
  });
};

export const purgeUntrackedPumukiArtifacts = (params: {
  git: ILifecycleGitService;
  repoRoot: string;
}): ReadonlyArray<string> => {
  const removed: string[] = [];

  for (const relativePath of PUMUKI_ARTIFACTS) {
    const absolutePath = join(params.repoRoot, relativePath);
    if (!existsSync(absolutePath)) {
      continue;
    }
    if (
      isTrackedArtifactAlias({
        git: params.git,
        repoRoot: params.repoRoot,
        relativePath,
      })
    ) {
      continue;
    }
    unlinkSync(absolutePath);
    removed.push(relativePath);
  }

  return removed;
};
