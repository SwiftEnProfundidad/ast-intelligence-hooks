import { execFileSync } from 'node:child_process';
import type { Fact } from '../../core/facts/Fact';
import { parseNameStatus, hasAllowedExtension, buildFactsFromChanges } from './gitDiffUtils';
export { parseNameStatus } from './gitDiffUtils';

export interface IGitService {
  runGit(args: ReadonlyArray<string>, cwd?: string): string;
  getStagedFacts(extensions: ReadonlyArray<string>): ReadonlyArray<Fact>;
  resolveRepoRoot(): string;
}

export class GitService implements IGitService {
  runGit(args: ReadonlyArray<string>, cwd?: string): string {
    return execFileSync('git', args, { cwd, encoding: 'utf8' });
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

  resolveRepoRoot(): string {
    try {
      return this.runGit(['rev-parse', '--show-toplevel']).trim();
    } catch {
      return process.cwd();
    }
  }
}
