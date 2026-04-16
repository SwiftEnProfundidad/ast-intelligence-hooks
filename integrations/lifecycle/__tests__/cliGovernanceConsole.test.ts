import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildGovernanceConsoleSummaryLines,
  printGovernanceConsoleHuman,
} from '../cliGovernanceConsole';
import type { LifecycleExperimentalFeaturesSnapshot } from '../experimentalFeaturesSnapshot';
import type { GovernanceNextActionSummary } from '../governanceNextAction';
import type { GovernanceObservationSnapshot } from '../governanceObservationSnapshot';
import type { LifecyclePolicyValidationSnapshot } from '../policyValidationSnapshot';

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
    pre_write: true,
    pre_commit: true,
    pre_push: true,
    ci: true,
  },
  enterprise_warn_as_block_env: false,
  evidence: {
    path: '.ai/evidence/latest.json',
    readable: 'valid',
    snapshot_stage: 'PRE_WRITE',
    snapshot_outcome: 'PASS',
    matched_warn_count: 0,
    matched_blocking_count: 0,
    findings_count: 0,
    ai_gate_status: 'ALLOWED',
    human_summary_preview: ['repo-clean'],
  },
  git: {
    current_branch: 'feature/s1-console',
    on_protected_branch_hint: false,
  },
  contract_surface: {
    agents_md: true,
    skills_lock_json: true,
    skills_sources_json: true,
    vendor_skills_dir: true,
    pumuki_adapter_json: true,
  },
  tracking: {
    enforced: true,
    canonical_path: 'PUMUKI-RESET-MASTER-PLAN.md',
    canonical_present: true,
    in_progress_count: 1,
    single_in_progress_valid: true,
    conflict: false,
    legacy_files: [],
  },
  attention_codes: [],
  governance_effective: 'green',
  agent_bootstrap_hints: [],
});

const buildGovernanceNextAction = (): GovernanceNextActionSummary => ({
  stage: 'PRE_WRITE',
  phase: 'GREEN',
  action: 'proceed',
  confidence_pct: 90,
  reason_code: 'READY',
  instruction: 'Continúa con la implementación mínima.',
  message: 'Governance efectiva en verde.',
  next_action: {
    kind: 'info',
    message: 'No hace falta remediación.',
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

const buildExperimentalFeatures = (): LifecycleExperimentalFeaturesSnapshot => ({
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
      legacyActivationVariable: null,
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
});

test('buildGovernanceConsoleSummaryLines compone truth, next action, policy y experimentales en un bloque único', () => {
  const lines = buildGovernanceConsoleSummaryLines({
    governanceObservation: buildGovernanceObservation(),
    governanceNextAction: buildGovernanceNextAction(),
    policyValidation: buildPolicyValidation(),
    experimentalFeatures: buildExperimentalFeatures(),
  });

  assert.match(lines[0] ?? '', /Governance truth:/);
  assert.equal(lines.some((line) => /Governance: GREEN/.test(line)), true);
  assert.equal(lines.some((line) => /Evidence hint: repo-clean/.test(line)), true);
  assert.equal(lines.some((line) => /Governance next action:/.test(line)), true);
  assert.equal(lines.some((line) => /Instruction: Continúa con la implementación mínima\./.test(line)), true);
  assert.equal(lines.some((line) => /Policy-as-code: PRE_WRITE=POLICY_AS_CODE_VALID strict=yes/.test(line)), true);
  assert.equal(lines.some((line) => /Experimental: ANALYTICS=off/.test(line)), true);
  assert.equal(lines.some((line) => /Experimental: SDD=off/.test(line)), true);
});

test('printGovernanceConsoleHuman imprime cabecera compartida S1 y el bloque canónico completo', () => {
  const printed: string[] = [];
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);

  try {
    process.stdout.write = ((chunk: unknown): boolean => {
      printed.push(String(chunk).trimEnd());
      return true;
    }) as typeof process.stdout.write;

    printGovernanceConsoleHuman({
      governanceObservation: buildGovernanceObservation(),
      governanceNextAction: buildGovernanceNextAction(),
      policyValidation: buildPolicyValidation(),
      experimentalFeatures: buildExperimentalFeatures(),
    });

    const output = printed.join('\n');
    assert.match(output, /governance console \(S1 \/ shared status-doctor baseline\)/i);
    assert.match(output, /Governance truth:/);
    assert.match(output, /Governance next action:/);
    assert.match(output, /Policy-as-code: PRE_WRITE=POLICY_AS_CODE_VALID strict=yes/);
    assert.match(output, /Experimental: MCP_ENTERPRISE=off/);
  } finally {
    process.stdout.write = originalStdoutWrite;
  }
});
