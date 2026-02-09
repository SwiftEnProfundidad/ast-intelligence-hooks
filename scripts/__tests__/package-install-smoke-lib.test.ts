import assert from 'node:assert/strict';
import test from 'node:test';
import { parsePackageInstallSmokeMode } from '../package-install-smoke-lib';

test('parsePackageInstallSmokeMode defaults to block when mode is omitted', () => {
  assert.equal(parsePackageInstallSmokeMode([]), 'block');
});

test('parsePackageInstallSmokeMode accepts explicit minimal mode', () => {
  assert.equal(parsePackageInstallSmokeMode(['--mode=minimal']), 'minimal');
});

test('parsePackageInstallSmokeMode rejects unsupported mode values', () => {
  assert.throws(
    () => parsePackageInstallSmokeMode(['--mode=unsupported']),
    /Unsupported --mode value/
  );
});
