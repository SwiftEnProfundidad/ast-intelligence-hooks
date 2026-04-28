import assert from 'node:assert/strict';
import test from 'node:test';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import type { IGitService } from '../../git/GitService';
import { runLifecycleAudit } from '../audit';

const buildGitStub = (repoRoot: string, untracked = ''): IGitService => ({
  resolveRepoRoot: () => repoRoot,
  runGit: (args) => {
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
