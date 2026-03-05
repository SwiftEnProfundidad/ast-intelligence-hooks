import assert from 'node:assert/strict';
import test from 'node:test';
import type { RepoState } from '../../evidence/schema';
import type { AiGateCheckResult, AiGateViolation } from '../../gate/evaluateAiGate';
import type { SddEvaluateResult } from '../../sdd/types';
import { getCurrentPumukiVersion } from '../packageInfo';
import { buildPreWriteAutomationTrace } from '../preWriteAutomation';

const sampleRepoState: RepoState = {
  repo_root: '/repo',
  git: {
    available: true,
    branch: 'feature/prewrite-sync',
    upstream: null,
    ahead: 0,
    behind: 0,
    dirty: false,
    staged: 0,
    unstaged: 0,
  },
  lifecycle: {
    installed: true,
    package_version: getCurrentPumukiVersion(),
    lifecycle_version: getCurrentPumukiVersion(),
    hooks: {
      pre_commit: 'managed',
      pre_push: 'managed',
    },
  },
};

const buildSddAllowed = (): SddEvaluateResult => ({
  stage: 'PRE_WRITE',
  decision: {
    allowed: true,
    code: 'ALLOWED',
    message: 'allowed',
  },
  status: {
    repoRoot: '/repo',
    openspec: {
      installed: true,
      version: '1.2.0',
      projectInitialized: true,
      minimumVersion: '1.1.1',
      recommendedVersion: '1.1.1',
      compatible: true,
      parsedVersion: '1.2.0',
    },
    session: {
      repoRoot: '/repo',
      active: true,
      changeId: 'p9-prewrite-sync',
      valid: true,
    },
  },
});

const toViolation = (code: string): AiGateViolation => ({
  code,
  severity: 'ERROR',
  message: code,
});

const buildAiGate = (violations: AiGateViolation[]): AiGateCheckResult => {
  const blocked = violations.some((violation) => violation.severity === 'ERROR');
  return {
    stage: 'PRE_WRITE',
    status: blocked ? 'BLOCKED' : 'ALLOWED',
    allowed: !blocked,
    policy: {
      stage: 'PRE_WRITE',
      resolved_stage: 'PRE_COMMIT',
      block_on_or_above: 'ERROR',
      warn_on_or_above: 'WARN',
      trace: {
        source: 'default',
        bundle: 'skills.policy.default',
        hash: 'hash',
      },
    },
    evidence: {
      kind: 'valid',
      max_age_seconds: 300,
      age_seconds: 5,
      source: {
        source: 'local-file',
        path: '/repo/.ai_evidence.json',
        digest: 'sha256:1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        generated_at: '2026-03-03T00:00:00.000Z',
      },
    },
    mcp_receipt: {
      required: true,
      kind: 'valid',
      path: '/repo/.pumuki/artifacts/mcp-ai-gate-receipt.json',
      max_age_seconds: 300,
      age_seconds: 5,
    },
    repo_state: sampleRepoState,
    violations,
  };
};

test('buildPreWriteAutomationTrace aplica retry backoff único cuando persiste violación auto-curable', async () => {
  let runPlatformGateCalls = 0;
  let runEnterpriseCalls = 0;
  const sleepCalls: number[] = [];
  const aiGateSequence: AiGateCheckResult[] = [
    buildAiGate([toViolation('EVIDENCE_STALE')]),
    buildAiGate([]),
  ];

  const result = await buildPreWriteAutomationTrace(
    {
      repoRoot: '/repo',
      sdd: buildSddAllowed(),
      aiGate: buildAiGate([toViolation('EVIDENCE_BRANCH_MISMATCH')]),
      runPlatformGate: async () => {
        runPlatformGateCalls += 1;
        return 0;
      },
    },
    {
      runEnterpriseAiGateCheck: () => {
        const aiGate = aiGateSequence[Math.min(runEnterpriseCalls, aiGateSequence.length - 1)]!;
        runEnterpriseCalls += 1;
        return {
          tool: 'ai_gate_check',
          dryRun: true,
          executed: true,
          success: aiGate.allowed,
          result: aiGate,
        };
      },
      evaluateAiGate: () => buildAiGate([]),
      writeMcpAiGateReceipt: () => ({
        path: '/repo/.pumuki/artifacts/mcp-ai-gate-receipt.json',
        receipt: {
          version: '1',
          source: 'pumuki-enterprise-mcp',
          tool: 'ai_gate_check',
          repo_root: '/repo',
          stage: 'PRE_WRITE',
          status: 'ALLOWED',
          allowed: true,
          issued_at: new Date('2026-03-03T00:00:00.000Z').toISOString(),
        },
      }),
      retryBackoffMs: 25,
      sleep: async (ms: number) => {
        sleepCalls.push(ms);
      },
    }
  );

  assert.equal(runPlatformGateCalls, 1);
  assert.equal(runEnterpriseCalls, 2);
  assert.deepEqual(sleepCalls, [25]);
  assert.equal(result.aiGate.allowed, true);
  assert.deepEqual(
    result.trace.actions.map((item) => item.action),
    ['refresh_evidence', 'retry_backoff']
  );
  assert.equal(result.trace.actions[1]?.details.includes('EVIDENCE_STALE'), true);
});

test('buildPreWriteAutomationTrace no ejecuta retry cuando no hay violaciones auto-curables', async () => {
  let runPlatformGateCalls = 0;
  let runEnterpriseCalls = 0;
  let sleepCalled = false;
  const blockedAiGate = buildAiGate([toViolation('GITFLOW_PROTECTED_BRANCH')]);

  const result = await buildPreWriteAutomationTrace(
    {
      repoRoot: '/repo',
      sdd: buildSddAllowed(),
      aiGate: blockedAiGate,
      runPlatformGate: async () => {
        runPlatformGateCalls += 1;
        return 0;
      },
    },
    {
      runEnterpriseAiGateCheck: () => {
        runEnterpriseCalls += 1;
        return {
          tool: 'ai_gate_check',
          dryRun: true,
          executed: true,
          success: blockedAiGate.allowed,
          result: blockedAiGate,
        };
      },
      evaluateAiGate: () => blockedAiGate,
      writeMcpAiGateReceipt: () => ({
        path: '/repo/.pumuki/artifacts/mcp-ai-gate-receipt.json',
        receipt: {
          version: '1',
          source: 'pumuki-enterprise-mcp',
          tool: 'ai_gate_check',
          repo_root: '/repo',
          stage: 'PRE_WRITE',
          status: 'BLOCKED',
          allowed: false,
          issued_at: new Date('2026-03-03T00:00:00.000Z').toISOString(),
        },
      }),
      sleep: async () => {
        sleepCalled = true;
      },
    }
  );

  assert.equal(runPlatformGateCalls, 0);
  assert.equal(runEnterpriseCalls, 0);
  assert.equal(sleepCalled, false);
  assert.equal(result.aiGate.allowed, false);
  assert.equal(result.trace.attempted, false);
  assert.equal(result.trace.actions.length, 0);
});

test('buildPreWriteAutomationTrace refresca evidencia cuando PRE_WRITE llega con EVIDENCE_GATE_BLOCKED', async () => {
  let runPlatformGateCalls = 0;
  let runEnterpriseCalls = 0;
  let sleepCalled = false;
  const refreshedAiGate = buildAiGate([]);

  const result = await buildPreWriteAutomationTrace(
    {
      repoRoot: '/repo',
      sdd: buildSddAllowed(),
      aiGate: buildAiGate([toViolation('EVIDENCE_GATE_BLOCKED')]),
      runPlatformGate: async () => {
        runPlatformGateCalls += 1;
        return 0;
      },
    },
    {
      runEnterpriseAiGateCheck: () => {
        runEnterpriseCalls += 1;
        return {
          tool: 'ai_gate_check',
          dryRun: true,
          executed: true,
          success: refreshedAiGate.allowed,
          result: refreshedAiGate,
        };
      },
      evaluateAiGate: () => refreshedAiGate,
      writeMcpAiGateReceipt: () => ({
        path: '/repo/.pumuki/artifacts/mcp-ai-gate-receipt.json',
        receipt: {
          version: '1',
          source: 'pumuki-enterprise-mcp',
          tool: 'ai_gate_check',
          repo_root: '/repo',
          stage: 'PRE_WRITE',
          status: 'ALLOWED',
          allowed: true,
          issued_at: new Date('2026-03-03T00:00:00.000Z').toISOString(),
        },
      }),
      sleep: async () => {
        sleepCalled = true;
      },
    }
  );

  assert.equal(runPlatformGateCalls, 1);
  assert.equal(runEnterpriseCalls, 1);
  assert.equal(sleepCalled, false);
  assert.equal(result.aiGate.allowed, true);
  assert.deepEqual(
    result.trace.actions.map((item) => item.action),
    ['refresh_evidence']
  );
});
