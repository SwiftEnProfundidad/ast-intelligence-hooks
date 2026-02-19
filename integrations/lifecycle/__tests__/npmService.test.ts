import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import { LifecycleNpmService } from '../npmService';

test('LifecycleNpmService.runNpm no lanza error cuando npm finaliza con exit code 0', async () => {
  await withTempDir('pumuki-lifecycle-npm-success-', async (tempRoot) => {
    const service = new LifecycleNpmService();
    assert.doesNotThrow(() => {
      service.runNpm(['--version'], tempRoot);
    });
  });
});

test('LifecycleNpmService.runNpm lanza error cuando npm finaliza con exit code != 0', async () => {
  await withTempDir('pumuki-lifecycle-npm-fail-', async (tempRoot) => {
    writeFileSync(
      join(tempRoot, 'package.json'),
      JSON.stringify({ name: 'fixture', version: '1.0.0', scripts: {} }, null, 2),
      'utf8'
    );

    const service = new LifecycleNpmService();
    assert.throws(() => service.runNpm(['run', '__pumuki_missing_script__'], tempRoot), (error) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /^npm run __pumuki_missing_script__ failed with exit code /i);
      return true;
    });
  });
});

test('LifecycleNpmService.runNpm lanza error cuando spawnSync devuelve error', () => {
  const service = new LifecycleNpmService();
  const missingCwd = join('/tmp', `pumuki-missing-cwd-${Date.now()}`);
  mkdirSync('/tmp', { recursive: true });

  assert.throws(() => service.runNpm(['--version'], missingCwd), (error) => {
    assert.ok(error instanceof Error);
    assert.match(error.message, /^npm --version failed: /i);
    return true;
  });
});

test('LifecycleNpmService.runNpm incluye todos los argumentos en el mensaje de error', async () => {
  await withTempDir('pumuki-lifecycle-npm-args-', async (tempRoot) => {
    writeFileSync(
      join(tempRoot, 'package.json'),
      JSON.stringify({ name: 'fixture', version: '1.0.0', scripts: {} }, null, 2),
      'utf8'
    );

    const service = new LifecycleNpmService();
    const args = ['run', '__pumuki_missing_script__', '--', '--flag=value'];
    assert.throws(() => service.runNpm(args, tempRoot), (error) => {
      assert.ok(error instanceof Error);
      assert.match(error.message, /npm run __pumuki_missing_script__ -- --flag=value failed with exit code /i);
      return true;
    });
  });
});
