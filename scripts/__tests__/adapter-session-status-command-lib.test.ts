import assert from 'node:assert/strict';
import test from 'node:test';
import { runAdapterSessionStatusCommand } from '../adapter-session-status-command-lib';

test('runAdapterSessionStatusCommand captures successful command output', () => {
  const result = runAdapterSessionStatusCommand({
    label: 'ok',
    command: 'echo "ready"',
  });

  assert.equal(result.label, 'ok');
  assert.equal(result.command, 'echo "ready"');
  assert.equal(result.exitCode, 0);
  assert.match(result.output, /ready/);
});

test('runAdapterSessionStatusCommand captures failure exit code and stderr', () => {
  const result = runAdapterSessionStatusCommand({
    label: 'fail',
    command: 'echo "boom" >&2; exit 7',
  });

  assert.equal(result.label, 'fail');
  assert.equal(result.command, 'echo "boom" >&2; exit 7');
  assert.equal(result.exitCode, 7);
  assert.match(result.output, /boom/);
});
