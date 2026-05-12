import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import type { IGitService } from '../../git/GitService';
import type { runPlatformGate } from '../../git/runPlatformGate';
import { runLifecycleAudit } from '../audit';

const buildGitStub = (repoRoot: string, untracked = '', staged = ''): IGitService => ({
  resolveRepoRoot: () => repoRoot,
  runGit: (args) => {
    if (args.join(' ') === 'diff --cached --name-only') {
      return staged;
    }
    if (args.join(' ') === 'ls-files --others --exclude-standard') {
      return untracked;
    }
    return '';
  },
  getStagedFacts: () => [],
  getUnstagedFacts: () => [],
  getRepoFacts: () => [],
  getRepoAndStagedFacts: () => [],
  getStagedAndUnstagedFacts: () => [],
});

const buildEvidence = (
  snapshot: Partial<AiEvidenceV2_1['snapshot']>
): AiEvidenceV2_1 =>
  ({
    version: '2.1',
    timestamp: '2026-04-28T00:00:00.000Z',
    operational_hints: {
      requires_second_pass: false,
      second_pass_reason: null,
      human_summary_lines: [],
    },
    snapshot: {
      stage: 'PRE_COMMIT',
      outcome: 'PASS',
      findings: [],
      ...snapshot,
    },
    ledger: [],
    platforms: {},
    rulesets: [],
    human_intent: {
      primary_goal: null,
      secondary_goals: [],
      non_goals: [],
      constraints: [],
      confidence_level: 'unset',
      set_by: null,
      set_at: null,
      expires_at: null,
      preserved_at: '2026-04-28T00:00:00.000Z',
      preservation_count: 0,
    },
    ai_gate: {
      status: snapshot.outcome === 'BLOCK' ? 'BLOCKED' : 'ALLOWED',
      violations: [],
      human_intent: {
        primary_goal: null,
        secondary_goals: [],
        non_goals: [],
        constraints: [],
        confidence_level: 'unset',
        set_by: null,
        set_at: null,
        expires_at: null,
        preserved_at: '2026-04-28T00:00:00.000Z',
        preservation_count: 0,
      },
    },
    severity_metrics: {
      gate_status: snapshot.outcome === 'BLOCK' ? 'BLOCKED' : 'ALLOWED',
      total_violations: 0,
      by_severity: {},
      by_enterprise_severity: {},
    },
    repo_state: {
      repo_root: '/repo',
      git: {
        available: true,
        branch: 'hotfix/test',
        upstream: null,
        ahead: 0,
        behind: 0,
        dirty: false,
        staged: 0,
        unstaged: 0,
      },
      lifecycle: {
        installed: true,
        package_version: '6.3.117',
        lifecycle_version: '6.3.117',
        hooks: {
          pre_commit: 'managed',
          pre_push: 'managed',
        },
      },
    },
  }) as AiEvidenceV2_1;

test('runLifecycleAudit expone findings canónicos en JSON', async () => {
  const result = await runLifecycleAudit({
    stage: 'PRE_COMMIT',
    auditMode: 'gate',
    dependencies: {
      git: buildGitStub('/repo', 'apps/ios/App.swift\nREADME.md\n'),
      resolvePolicyForStage: (stage) =>
        ({
          policy: { stage, blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
          trace: { stage },
        }) as never,
      runPlatformGate: async () => 1,
      readEvidence: () =>
        buildEvidence({
          stage: 'PRE_COMMIT',
          outcome: 'BLOCK',
          files_scanned: 3,
          rules_coverage: {
            stage: 'PRE_COMMIT',
            contract: 'AUTO_RUNTIME_RULES_FOR_STAGE',
            scope_note: 'AUTO runtime only',
            active_rule_ids: ['skills.ios.no-navigation-view'],
            evaluated_rule_ids: ['skills.ios.no-navigation-view'],
            matched_rule_ids: ['skills.ios.no-navigation-view'],
            unevaluated_rule_ids: [],
            registry_totals: {
              total: 10,
              auto: 2,
              declarative: 8,
            },
            stage_applicable_auto_rule_ids: ['skills.ios.no-navigation-view'],
            declarative_rule_ids: ['skills.ios.design-contract'],
            declarative_excluded_reason: 'DECLARATIVE rules are not runtime detectors.',
            counts: {
              active: 1,
              evaluated: 1,
              matched: 1,
              unevaluated: 0,
              registry_total: 10,
              registry_auto: 2,
              registry_declarative: 8,
              stage_applicable_auto: 1,
            },
            coverage_ratio: 1,
          },
          findings: [
            {
              ruleId: 'skills.ios.no-navigation-view',
              severity: 'ERROR',
              code: 'SKILLS_IOS_NO_NAVIGATION_VIEW',
              message: 'Use NavigationStack.',
              file: 'apps/ios/App.swift',
              lines: [12],
              blocking: true,
            },
          ],
        }),
    },
  });

  assert.equal(result.stage, 'PRE_COMMIT');
  assert.equal(result.gate_exit_code, 1);
  assert.equal(result.files_scanned, 3);
  assert.equal(result.findings_count, 1);
  assert.equal(result.blocking_findings_count, 1);
  assert.equal(result.findings[0]?.code, 'SKILLS_IOS_NO_NAVIGATION_VIEW');
  assert.equal(result.untracked_matching_extensions_count, 1);
  assert.equal(result.rules_coverage?.contract, 'AUTO_RUNTIME_RULES_FOR_STAGE');
  assert.equal(result.rules_coverage?.registry_totals?.declarative, 8);
  assert.equal(result.rule_id_normalization.entries[0]?.status, 'registry_1_to_1');
});

test('runLifecycleAudit mantiene JSON accionable si el gate bloquea sin findings', async () => {
  const result = await runLifecycleAudit({
    stage: 'PRE_WRITE',
    auditMode: 'gate',
    dependencies: {
      git: buildGitStub('/repo'),
      resolvePolicyForStage: (stage) =>
        ({
          policy: { stage, blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
          trace: { stage },
        }) as never,
      runPlatformGate: async () => 1,
      readEvidence: () =>
        buildEvidence({
          stage: 'PRE_WRITE',
          outcome: 'BLOCK',
          findings: [],
        }),
    },
  });

  assert.equal(result.stage, 'PRE_WRITE');
  assert.equal(result.findings_count, 1);
  assert.equal(result.blocking_findings_count, 1);
  assert.equal(result.findings[0]?.code, 'AUDIT_BLOCKED_WITHOUT_FINDINGS');
});

test('runLifecycleAudit usa scope staged en PRE_WRITE cuando hay staged soportado', async () => {
  let observedScope: Parameters<typeof runPlatformGate>[0]['scope'] | undefined;
  const result = await runLifecycleAudit({
    stage: 'PRE_WRITE',
    auditMode: 'gate',
    dependencies: {
      git: buildGitStub(
        '/repo',
        '',
        [
          'stack-my-architecture-governance/project/GovernanceKit/Package.swift',
          'stack-my-architecture-governance/project/GovernanceKit/README.md',
        ].join('\n')
      ),
      resolvePolicyForStage: (stage) =>
        ({
          policy: { stage, blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
          trace: { stage },
        }) as never,
      runPlatformGate: async (params) => {
        observedScope = params.scope;
        return 0;
      },
      readEvidence: () =>
        buildEvidence({
          stage: 'PRE_WRITE',
          outcome: 'PASS',
          files_scanned: 1,
          findings: [],
        }),
    },
  });

  assert.equal(observedScope?.kind, 'staged');
  assert.equal(result.scope.kind, 'staged');
  assert.equal(result.scope.staged_matching_extensions_count, 1);
  assert.equal(result.gate_exit_code, 0);
  assert.equal(result.findings_count, 0);
});

test('runLifecycleAudit no bloquea audit staged PRE_WRITE solo por enforcement global incompleto', async () => {
  const result = await runLifecycleAudit({
    stage: 'PRE_WRITE',
    auditMode: 'gate',
    dependencies: {
      git: buildGitStub(
        '/repo',
        '',
        'stack-my-architecture-governance/project/GovernanceKit/Package.swift'
      ),
      resolvePolicyForStage: (stage) =>
        ({
          policy: { stage, blockOnOrAbove: 'ERROR', warnOnOrAbove: 'WARN' },
          trace: { stage },
        }) as never,
      runPlatformGate: async () => 1,
      readEvidence: () =>
        buildEvidence({
          stage: 'PRE_WRITE',
          outcome: 'BLOCK',
          files_scanned: 1,
          findings: [
            {
              ruleId: 'governance.skills.global-enforcement.incomplete',
              severity: 'ERROR',
              code: 'SKILLS_GLOBAL_ENFORCEMENT_INCOMPLETE_CRITICAL',
              message: 'Global skills enforcement incomplete.',
              file: '.ai_evidence.json',
              blocking: true,
            },
          ],
        }),
    },
  });

  assert.equal(result.scope.kind, 'staged');
  assert.equal(result.gate_exit_code, 0);
  assert.equal(result.findings_count, 1);
  assert.equal(result.blocking_findings_count, 0);
  assert.equal(result.findings[0]?.code, 'AUDIT_SCOPED_GLOBAL_ENFORCEMENT_ADVISORY');
  assert.equal(result.findings[0]?.blocking, false);
});
