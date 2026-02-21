import { spawnSync as runSpawnSync } from 'node:child_process';

export interface ILifecycleNpmService {
  runNpm(args: ReadonlyArray<string>, cwd: string): void;
}

export class LifecycleNpmService implements ILifecycleNpmService {
  runNpm(args: ReadonlyArray<string>, cwd: string): void {
    const result = runSpawnSync('npm', args, {
      cwd,
      stdio: 'inherit',
      env: process.env,
    });
    if (result.error) {
      throw new Error(`npm ${args.join(' ')} failed: ${result.error.message}`);
    }
    if (typeof result.status !== 'number' || result.status !== 0) {
      throw new Error(`npm ${args.join(' ')} failed with exit code ${result.status ?? 'unknown'}`);
    }
  }
}
