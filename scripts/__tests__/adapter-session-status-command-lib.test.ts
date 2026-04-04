import assert from 'node:assert/strict';
import test from 'node:test';
import { runAdapterSessionStatusCommand } from '../adapter-session-status-command-lib';

test('runAdapterSessionStatusCommand captures successful command output', () => {
  const result = runAdapterSessionStatusCommand({
    label: 'ok',
    command: 'echo "ready"',
    availability: 'available',
  });

  assert.equal(result.label, 'ok');
  assert.equal(result.command, 'echo "ready"');
  assert.equal(result.availability, 'available');
  assert.equal(result.exitCode, 0);
  assert.match(result.output, /ready/);
});

test('runAdapterSessionStatusCommand captures failure exit code and stderr', () => {
  const result = runAdapterSessionStatusCommand({
    label: 'fail',
    command: 'echo "boom" >&2; exit 7',
    availability: 'available',
  });

  assert.equal(result.label, 'fail');
  assert.equal(result.command, 'echo "boom" >&2; exit 7');
  assert.equal(result.availability, 'available');
  assert.equal(result.exitCode, 7);
  assert.match(result.output, /boom/);
});

test('runAdapterSessionStatusCommand degrades cleanly when capability is unavailable', () => {
  const result = runAdapterSessionStatusCommand({
    label: 'unavailable',
    command: 'npm run assess:adapter-hooks-session',
    availability: 'unavailable',
    unavailableReason: 'Consumer package.json does not expose `assess:adapter-hooks-session`.',
  });

  assert.equal(result.label, 'unavailable');
  assert.equal(result.availability, 'unavailable');
  assert.equal(result.exitCode, undefined);
  assert.match(result.output, /does not expose `assess:adapter-hooks-session`/);
});
