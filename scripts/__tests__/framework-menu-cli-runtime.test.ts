import { spawnSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
import test from 'node:test';

const runFrameworkMenu = (env: NodeJS.ProcessEnv) =>
  spawnSync(process.execPath, ['bin/pumuki-framework.js'], {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    encoding: 'utf8',
    input: '10\n',
  });

test('framework menu CLI exits cleanly in classic mode', () => {
  const result = runFrameworkMenu({
    PUMUKI_MENU_UI_V2: '0',
    PUMUKI_MENU_COLOR: '0',
  });

  assert.equal(
    result.status,
    0,
    `framework menu classic mode must exit 0\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
  assert.ok(!result.stderr.includes('ReferenceError'));
});

test('framework menu CLI exits cleanly in modern mode', () => {
  const result = runFrameworkMenu({
    PUMUKI_MENU_UI_V2: '1',
    PUMUKI_MENU_COLOR: '0',
  });

  assert.equal(
    result.status,
    0,
    `framework menu modern mode must exit 0\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
  assert.ok(!result.stderr.includes('ReferenceError'));
});
