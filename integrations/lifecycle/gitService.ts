import { execFileSync as runBinarySync } from 'node:child_process';

type LocalConfigValue = { value?: string }['value'];

export interface ILifecycleGitService {
  runGit(args: ReadonlyArray<string>, cwd: string): string;
  resolveRepoRoot(cwd: string): string;
  statusShort(cwd: string): string;
  trackedNodeModulesPaths(cwd: string): ReadonlyArray<string>;
  pathTracked(cwd: string, path: string): boolean;
  applyLocalConfig(cwd: string, key: string, value: string): void;
  clearLocalConfig(cwd: string, key: string): void;
  localConfig(cwd: string, key: string): LocalConfigValue;
}

const splitNonEmptyLines = (value: string): ReadonlyArray<string> =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

export class LifecycleGitService implements ILifecycleGitService {
  runGit(args: ReadonlyArray<string>, cwd: string): string {
    return runBinarySync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  }

  resolveRepoRoot(cwd: string): string {
    return this.runGit(['rev-parse', '--show-toplevel'], cwd).trim();
  }

  statusShort(cwd: string): string {
    return this.runGit(['status', '--short'], cwd);
  }

  trackedNodeModulesPaths(cwd: string): ReadonlyArray<string> {
    const output = this.runGit(['ls-files', '--', 'node_modules', 'node_modules/**'], cwd);
    return splitNonEmptyLines(output);
  }

  pathTracked(cwd: string, path: string): boolean {
    const output = this.runGit(['ls-files', '--', path], cwd);
    return splitNonEmptyLines(output).includes(path);
  }

  applyLocalConfig(cwd: string, key: string, value: string): void {
    this.runGit(['config', '--local', key, value], cwd);
  }

  clearLocalConfig(cwd: string, key: string): void {
    try {
      this.runGit(['config', '--local', '--unset', key], cwd);
    } catch (error) {
      void error;
    }
  }

  localConfig(cwd: string, key: string): LocalConfigValue {
    try {
      return this.runGit(['config', '--local', '--get', key], cwd).trim();
    } catch {
      return undefined;
    }
  }
}
