import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import type { ILifecycleGitService } from './gitService';

const PUMUKI_ARTIFACTS = ['.ai_evidence.json', '.AI_EVIDENCE.json'] as const;

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
    if (params.git.isPathTracked(params.repoRoot, relativePath)) {
      continue;
    }
    unlinkSync(absolutePath);
    removed.push(relativePath);
  }

  return removed;
};
