import assert from 'node:assert/strict';
import test from 'node:test';
import { readGovernanceNextAction } from '../governanceNextAction';
import type { GovernanceObservationSnapshot } from '../governanceObservationSnapshot';

const buildSnapshot = (
  attentionCodes: ReadonlyArray<string>
): GovernanceObservationSnapshot => {
  return {
    governance_effective: 'attention',
    attention_codes: attentionCodes,
    enterprise_warn_as_block_env: false,
    contract_surface: {
      skills_lock_json: true,
      skills_sources_json: true,
      pumuki_adapter_json: true,
    },
  } as GovernanceObservationSnapshot;
};

test('readGovernanceNextAction no degrada PRE_WRITE por policy gaps de otros stages', () => {
  const snapshot = buildSnapshot(['POLICY_PRE_COMMIT_NOT_STRICT']);

  const result = readGovernanceNextAction({
    repoRoot: process.cwd(),
    stage: 'PRE_WRITE',
    governanceObservation: snapshot,
  });

  assert.notEqual(result.reason_code, 'POLICY_STAGE_NOT_STRICT');
});

test('readGovernanceNextAction mantiene POLICY_STAGE_NOT_STRICT cuando PRE_WRITE no es estricto', () => {
  const snapshot = buildSnapshot(['POLICY_PRE_WRITE_NOT_STRICT']);

  const result = readGovernanceNextAction({
    repoRoot: process.cwd(),
    stage: 'PRE_WRITE',
    governanceObservation: snapshot,
  });

  assert.equal(result.reason_code, 'POLICY_STAGE_NOT_STRICT');
  assert.equal(result.action, 'run_command');
  assert.equal(result.next_action.kind, 'run_command');
});

test('readGovernanceNextAction alinea action con next_action.kind cuando la remediación es informativa', () => {
  const snapshot = buildSnapshot([]);

  const result = readGovernanceNextAction({
    repoRoot: process.cwd(),
    stage: 'PRE_WRITE',
    governanceObservation: snapshot,
  });

  assert.equal(result.reason_code, 'GOVERNANCE_ATTENTION');
  assert.equal(result.action, 'info');
  assert.equal(result.next_action.kind, 'info');
});
