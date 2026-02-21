import assert from 'node:assert/strict';
import test from 'node:test';
import { LifecycleGitService } from '../gitService';

class StubLifecycleGitService extends LifecycleGitService {
  readonly calls: Array<{ args: ReadonlyArray<string>; cwd: string }> = [];
  private readonly outputs = new Map<string, string>();
  private readonly failures = new Set<string>();

  setOutput(args: ReadonlyArray<string>, output: string): void {
    this.outputs.set(args.join('\u0000'), output);
  }

  setFailure(args: ReadonlyArray<string>): void {
    this.failures.add(args.join('\u0000'));
  }

  override runGit(args: ReadonlyArray<string>, cwd: string): string {
    this.calls.push({ args, cwd });
    const key = args.join('\u0000');
    if (this.failures.has(key)) {
      throw new Error(`git ${args.join(' ')} failed`);
    }
    return this.outputs.get(key) ?? '';
  }
}

test('LifecycleGitService normaliza salida de repo root y lista tracked node_modules', () => {
  const git = new StubLifecycleGitService();
  const cwd = '/tmp/repo';

  git.setOutput(['rev-parse', '--show-toplevel'], '/tmp/repo\n');
  git.setOutput(
    ['ls-files', '--', 'node_modules', 'node_modules/**'],
    ' node_modules/a.js \n\nnode_modules/b.js\n'
  );

  assert.equal(git.resolveRepoRoot(cwd), '/tmp/repo');
  assert.deepEqual(git.trackedNodeModulesPaths(cwd), ['node_modules/a.js', 'node_modules/b.js']);
});

test('LifecycleGitService pathTracked exige coincidencia exacta de path', () => {
  const git = new StubLifecycleGitService();
  const cwd = '/tmp/repo';

  git.setOutput(['ls-files', '--', 'node_modules/a.js'], 'node_modules/a.js\n');
  git.setOutput(['ls-files', '--', 'node_modules/missing.js'], 'node_modules/other.js\n');

  assert.equal(git.pathTracked(cwd, 'node_modules/a.js'), true);
  assert.equal(git.pathTracked(cwd, 'node_modules/missing.js'), false);
});

test('LifecycleGitService localConfig devuelve undefined si git config falla', () => {
  const git = new StubLifecycleGitService();
  const cwd = '/tmp/repo';
  const key = 'pumuki.version';

  git.setFailure(['config', '--local', '--get', key]);
  assert.equal(git.localConfig(cwd, key), undefined);
});

test('LifecycleGitService clearLocalConfig absorbe errores y applyLocalConfig delega a git', () => {
  const git = new StubLifecycleGitService();
  const cwd = '/tmp/repo';
  const key = 'pumuki.installed';

  git.setFailure(['config', '--local', '--unset', key]);

  assert.doesNotThrow(() => git.clearLocalConfig(cwd, key));
  git.applyLocalConfig(cwd, key, 'true');

  const lastCall = git.calls[git.calls.length - 1];
  assert.deepEqual(lastCall?.args, ['config', '--local', key, 'true']);
  assert.equal(lastCall?.cwd, cwd);
});

test('LifecycleGitService statusShort delega al comando git status --short', () => {
  const git = new StubLifecycleGitService();
  const cwd = '/tmp/repo';
  const statusOutput = ' M package.json\n?? .ai_evidence.json\n';
  git.setOutput(['status', '--short'], statusOutput);

  assert.equal(git.statusShort(cwd), statusOutput);
  const lastCall = git.calls[git.calls.length - 1];
  assert.deepEqual(lastCall?.args, ['status', '--short']);
  assert.equal(lastCall?.cwd, cwd);
});

test('LifecycleGitService localConfig devuelve valor recortado cuando existe', () => {
  const git = new StubLifecycleGitService();
  const cwd = '/tmp/repo';
  const key = 'pumuki.version';
  git.setOutput(['config', '--local', '--get', key], ' 6.3.11 \n');

  assert.equal(git.localConfig(cwd, key), '6.3.11');
});

test('LifecycleGitService clearLocalConfig delega a git cuando la clave existe', () => {
  const git = new StubLifecycleGitService();
  const cwd = '/tmp/repo';
  const key = 'pumuki.hooks';
  git.setOutput(['config', '--local', '--unset', key], '');

  assert.doesNotThrow(() => git.clearLocalConfig(cwd, key));
  const lastCall = git.calls[git.calls.length - 1];
  assert.deepEqual(lastCall?.args, ['config', '--local', '--unset', key]);
  assert.equal(lastCall?.cwd, cwd);
});
