import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import type { ILifecycleGitService } from '../gitService';
import { readGovernanceObservationSnapshot } from '../governanceObservationSnapshot';
import type { LifecycleExperimentalFeaturesSnapshot } from '../experimentalFeaturesSnapshot';
import type { LifecyclePolicyValidationSnapshot } from '../policyValidationSnapshot';

const buildExperimentalFeatures = (): LifecycleExperimentalFeaturesSnapshot => ({
  features: {
    analytics: { layer: 'experimental', mode: 'off', source: 'default', blocking: false, activationVariable: 'PUMUKI_EXPERIMENTAL_ANALYTICS', legacyActivationVariable: null },
    heuristics: { layer: 'experimental', mode: 'off', source: 'default', blocking: false, activationVariable: 'PUMUKI_EXPERIMENTAL_HEURISTICS', legacyActivationVariable: null },
    learning_context: { layer: 'experimental', mode: 'off', source: 'default', blocking: false, activationVariable: 'PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT', legacyActivationVariable: null },
    mcp_enterprise: { layer: 'experimental', mode: 'off', source: 'default', blocking: false, activationVariable: 'PUMUKI_EXPERIMENTAL_MCP_ENTERPRISE', legacyActivationVariable: null },
    operational_memory: { layer: 'experimental', mode: 'off', source: 'default', blocking: false, activationVariable: 'PUMUKI_EXPERIMENTAL_OPERATIONAL_MEMORY', legacyActivationVariable: null },
    pre_write: { layer: 'experimental', mode: 'off', source: 'default', blocking: false, activationVariable: 'PUMUKI_EXPERIMENTAL_PRE_WRITE', legacyActivationVariable: null },
    saas_ingestion: { layer: 'experimental', mode: 'off', source: 'default', blocking: false, activationVariable: 'PUMUKI_EXPERIMENTAL_SAAS_INGESTION', legacyActivationVariable: null },
    sdd: { layer: 'experimental', mode: 'off', source: 'default', blocking: false, activationVariable: 'PUMUKI_EXPERIMENTAL_SDD', legacyActivationVariable: null },
  },
});

const buildPolicyValidation = (): LifecyclePolicyValidationSnapshot => ({
  stages: {
    PRE_WRITE: {
      source: 'default',
      bundle: 'default',
      hash: 'hash-pre-write',
      version: null,
      signature: null,
      policySource: null,
      validationStatus: 'valid',
      validationCode: 'POLICY_AS_CODE_VALID',
      strict: true,
    },
    PRE_COMMIT: {
      source: 'default',
      bundle: 'default',
      hash: 'hash-pre-commit',
      version: null,
      signature: null,
      policySource: null,
      validationStatus: 'valid',
      validationCode: 'POLICY_AS_CODE_VALID',
      strict: true,
    },
    PRE_PUSH: {
      source: 'default',
      bundle: 'default',
      hash: 'hash-pre-push',
      version: null,
      signature: null,
      policySource: null,
      validationStatus: 'valid',
      validationCode: 'POLICY_AS_CODE_VALID',
      strict: true,
    },
    CI: {
      source: 'default',
      bundle: 'default',
      hash: 'hash-ci',
      version: null,
      signature: null,
      policySource: null,
      validationStatus: 'valid',
      validationCode: 'POLICY_AS_CODE_VALID',
      strict: true,
    },
  },
});

const buildRepoRoot = (): string => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-governance-observation-'));
  writeFileSync(join(repoRoot, 'AGENTS.md'), '# AGENTS\n', 'utf8');
  writeFileSync(join(repoRoot, 'skills.lock.json'), JSON.stringify({ version: '1.0', bundles: [] }, null, 2), 'utf8');
  return repoRoot;
};

const fakeGit: ILifecycleGitService = {
  runGit: () => '',
  resolveRepoRoot: (cwd: string) => cwd,
  statusShort: () => '',
  trackedNodeModulesPaths: () => [],
  pathTracked: () => false,
  applyLocalConfig: () => {},
  clearLocalConfig: () => {},
  localConfig: () => undefined,
};

test('readGovernanceObservationSnapshot marca POLICY_HASH_DIVERGENCE cuando los hashes de policy difieren entre stages', () => {
  const repoRoot = buildRepoRoot();
  try {
    const snapshot = readGovernanceObservationSnapshot({
      repoRoot,
      experimentalFeatures: buildExperimentalFeatures(),
      policyValidation: buildPolicyValidation(),
      git: fakeGit,
    });

    assert.equal(snapshot.attention_codes.includes('POLICY_HASH_DIVERGENCE'), true);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
