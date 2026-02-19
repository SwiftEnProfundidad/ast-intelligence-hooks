import { execFileSync } from 'node:child_process';

export interface ILifecycleGitService {
  runGit(args: ReadonlyArray<string>, cwd: string): string;
  resolveRepoRoot(cwd: string): string;
  getStatusShort(cwd: string): string;
  listTrackedNodeModulesPaths(cwd: string): ReadonlyArray<string>;
  isPathTracked(cwd: string, path: string): boolean;
  setLocalConfig(cwd: string, key: string, value: string): void;
  unsetLocalConfig(cwd: string, key: string): void;
  getLocalConfig(cwd: string, key: string): string | undefined;
}

const splitNonEmptyLines = (value: string): ReadonlyArray<string> =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

export class LifecycleGitService implements ILifecycleGitService {
  runGit(args: ReadonlyArray<string>, cwd: string): string {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  }

  resolveRepoRoot(cwd: string): string {
    return this.runGit(['rev-parse', '--show-toplevel'], cwd).trim();
  }

  getStatusShort(cwd: string): string {
    return this.runGit(['status', '--short'], cwd);
  }

  listTrackedNodeModulesPaths(cwd: string): ReadonlyArray<string> {
    const output = this.runGit(['ls-files', '--', 'node_modules', 'node_modules/**'], cwd);
    return splitNonEmptyLines(output);
  }

  isPathTracked(cwd: string, path: string): boolean {
    const output = this.runGit(['ls-files', '--', path], cwd);
    return splitNonEmptyLines(output).includes(path);
  }

  setLocalConfig(cwd: string, key: string, value: string): void {
    this.runGit(['config', '--local', key, value], cwd);
  }

  unsetLocalConfig(cwd: string, key: string): void {
    try {
      this.runGit(['config', '--local', '--unset', key], cwd);
    } catch {}
  }

  getLocalConfig(cwd: string, key: string): string | undefined {
    try {
      return this.runGit(['config', '--local', '--get', key], cwd).trim();
    } catch {
      return undefined;
    }
  }
}
