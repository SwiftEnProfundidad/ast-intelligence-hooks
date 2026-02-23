import { execFileSync as runBinarySync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Fact } from '../../core/facts/Fact';
import { parseNameStatus, hasAllowedExtension, buildFactsFromChanges } from './gitDiffUtils';
export { parseNameStatus } from './gitDiffUtils';

export interface IGitService {
  runGit(args: ReadonlyArray<string>, cwd?: string): string;
  getStagedFacts(extensions: ReadonlyArray<string>): ReadonlyArray<Fact>;
  getRepoFacts(extensions: ReadonlyArray<string>): ReadonlyArray<Fact>;
  getRepoAndStagedFacts(extensions: ReadonlyArray<string>): ReadonlyArray<Fact>;
  getStagedAndUnstagedFacts(extensions: ReadonlyArray<string>): ReadonlyArray<Fact>;
  resolveRepoRoot(): string;
}

const assertSafeGitArgs = (args: ReadonlyArray<string>): void => {
  for (const arg of args) {
    if (arg.includes('\u0000') || arg.includes('\n') || arg.includes('\r')) {
      throw new Error(`Unsafe git argument detected: ${JSON.stringify(arg)}`);
    }
  }
};

export class GitService implements IGitService {
  runGit(args: ReadonlyArray<string>, cwd?: string): string {
    assertSafeGitArgs(args);
    return runBinarySync('git', [...args], { cwd, encoding: 'utf8' });
  }

  getStagedFacts(extensions: ReadonlyArray<string>): ReadonlyArray<Fact> {
    const nameStatus = this.runGit(['diff', '--cached', '--name-status']);
    const changes = parseNameStatus(nameStatus).filter((change) =>
      hasAllowedExtension(change.path, extensions)
    );

    return buildFactsFromChanges(changes, 'git:staged', (filePath) =>
      this.runGit(['show', `:${filePath}`])
    );
  }

  getRepoFacts(extensions: ReadonlyArray<string>): ReadonlyArray<Fact> {
    const trackedFiles = this.runGit(['ls-files'])
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((path) => hasAllowedExtension(path, extensions));
    const repoRoot = this.resolveRepoRoot();
    const existingTrackedFiles = trackedFiles.filter((filePath) =>
      existsSync(join(repoRoot, filePath))
    );

    const changes = existingTrackedFiles.map((path) => ({
      path,
      changeType: 'modified' as const,
    }));

    return buildFactsFromChanges(changes, 'git:repo:working-tree', (filePath) =>
      this.readWorkingTreeFile(repoRoot, filePath)
    );
  }

  getRepoAndStagedFacts(extensions: ReadonlyArray<string>): ReadonlyArray<Fact> {
    const indexedFiles = this.runGit(['ls-files'])
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((path) => hasAllowedExtension(path, extensions));
    const changes = indexedFiles.map((path) => ({
      path,
      changeType: 'modified' as const,
    }));

    return buildFactsFromChanges(changes, 'git:repo+staged', (filePath) =>
      this.runGit(['show', `:${filePath}`])
    );
  }

  getStagedAndUnstagedFacts(extensions: ReadonlyArray<string>): ReadonlyArray<Fact> {
    const trackedChanges = parseNameStatus(this.runGit(['diff', '--name-status', 'HEAD']))
      .filter((change) => hasAllowedExtension(change.path, extensions));
    const untrackedPaths = this.runGit(['ls-files', '--others', '--exclude-standard'])
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((path) => hasAllowedExtension(path, extensions));
    const existingTracked = new Set(trackedChanges.map((change) => change.path));
    const repoRoot = this.resolveRepoRoot();

    const untrackedChanges = untrackedPaths
      .filter((path) => !existingTracked.has(path))
      .map((path) => ({
        path,
        changeType: 'added' as const,
      }));
    const mergedChanges = [...trackedChanges, ...untrackedChanges];

    return buildFactsFromChanges(mergedChanges, 'git:working-tree', (filePath) =>
      this.readWorkingTreeFile(repoRoot, filePath)
    );
  }

  private readWorkingTreeFile(repoRoot: string, filePath: string): string {
    try {
      return readFileSync(join(repoRoot, filePath), 'utf8');
    } catch (error) {
      const asErrno = error as NodeJS.ErrnoException;
      if (asErrno?.code === 'ENOENT') {
        return '';
      }
      throw error;
    }
  }

  resolveRepoRoot(): string {
    try {
      return this.runGit(['rev-parse', '--show-toplevel']).trim();
    } catch {
      return process.cwd();
    }
  }
}
