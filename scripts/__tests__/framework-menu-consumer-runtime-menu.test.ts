import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createConsumerMenuRuntime } from '../framework-menu-consumer-runtime-lib';
import { renderConsumerRuntimeModernMenu } from '../framework-menu-consumer-runtime-menu';
import { formatAdvancedMenuView } from '../framework-menu-advanced-view-lib';
import { createFrameworkMenuActions } from '../framework-menu-actions';
import { createFrameworkMenuPrompts } from '../framework-menu-prompts';
import type { ConsumerPreflightResult } from '../framework-menu-consumer-preflight-types';

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

const buildAdvancedActions = () => {
  const fakeRl = {
    question: async () => '',
  };
  const prompts = createFrameworkMenuPrompts(
    fakeRl as unknown as Parameters<typeof createFrameworkMenuPrompts>[0]
  );
  return createFrameworkMenuActions({
    prompts,
    runStaged: async () => {},
    runRange: async () => {},
    runRepoAudit: async () => {},
    runRepoAndStagedAudit: async () => {},
    runStagedAndUnstagedAudit: async () => {},
    resolveDefaultRangeFrom: () => 'HEAD~1',
    printActiveSkillsBundles: () => {},
  });
};

test('consumer runtime printMenu agrupa opciones por shell mínima y diagnósticos legacy read-only', async () => {
  const previousUiV2 = process.env.PUMUKI_MENU_UI_V2;
  process.env.PUMUKI_MENU_UI_V2 = '1';
  try {
    const output: string[] = [];
    const runtime = createConsumerMenuRuntime({
      runRepoGate: async () => {},
      runRepoAndStagedGate: async () => {},
      runStagedGate: async () => {},
      runWorkingTreeGate: async () => {},
      runPreflight: async () => {},
      write: (text) => {
        output.push(text);
      },
    });

    runtime.printMenu();
    const rendered = output.join('\n');
    assert.match(rendered, /Read-Only Gate Flows/i);
    assert.match(rendered, /Legacy Read-Only Export/i);
    assert.match(rendered, /Legacy Read-Only Diagnostics/i);
    assert.match(rendered, /System/i);
    assert.match(rendered, /1\)\s+Read-only full audit/i);
    assert.match(rendered, /8\)\s+Export legacy read-only evidence snapshot/i);
    assert.match(rendered, /10\)\s+Exit/i);
  } finally {
    if (typeof previousUiV2 === 'string') {
      process.env.PUMUKI_MENU_UI_V2 = previousUiV2;
    } else {
      delete process.env.PUMUKI_MENU_UI_V2;
    }
  }
});

test('consumer runtime printMenu muestra badge de estado PASS/WARN/BLOCK', { concurrency: false }, async () => {
  const previousUiV2 = process.env.PUMUKI_MENU_UI_V2;
  process.env.PUMUKI_MENU_UI_V2 = '1';
  const previous = process.cwd();
  const temp = mkdtempSync(join(tmpdir(), 'pumuki-menu-runtime-badge-'));
  process.chdir(temp);
  try {
    writeFileSync(
      join(temp, '.ai_evidence.json'),
      JSON.stringify(
        {
          snapshot: {
            stage: 'PRE_COMMIT',
            outcome: 'BLOCK',
            findings: [
              {
                ruleId: 'backend.avoid-explicit-any',
                severity: 'ERROR',
                filePath: 'apps/backend/src/service.ts',
              },
            ],
            files_scanned: 10,
            files_affected: 1,
          },
          severity_metrics: {
            by_severity: {
              CRITICAL: 0,
              ERROR: 1,
              WARN: 0,
              INFO: 0,
            },
          },
        },
        null,
        2
      )
    );

    const output: string[] = [];
    const runtime = createConsumerMenuRuntime({
      runRepoGate: async () => {},
      runRepoAndStagedGate: async () => {},
      runStagedGate: async () => {},
      runWorkingTreeGate: async () => {},
      runPreflight: async () => {},
      write: (text) => {
        output.push(text);
      },
    });

    runtime.printMenu();
    assert.match(output.join('\n'), /BLOCK/i);
  } finally {
    process.chdir(previous);
    if (typeof previousUiV2 === 'string') {
      process.env.PUMUKI_MENU_UI_V2 = previousUiV2;
    } else {
      delete process.env.PUMUKI_MENU_UI_V2;
    }
  }
});

test('renderConsumerRuntimeModernMenu muestra bloque visible de governance cuando existe preflight', () => {
  const rendered = renderConsumerRuntimeModernMenu({
    actions: createConsumerMenuRuntime({
      runRepoGate: async () => {},
      runRepoAndStagedGate: async () => {},
      runStagedGate: async () => {},
      runWorkingTreeGate: async () => {},
      runPreflight: async () => {},
      write: () => {},
    }).actions,
    repoRoot: '/tmp/repo',
    useColor: () => false,
    preflight: buildConsumerPreflightResult(),
  });

  assert.match(rendered, /Governance Console/);
  assert.match(rendered, /Governance truth:/);
  assert.match(rendered, /Governance next action:/);
  assert.match(rendered, /Policy-as-code: PRE_WRITE=POLICY_AS_CODE_VALID strict=yes/);
  assert.match(rendered, /Experimental: ANALYTICS=off/);
});

test('consumer runtime printMenu usa vista clásica agrupada por shell mínima cuando PUMUKI_MENU_UI_V2 no está activo', async () => {
  const previousUiV2 = process.env.PUMUKI_MENU_UI_V2;
  delete process.env.PUMUKI_MENU_UI_V2;
  try {
    const output: string[] = [];
    const runtime = createConsumerMenuRuntime({
      runRepoGate: async () => {},
      runRepoAndStagedGate: async () => {},
      runStagedGate: async () => {},
      runWorkingTreeGate: async () => {},
      runPreflight: async () => {},
      write: (text) => {
        output.push(text);
      },
    });
    runtime.printMenu();
    const rendered = output.join('\n');
    assert.match(rendered, /A\. Switch to advanced menu/);
    assert.match(rendered, /Read-Only Gate Flows/i);
    assert.match(rendered, /Legacy Read-Only Diagnostics/i);
  } finally {
    if (typeof previousUiV2 === 'string') {
      process.env.PUMUKI_MENU_UI_V2 = previousUiV2;
    }
  }
});

test('consumer runtime exposes blocked summary so advanced menu can stay aligned with consumer gate', async () => {
  const runtime = createConsumerMenuRuntime({
    runRepoGate: async () => {},
    runRepoAndStagedGate: async () => ({
      blocked: {
        stage: 'PRE_PUSH',
        totalViolations: 3,
        causeCode: 'GIT_ATOMICITY_TOO_MANY_SCOPES',
        causeMessage: 'Atomicity budget exceeded.',
        remediation: 'Split the change by scope.',
      },
    }),
    runStagedGate: async () => {},
    runWorkingTreeGate: async () => {},
    runPreflight: async () => {},
    write: () => {},
  });

  const strictRepoAndStaged = runtime.actions.find((action) => action.id === '2');
  assert.ok(strictRepoAndStaged);
  await strictRepoAndStaged.execute();

  const summary = runtime.readCurrentSummary();
  assert.ok(summary);
  assert.equal(summary.outcome, 'BLOCK');

  const rendered = formatAdvancedMenuView(buildAdvancedActions(), {
    evidenceSummary: summary,
  });

  assert.match(rendered, /\bBLOCK\b/);
});
