import { existsSync, lstatSync, readdirSync, rmdirSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
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
    return params.git.pathTracked(params.repoRoot, candidate);
  });
};

export const purgeUntrackedPumukiArtifacts = (params: {
  git: ILifecycleGitService;
  repoRoot: string;
  managedOpenSpecArtifacts?: ReadonlyArray<string>;
}): ReadonlyArray<string> => {
  const removed: string[] = [];

  const pruneEmptyAncestors = (relativePath: string): void => {
    let current = dirname(relativePath);
    while (current !== '.' && current !== '') {
      const absolute = join(params.repoRoot, current);
      if (!existsSync(absolute)) {
        break;
      }
      if (params.git.pathTracked(params.repoRoot, current)) {
        break;
      }
      if (readdirSync(absolute).length > 0) {
        break;
      }
      rmdirSync(absolute);
      current = dirname(current);
    }
  };

  const removeUntrackedFile = (relativePath: string): boolean => {
    const absolutePath = join(params.repoRoot, relativePath);
    if (!existsSync(absolutePath)) {
      return false;
    }
    if (params.git.pathTracked(params.repoRoot, relativePath)) {
      return false;
    }
    const stat = lstatSync(absolutePath);
    if (!stat.isFile() && !stat.isSymbolicLink()) {
      return false;
    }
    unlinkSync(absolutePath);
    removed.push(relativePath);
    pruneEmptyAncestors(relativePath);
    return true;
  };

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
    removeUntrackedFile(relativePath);
  }

  const managedArtifacts = Array.from(
    new Set((params.managedOpenSpecArtifacts ?? []).map((value) => value.trim()))
  );
  for (const rawPath of managedArtifacts) {
    const normalized = rawPath.replace(/\\/g, '/');
    if (normalized.length === 0) {
      continue;
    }
    if (normalized.startsWith('/') || normalized.startsWith('../') || normalized.includes('/../')) {
      continue;
    }
    if (PUMUKI_ARTIFACTS.includes(normalized as (typeof PUMUKI_ARTIFACTS)[number])) {
      continue;
    }
    removeUntrackedFile(normalized);
  }

  return removed;
};
