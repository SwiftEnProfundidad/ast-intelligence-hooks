import { spawnSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
import test from 'node:test';

const runFrameworkMenu = (params?: {
  env?: NodeJS.ProcessEnv;
  input?: string;
}) =>
  spawnSync(process.execPath, ['bin/pumuki-framework.js'], {
    cwd: process.cwd(),
    env: { ...process.env, ...(params?.env ?? {}) },
    encoding: 'utf8',
    input: params?.input ?? '10\n',
  });

const assertCanonicalGovernanceConsole = (stdout: string): void => {
  assert.match(stdout, /Governance Console/);
  assert.match(stdout, /Governance truth:/);
  assert.match(stdout, /Governance next action:/);
  assert.match(
    stdout,
    /Pre-write: mode=.* blocking=(yes|no) strict_policy=(yes|no) source=.*/i,
  );
  assert.match(
    stdout,
    /Next action: stage=.* phase=.* action=.* confidence=.*/i,
  );
  assert.match(stdout, /reason=.*/i);
};

test('framework menu CLI exits cleanly in classic mode', () => {
  const result = runFrameworkMenu({
    env: {
      PUMUKI_MENU_UI_V2: '0',
      PUMUKI_MENU_COLOR: '0',
    },
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
    env: {
      PUMUKI_MENU_UI_V2: '1',
      PUMUKI_MENU_COLOR: '0',
    },
  });

  assert.equal(
    result.status,
    0,
    `framework menu modern mode must exit 0\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
  assert.ok(!result.stderr.includes('ReferenceError'));
});

test('framework menu CLI consumer renderiza la consola canónica de governance', () => {
  const result = runFrameworkMenu({
    env: {
      PUMUKI_MENU_UI_V2: '1',
      PUMUKI_MENU_COLOR: '0',
    },
  });

  assert.equal(
    result.status,
    0,
    `framework menu consumer must exit 0\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
  assertCanonicalGovernanceConsole(result.stdout);
});

test('framework menu CLI advanced renderiza la consola canónica de governance en frío', () => {
  const result = runFrameworkMenu({
    env: {
      PUMUKI_MENU_MODE: 'advanced',
      PUMUKI_MENU_UI_V2: '1',
      PUMUKI_MENU_COLOR: '0',
    },
    input: '27\n',
  });

  assert.equal(
    result.status,
    0,
    `framework menu advanced must exit 0\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
  assertCanonicalGovernanceConsole(result.stdout);
});

test('framework menu CLI advanced clásico renderiza la consola canónica de governance en frío', () => {
  const result = runFrameworkMenu({
    env: {
      PUMUKI_MENU_MODE: 'advanced',
      PUMUKI_MENU_UI_V2: '0',
      PUMUKI_MENU_COLOR: '0',
    },
    input: '27\n',
  });

  assert.equal(
    result.status,
    0,
    `framework menu advanced classic must exit 0\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
  assertCanonicalGovernanceConsole(result.stdout);
});
