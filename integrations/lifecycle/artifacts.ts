import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import type { ILifecycleGitService } from './gitService';

const PUMUKI_ARTIFACTS = ['.ai_evidence.json', '.AI_EVIDENCE.json'] as const;
const RUNTIME_ARTIFACT_IGNORE_ENTRIES = [...PUMUKI_ARTIFACTS, '.pumuki/'] as const;
const RUNTIME_ARTIFACT_IGNORE_BEGIN = '# >>> pumuki-runtime-artifacts >>>';
const RUNTIME_ARTIFACT_IGNORE_END = '# <<< pumuki-runtime-artifacts <<<';

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildRuntimeArtifactIgnoreBlock = (): string =>
  `${RUNTIME_ARTIFACT_IGNORE_BEGIN}\n${RUNTIME_ARTIFACT_IGNORE_ENTRIES.join('\n')}\n${RUNTIME_ARTIFACT_IGNORE_END}`;

export const ensureRuntimeArtifactsIgnored = (repoRoot: string): {
  path: string;
  updated: boolean;
  entries: ReadonlyArray<string>;
} => {
  const gitPath = join(repoRoot, '.git');
  const resolveGitDir = (): string | null => {
    if (!existsSync(gitPath)) {
      return null;
    }
    const gitStat = lstatSync(gitPath);
    if (gitStat.isDirectory()) {
      return gitPath;
    }
    if (!gitStat.isFile()) {
      return null;
    }
    const content = readFileSync(gitPath, 'utf8');
    const match = content.match(/^gitdir:\s*(.+)\s*$/m);
    if (!match || match[1].trim().length === 0) {
      return null;
    }
    const rawGitDir = match[1].trim();
    return isAbsolute(rawGitDir) ? rawGitDir : resolve(repoRoot, rawGitDir);
  };
  const gitDir = resolveGitDir();
  const excludePath = join(gitDir ?? gitPath, 'info', 'exclude');
  if (!gitDir) {
    return {
      path: excludePath,
      updated: false,
      entries: [...RUNTIME_ARTIFACT_IGNORE_ENTRIES],
    };
  }

  mkdirSync(dirname(excludePath), { recursive: true });
  const current = existsSync(excludePath) ? readFileSync(excludePath, 'utf8').replace(/\r\n/g, '\n') : '';
  const block = buildRuntimeArtifactIgnoreBlock();
  const blockPattern = new RegExp(
    `${escapeRegExp(RUNTIME_ARTIFACT_IGNORE_BEGIN)}[\\s\\S]*?${escapeRegExp(RUNTIME_ARTIFACT_IGNORE_END)}\\n?`,
    'm'
  );
  const normalizedCurrent = current.endsWith('\n') || current.length === 0 ? current : `${current}\n`;
  const next = blockPattern.test(normalizedCurrent)
    ? normalizedCurrent.replace(blockPattern, `${block}\n`)
    : `${normalizedCurrent}${normalizedCurrent.length > 0 ? '\n' : ''}${block}\n`;

  if (next === normalizedCurrent) {
    return {
      path: excludePath,
      updated: false,
      entries: [...RUNTIME_ARTIFACT_IGNORE_ENTRIES],
    };
  }

  writeFileSync(excludePath, next, 'utf8');
  return {
    path: excludePath,
    updated: true,
    entries: [...RUNTIME_ARTIFACT_IGNORE_ENTRIES],
  };
};

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
