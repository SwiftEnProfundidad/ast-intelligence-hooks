import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveEnterpriseContractProfiles } from '../enterprise-contract-suite-contract';

test('resolveEnterpriseContractProfiles returns deterministic profile order', () => {
  const profiles = resolveEnterpriseContractProfiles();
  assert.deepEqual(
    profiles.map((profile) => profile.id),
    ['minimal', 'block', 'minimal-repeat', 'telemetry-rotation']
  );
});

test('resolveEnterpriseContractProfiles keeps unique ids and expected exit codes', () => {
  const profiles = resolveEnterpriseContractProfiles();
  const ids = new Set<string>();
  const expectedExitCodes = new Map([
    ['minimal', 0],
    ['block', 0],
    ['minimal-repeat', 0],
    ['telemetry-rotation', 0],
  ]);

  for (const profile of profiles) {
    assert.equal(ids.has(profile.id), false);
    ids.add(profile.id);
    assert.match(profile.mode, /^(minimal|block)$/);
    assert.equal(profile.expectedExitCode, expectedExitCodes.get(profile.id));
  }
});
