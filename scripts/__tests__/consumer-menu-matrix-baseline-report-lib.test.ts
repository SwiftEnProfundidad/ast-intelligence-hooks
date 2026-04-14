import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildConsumerMenuMatrixBaselineSnapshot,
  renderConsumerMenuMatrixBaselineSummary,
} from '../consumer-menu-matrix-baseline-report-lib';
import type { ConsumerMenuMatrixBaselineReport } from '../framework-menu-matrix-baseline-lib';
import type { LifecycleDoctorReport } from '../../integrations/lifecycle/doctor';
import type { GovernanceObservationSnapshot } from '../../integrations/lifecycle/governanceObservationSnapshot';
import type { LifecycleStatus } from '../../integrations/lifecycle/status';

const buildBaseline = (): ConsumerMenuMatrixBaselineReport => {
  return {
    rounds: [
      {
        byOption: {
          '1': {
            stage: 'PRE_COMMIT',
            outcome: 'BLOCK',
            filesScanned: 164,
            totalViolations: 3,
            diagnosis: 'violations-detected',
          },
          '2': {
            stage: 'PRE_PUSH',
            outcome: 'PASS',
            filesScanned: 2,
            totalViolations: 0,
            diagnosis: 'repo-clean',
          },
          '3': {
            stage: 'PRE_COMMIT',
            outcome: 'PASS',
            filesScanned: 0,
            totalViolations: 0,
            diagnosis: 'scope-empty',
          },
          '4': {
            stage: 'PRE_PUSH',
            outcome: 'PASS',
            filesScanned: 0,
            totalViolations: 0,
            diagnosis: 'scope-empty',
          },
          '9': {
            stage: 'PRE_PUSH',
            outcome: 'PASS',
            filesScanned: 0,
            totalViolations: 0,
            diagnosis: 'scope-empty',
          },
        },
      },
    ],
    analysis: {
      stable: true,
      byOption: {
        '1': { stable: true, driftFields: [] },
        '2': { stable: true, driftFields: [] },
        '3': { stable: true, driftFields: [] },
        '4': { stable: true, driftFields: [] },
        '9': { stable: true, driftFields: [] },
      },
    },
  };
};

const buildGovernanceObservation = (): GovernanceObservationSnapshot => ({
  schema_version: '1',
  sdd: {
    experimental_raw: null,
    effective_mode: 'off',
    experimental_source: 'default',
  },
  sdd_session: {
    active: false,
    valid: false,
    change_id: null,
    remaining_seconds: null,
  },
  policy_strict: {
    pre_write: false,
    pre_commit: false,
    pre_push: false,
    ci: false,
  },
  enterprise_warn_as_block_env: false,
  evidence: {
    path: '/tmp/ios-architecture-showcase/.ai_evidence.json',
    readable: 'missing',
    human_summary_preview: [],
  },
  git: {
    current_branch: 'feature/s1-governance-console',
    on_protected_branch_hint: false,
  },
  contract_surface: {
    agents_md: true,
    skills_lock_json: true,
    skills_sources_json: true,
    vendor_skills_dir: true,
    pumuki_adapter_json: true,
  },
  attention_codes: ['POLICY_PRE_WRITE_NOT_STRICT'],
  governance_effective: 'attention',
  agent_bootstrap_hints: ['AGENTS.md presente.'],
});

const buildStatus = (): LifecycleStatus => {
  return {
    repoRoot: '/tmp/ios-architecture-showcase',
    packageVersion: '6.3.57',
    version: {
      installed: '6.3.57',
      lifecycleVersion: '6.3.57',
      effective: '6.3.57',
      drift: 'none',
      recommendation: 'aligned',
    },
    lifecycleState: {
      installed: 'false',
      version: null,
      configHash: null,
      installedAt: null,
      updatedAt: null,
    },
    hookStatus: {
      'pre-commit': { filePath: '.git/hooks/pre-commit', exists: false, managedBlockPresent: false },
      'pre-push': { filePath: '.git/hooks/pre-push', exists: false, managedBlockPresent: false },
      'commit-msg': { filePath: '.git/hooks/commit-msg', exists: false, managedBlockPresent: false },
    },
    hooksDirectory: '.git/hooks',
    hooksDirectoryResolution: 'default',
    trackedNodeModulesCount: 0,
    policyValidation: {
      stages: {
        PRE_COMMIT: {
          source: 'default',
          layer: 'policy-pack',
          activation: 'default-advisory',
          activationSource: null,
          bundle: 'default',
          hash: 'hash-pre-commit',
          version: null,
          signature: null,
          policySource: null,
          validationStatus: 'valid',
          validationCode: 'POLICY_AS_CODE_VALID',
          strict: false,
        },
        PRE_PUSH: {
          source: 'default',
          layer: 'policy-pack',
          activation: 'default-advisory',
          activationSource: null,
          bundle: 'default',
          hash: 'hash-pre-push',
          version: null,
          signature: null,
          policySource: null,
          validationStatus: 'valid',
          validationCode: 'POLICY_AS_CODE_VALID',
          strict: false,
        },
        CI: {
          source: 'default',
          layer: 'policy-pack',
          activation: 'default-advisory',
          activationSource: null,
          bundle: 'default',
          hash: 'hash-ci',
          version: null,
          signature: null,
          policySource: null,
          validationStatus: 'valid',
          validationCode: 'POLICY_AS_CODE_VALID',
          strict: false,
        },
      },
    },
    experimentalFeatures: {
      features: {
        analytics: {
          layer: 'experimental',
          mode: 'off',
          source: 'default',
          blocking: false,
          activationVariable: 'PUMUKI_EXPERIMENTAL_ANALYTICS',
          legacyActivationVariable: null,
        },
        heuristics: {
          layer: 'experimental',
          mode: 'off',
          source: 'default',
          blocking: false,
          activationVariable: 'PUMUKI_EXPERIMENTAL_HEURISTICS',
          legacyActivationVariable: null,
        },
        learning_context: {
          layer: 'experimental',
          mode: 'off',
          source: 'default',
          blocking: false,
          activationVariable: 'PUMUKI_EXPERIMENTAL_LEARNING_CONTEXT',
          legacyActivationVariable: null,
        },
        mcp_enterprise: {
          layer: 'experimental',
          mode: 'off',
          source: 'default',
          blocking: false,
          activationVariable: 'PUMUKI_EXPERIMENTAL_MCP_ENTERPRISE',
          legacyActivationVariable: null,
        },
        operational_memory: {
          layer: 'experimental',
          mode: 'off',
          source: 'default',
          blocking: false,
          activationVariable: 'PUMUKI_EXPERIMENTAL_OPERATIONAL_MEMORY',
          legacyActivationVariable: null,
        },
        pre_write: {
          layer: 'experimental',
          mode: 'off',
          source: 'default',
          blocking: false,
          activationVariable: 'PUMUKI_EXPERIMENTAL_PRE_WRITE',
          legacyActivationVariable: 'PUMUKI_PREWRITE_ENFORCEMENT',
        },
        saas_ingestion: {
          layer: 'experimental',
          mode: 'off',
          source: 'default',
          blocking: false,
          activationVariable: 'PUMUKI_EXPERIMENTAL_SAAS_INGESTION',
          legacyActivationVariable: null,
        },
        sdd: {
          layer: 'experimental',
          mode: 'off',
          source: 'default',
          blocking: false,
          activationVariable: 'PUMUKI_EXPERIMENTAL_SDD',
          legacyActivationVariable: null,
        },
      },
    },
    governanceObservation: buildGovernanceObservation(),
  };
};

const buildDoctor = (): LifecycleDoctorReport => {
  const status = buildStatus();
  return {
    repoRoot: '/tmp/ios-architecture-showcase',
    packageVersion: '6.3.57',
    version: {
      installed: '6.3.57',
      lifecycleVersion: '6.3.57',
      effective: '6.3.57',
      drift: 'none',
      recommendation: 'aligned',
    },
    lifecycleState: {
      installed: 'false',
      version: null,
      configHash: null,
      installedAt: null,
      updatedAt: null,
    },
    trackedNodeModulesPaths: [],
    hookStatus: status.hookStatus,
    hooksDirectory: '.git/hooks',
    hooksDirectoryResolution: 'default',
    policyValidation: status.policyValidation,
    experimentalFeatures: status.experimentalFeatures,
    governanceObservation: buildGovernanceObservation(),
    issues: [],
    deep: {
      enabled: true,
      blocking: false,
      contract: {
        overall: 'compatible',
        pumuki: { installed: true, version: '6.3.57' },
        openspec: {
          required: false,
          installed: true,
          version: '1.0.0',
          minimumVersion: '1.0.0',
          compatible: true,
        },
        hooks: { managed: false, managedCount: 0, totalCount: 3 },
        adapter: { valid: true },
      },
      checks: [
        {
          id: 'compatibility-contract',
          status: 'pass',
          layer: 'core',
          severity: 'info',
          message: 'core ok',
        },
        {
          id: 'upstream-readiness',
          status: 'warn',
          layer: 'operational',
          severity: 'warning',
          message: 'operational warn',
        },
        {
          id: 'adapter-wiring',
          status: 'pass',
          layer: 'integration',
          severity: 'info',
          message: 'integration ok',
        },
        {
          id: 'policy-drift',
          status: 'warn',
          layer: 'policy-pack',
          severity: 'warning',
          message: 'policy warn',
        },
      ],
    },
  };
};

test('buildConsumerMenuMatrixBaselineSnapshot conserva contrato útil para acceptance', () => {
  const snapshot = buildConsumerMenuMatrixBaselineSnapshot({
    generatedAt: '2026-03-14T10:00:00.000Z',
    fixture: 'ios-architecture-showcase',
    repoRoot: '/tmp/ios-architecture-showcase',
    baseline: buildBaseline(),
    status: buildStatus(),
    doctor: buildDoctor(),
  });

  assert.equal(snapshot.fixture, 'ios-architecture-showcase');
  assert.equal(snapshot.repoRoot, '/tmp/ios-architecture-showcase');
  assert.equal(snapshot.rounds, 1);
  assert.equal(snapshot.stable, true);
  assert.equal(snapshot.latestRound.byOption['1'].totalViolations, 3);
  assert.equal(snapshot.doctor.layerSummary.core.verdict, 'PASS');
  assert.equal(snapshot.doctor.layerSummary.operational.verdict, 'WARN');
  assert.equal(snapshot.doctor.layerSummary.experimental.verdict, 'PASS');
});

test('renderConsumerMenuMatrixBaselineSummary publica drift, capas y latest round', () => {
  const summary = renderConsumerMenuMatrixBaselineSummary(
    buildConsumerMenuMatrixBaselineSnapshot({
      generatedAt: '2026-03-14T10:00:00.000Z',
      fixture: 'ios-architecture-showcase',
      repoRoot: '/tmp/ios-architecture-showcase',
      baseline: buildBaseline(),
      status: buildStatus(),
      doctor: buildDoctor(),
    })
  );

  assert.match(summary, /# Consumer Menu Matrix Baseline/);
  assert.match(summary, /- fixture: ios-architecture-showcase/);
  assert.match(summary, /- stable: YES/);
  assert.match(summary, /- layer core: verdict=PASS/);
  assert.match(summary, /- layer policy-pack: verdict=WARN/);
  assert.match(summary, /- layer experimental: verdict=PASS/);
  assert.match(summary, /- option 1: stable=YES drift=none/);
  assert.match(
    summary,
    /- option 1: stage=PRE_COMMIT outcome=BLOCK files_scanned=164 total_violations=3 diagnosis=violations-detected/
  );
});
