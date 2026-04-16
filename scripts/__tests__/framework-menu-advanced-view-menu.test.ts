import assert from 'node:assert/strict';
import test from 'node:test';
import { createFrameworkMenuActions } from '../framework-menu-actions';
import {
  formatAdvancedMenuClassicView,
  formatAdvancedMenuView,
} from '../framework-menu-advanced-view-lib';
import { createFrameworkMenuPrompts } from '../framework-menu-prompts';
import type { ConsumerPreflightResult } from '../framework-menu-consumer-preflight-types';

const noop = async (): Promise<void> => {};

const buildAdvancedActions = () => {
  const fakeRl = {
    question: async () => '',
  };
  const prompts = createFrameworkMenuPrompts(
    fakeRl as unknown as Parameters<typeof createFrameworkMenuPrompts>[0]
  );
  return createFrameworkMenuActions({
    prompts,
    runStaged: noop,
    runRange: noop,
    runRepoAudit: noop,
    runRepoAndStagedAudit: noop,
    runStagedAndUnstagedAudit: noop,
    resolveDefaultRangeFrom: () => 'HEAD~1',
    printActiveSkillsBundles: () => {},
  });
};

const buildConsumerPreflightResult = (): ConsumerPreflightResult => ({
  stage: 'PRE_COMMIT',
  status: 'ALLOWED',
  result: {
    stage: 'PRE_COMMIT',
    status: 'ALLOWED',
    allowed: true,
    policy: {
      stage: 'PRE_COMMIT',
      resolved_stage: 'PRE_COMMIT',
      block_on_or_above: 'ERROR',
      warn_on_or_above: 'WARN',
      trace: { source: 'default', bundle: 'gate-policy.default.PRE_COMMIT', hash: 'hash' },
    },
    evidence: {
      kind: 'valid',
      max_age_seconds: 900,
      age_seconds: 120,
      source: { source: 'local-file', path: '/tmp/repo/.ai_evidence.json', digest: null, generated_at: null },
    },
    repo_state: {
      repo_root: '/tmp/repo',
      git: {
        available: true,
        branch: 'feature/s1-console',
        upstream: 'origin/feature/s1-console',
        ahead: 0,
        behind: 0,
        dirty: false,
        staged: 0,
        unstaged: 0,
      },
      lifecycle: {
        installed: true,
        package_version: '6.3.77',
        lifecycle_version: '6.3.77',
        hooks: { pre_commit: 'managed', pre_push: 'managed' },
      },
    },
    violations: [],
  },
  governanceObservation: {
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
      path: '/tmp/repo/.ai_evidence.json',
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
  },
  governanceNextAction: {
    stage: 'PRE_COMMIT',
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
  },
  policyValidation: {
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
  },
  experimentalFeatures: {
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
  },
  hints: [],
  notificationResults: [],
});

test('formatAdvancedMenuView renderiza secciones por dominio y ayuda contextual corta', () => {
  const rendered = formatAdvancedMenuView(buildAdvancedActions(), {
    evidenceSummary: {
      status: 'ok',
      stage: 'PRE_PUSH',
      outcome: 'PASS',
      totalFindings: 0,
      bySeverity: { CRITICAL: 0, ERROR: 0, WARN: 0, INFO: 0 },
      topFiles: [],
    },
  });

  assert.match(rendered, /Pumuki Framework Menu \(Advanced\)/);
  assert.match(rendered, /\b1\)\s+Gates\b/);
  assert.match(rendered, /\b2\)\s+Diagnostics\b/);
  assert.match(rendered, /\b3\)\s+Legacy Read-Only Audits\b/);
  assert.match(rendered, /\b4\)\s+Maintenance\b/);
  assert.match(rendered, /\b5\)\s+Validation\b/);
  assert.match(rendered, /\b6\)\s+System\b/);
  assert.match(rendered, /1\)\s+Evaluate staged changes \(PRE_COMMIT policy\)\s+-\s+Evalua solo los cambios staged/i);
  assert.match(
    rendered,
    /28\)\s+Legacy read-only audit: full repository snapshot[\s\S]*Auditoria legacy\/read-only/i
  );
  assert.match(rendered, /27\)\s+Exit/);
});

test('formatAdvancedMenuView conserva ayuda de opcion 8 sin truncar .ai_evidence.json', () => {
  const rendered = formatAdvancedMenuView(buildAdvancedActions(), {
    evidenceSummary: {
      status: 'ok',
      stage: 'PRE_PUSH',
      outcome: 'PASS',
      totalFindings: 0,
      bySeverity: { CRITICAL: 0, ERROR: 0, WARN: 0, INFO: 0 },
      topFiles: [],
    },
  });

  assert.match(rendered, /Read current \.ai_evidence\.json[\s\S]*Lee el \.ai_evidence\.json actual/i);
});

test('formatAdvancedMenuView muestra ayuda contextual de opcion 33 para importar custom rules', () => {
  const rendered = formatAdvancedMenuView(buildAdvancedActions(), {
    evidenceSummary: {
      status: 'ok',
      stage: 'PRE_PUSH',
      outcome: 'PASS',
      totalFindings: 0,
      bySeverity: { CRITICAL: 0, ERROR: 0, WARN: 0, INFO: 0 },
      topFiles: [],
    },
  });

  assert.match(
    rendered,
    /33\)\s+Import custom skills rules[\s\S]*Importa reglas custom[\s\S]*AGENTS\.md\/SKILLS\.md/i
  );
});

test('formatAdvancedMenuView muestra bloque visible de governance cuando existe preflight', () => {
  const rendered = formatAdvancedMenuView(buildAdvancedActions(), {
    evidenceSummary: {
      status: 'ok',
      stage: 'PRE_PUSH',
      outcome: 'PASS',
      totalFindings: 0,
      bySeverity: { CRITICAL: 0, ERROR: 0, WARN: 0, INFO: 0 },
      topFiles: [],
    },
    preflight: buildConsumerPreflightResult(),
  });

  assert.match(rendered, /Governance Console/);
  assert.match(rendered, /Governance truth:/);
  assert.match(rendered, /Governance next action:/);
  assert.match(rendered, /Policy-as-code: PRE_WRITE=POLICY_AS_CODE_VALID strict=yes/);
  assert.match(rendered, /Experimental: ANALYTICS=off/);
});

test('formatAdvancedMenuClassicView conserva formato legacy sin panel agrupado', () => {
  const rendered = formatAdvancedMenuClassicView(buildAdvancedActions(), {
    evidenceSummary: {
      status: 'ok',
      stage: 'PRE_COMMIT',
      outcome: 'PASS',
      totalFindings: 0,
      bySeverity: { CRITICAL: 0, ERROR: 0, WARN: 0, INFO: 0 },
      topFiles: [],
    },
  });

  assert.match(rendered, /Pumuki Framework Menu \(Advanced\)/);
  assert.match(rendered, /C\. Switch to consumer menu/);
  assert.match(rendered, /1\.\s+Evaluate staged changes/);
  assert.match(rendered, /27\.\s+Exit/);
});
