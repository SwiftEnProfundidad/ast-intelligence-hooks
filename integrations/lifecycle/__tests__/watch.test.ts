import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import type { AiEvidenceV2_1 } from '../../evidence/schema';
import type { PolicyReconcileReport } from '../policyReconcile';
import { runLifecycleWatch } from '../watch';

type WatchDependencies = NonNullable<Parameters<typeof runLifecycleWatch>[1]>;

const makeEvidence = (params: {
  outcome: 'ALLOW' | 'WARN' | 'BLOCK';
  findingSeverity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  findingCode: string;
  findingMessage: string;
  aiGateStatus?: 'ALLOWED' | 'BLOCKED';
  aiGateViolationCode?: string;
}): AiEvidenceV2_1 =>
  ({
    timestamp: '2026-03-05T10:00:00.000Z',
    snapshot: {
      outcome: params.outcome,
      findings: [
        {
          ruleId: 'rule.sample',
          severity: params.findingSeverity,
          code: params.findingCode,
          message: params.findingMessage,
          filePath: 'src/sample.ts',
          matchedBy: 'AstRule',
          source: 'skills.backend.sample',
        },
      ],
    },
    ai_gate: {
      status: params.aiGateStatus ?? (params.outcome === 'BLOCK' ? 'BLOCKED' : 'ALLOWED'),
      violations: params.aiGateViolationCode
        ? [{ code: params.aiGateViolationCode, severity: 'ERROR', message: params.findingMessage }]
        : [],
    },
  }) as AiEvidenceV2_1;

const makePolicyReconcileReport = (
  autofixStatus: PolicyReconcileReport['autofix']['status']
): PolicyReconcileReport => ({
  command: 'pumuki policy reconcile',
  repoRoot: '/repo',
  generatedAt: '2026-03-05T10:00:00.000Z',
  strictRequested: true,
  applyRequested: true,
  autofix: {
    attempted: autofixStatus !== 'SKIPPED',
    status: autofixStatus,
    actions: autofixStatus === 'APPLIED' ? ['WRITE_POLICY_AS_CODE_CONTRACT'] : [],
    details: autofixStatus === 'APPLIED' ? 'applied' : 'no-op',
  },
  summary: {
    total: 0,
    blocking: 0,
    errors: 0,
    warnings: 0,
    infos: 0,
    status: 'PASS',
  },
  requiredSkills: [],
  stages: {
    PRE_COMMIT: {
      source: 'default',
      bundle: 'default',
      hash: 'hash-pre-commit',
      version: null,
      signature: 'sig-pre-commit',
      policySource: 'file:.pumuki/policy-as-code.json',
      validationStatus: 'valid',
      validationCode: 'POLICY_AS_CODE_VALID',
      strict: true,
    },
    PRE_PUSH: {
      source: 'default',
      bundle: 'default',
      hash: 'hash-pre-push',
      version: null,
      signature: 'sig-pre-push',
      policySource: 'file:.pumuki/policy-as-code.json',
      validationStatus: 'valid',
      validationCode: 'POLICY_AS_CODE_VALID',
      strict: true,
    },
    CI: {
      source: 'default',
      bundle: 'default',
      hash: 'hash-ci',
      version: null,
      signature: 'sig-ci',
      policySource: 'file:.pumuki/policy-as-code.json',
      validationStatus: 'valid',
      validationCode: 'POLICY_AS_CODE_VALID',
      strict: true,
    },
  },
  drifts: [],
});

const allowAtomicity = () => ({
  enabled: true,
  allowed: true,
  violations: [],
});

const withAllowedAtomicity = (dependencies: WatchDependencies): WatchDependencies => ({
  evaluateGitAtomicity: allowAtomicity,
  ...dependencies,
});

test('runLifecycleWatch ejecuta evaluate->notify en cambios de worktree', async () => {
  const blockedNotifications: Array<{ code: string }> = [];
  const summaryNotifications: number[] = [];
  const tickLines: string[] = [];
  let tokenIndex = 0;
  let evalIndex = 0;

  const result = await runLifecycleWatch(
    {
      stage: 'PRE_COMMIT',
      scope: 'workingTree',
      intervalMs: 250,
      notifyCooldownMs: 0,
      severityThreshold: 'high',
      notifyEnabled: true,
      maxIterations: 2,
      onTick: (tick) => {
        tickLines.push(`${tick.tick}:${tick.notification}`);
      },
    },
    withAllowedAtomicity({
      resolveRepoRoot: () => '/repo',
      readChangeToken: () => {
        const value = tokenIndex === 0 ? 'A' : 'B';
        tokenIndex += 1;
        return value;
      },
      resolvePolicyForStage: (stage) => ({
        policy: {
          stage,
          blockOnOrAbove: 'ERROR',
          warnOnOrAbove: 'WARN',
        },
        trace: {
          source: 'default',
          bundle: 'default',
          hash: 'hash',
        },
      }),
      runPlatformGate: async () => {
        evalIndex += 1;
        return evalIndex === 1 ? 1 : 0;
      },
      resolveFactsForGateScope: async () => [
        {
          kind: 'FileChange',
          path: 'src/sample.ts',
          changeType: 'modified',
          source: 'git:working-tree',
        },
        {
          kind: 'FileContent',
          path: 'src/sample.ts',
          content: 'export const sample = true',
          source: 'git:working-tree',
        },
      ],
      readEvidence: () =>
        evalIndex === 1
          ? makeEvidence({
              outcome: 'BLOCK',
              findingSeverity: 'ERROR',
              findingCode: 'FIRST_BLOCK',
              findingMessage: 'primer bloqueo',
              aiGateStatus: 'BLOCKED',
              aiGateViolationCode: 'FIRST_BLOCK',
            })
          : makeEvidence({
              outcome: 'ALLOW',
              findingSeverity: 'ERROR',
              findingCode: 'SECOND_ALERT',
              findingMessage: 'alerta alta',
              aiGateStatus: 'ALLOWED',
            }),
      emitGateBlockedNotification: (params) => {
        blockedNotifications.push({ code: params.causeCode });
        return { delivered: true, reason: 'delivered' };
      },
      emitAuditSummaryNotificationFromEvidence: () => {
        summaryNotifications.push(1);
        return { delivered: true, reason: 'delivered' };
      },
      nowMs: () => 1000 + evalIndex * 1000,
      sleep: async () => {},
    })
  );

  assert.equal(result.evaluations, 2);
  assert.equal(result.notificationsSent, 2);
  assert.equal(result.notificationsSuppressed, 0);
  assert.deepEqual(blockedNotifications, [{ code: 'FIRST_BLOCK' }]);
  assert.equal(summaryNotifications.length, 1);
  assert.deepEqual(result.lastTick.changedFiles, ['src/sample.ts']);
  assert.deepEqual(result.lastTick.evaluatedFiles, ['src/sample.ts']);
  assert.equal(tickLines.length, 2);
});

test('runLifecycleWatch expone metadata de versión efectiva/runtime y alerta drift cuando difieren', async () => {
  const result = await runLifecycleWatch(
    {
      stage: 'PRE_COMMIT',
      scope: 'workingTree',
      intervalMs: 250,
      notifyCooldownMs: 0,
      severityThreshold: 'high',
      notifyEnabled: false,
      maxIterations: 1,
    },
    withAllowedAtomicity({
      resolveRepoRoot: () => '/repo',
      readChangeToken: () => 'A',
      resolvePumukiVersionMetadata: () => ({
        resolvedVersion: '6.3.45',
        runtimeVersion: '6.3.46',
        consumerInstalledVersion: '6.3.45',
        source: 'consumer-node-modules',
      }),
      resolvePolicyForStage: (stage) => ({
        policy: {
          stage,
          blockOnOrAbove: 'ERROR',
          warnOnOrAbove: 'WARN',
        },
        trace: {
          source: 'default',
          bundle: 'default',
          hash: 'hash',
        },
      }),
      runPlatformGate: async () => 0,
      resolveFactsForGateScope: async () => [],
      readEvidence: () => makeEvidence({
        outcome: 'ALLOW',
        findingSeverity: 'INFO',
        findingCode: 'NO_FINDINGS',
        findingMessage: 'allow',
      }),
      emitGateBlockedNotification: () => ({ delivered: true, reason: 'delivered' }),
      emitAuditSummaryNotificationFromEvidence: () => ({ delivered: true, reason: 'delivered' }),
      nowMs: () => 1000,
      sleep: async () => {},
    })
  );

  assert.equal(result.version.effective, '6.3.45');
  assert.equal(result.version.runtime, '6.3.46');
  assert.equal(result.version.source, 'consumer-node-modules');
  assert.equal(result.version.driftFromRuntime, true);
  assert.match(result.version.driftWarning ?? '', /Version drift detectado/i);
  assert.equal(result.lastTick.changed, false);
  assert.deepEqual(result.lastTick.changedFiles, []);
  assert.deepEqual(result.lastTick.evaluatedFiles, []);
});

test('runLifecycleWatch usa el repoRoot solicitado al resolver facts y ejecutar el gate cross-repo', async () => {
  const factsRepoRoots: string[] = [];
  const gateRepoRoots: string[] = [];

  const result = await runLifecycleWatch(
    {
      repoRoot: '/target/repo',
      stage: 'PRE_COMMIT',
      scope: 'workingTree',
      intervalMs: 250,
      notifyCooldownMs: 0,
      severityThreshold: 'high',
      notifyEnabled: false,
      maxIterations: 1,
    },
    withAllowedAtomicity({
      resolveRepoRoot: () => '/current/repo',
      readChangeToken: (repoRoot) => {
        assert.equal(repoRoot, '/target/repo');
        return 'A';
      },
      resolvePolicyForStage: (stage) => ({
        policy: {
          stage,
          blockOnOrAbove: 'ERROR',
          warnOnOrAbove: 'WARN',
        },
        trace: {
          source: 'default',
          bundle: 'default',
          hash: 'hash',
        },
      }),
      resolveFactsForGateScope: async ({ git }) => {
        factsRepoRoots.push(git.resolveRepoRoot());
        return [];
      },
      runPlatformGate: async (params) => {
        gateRepoRoots.push(params.services?.git?.resolveRepoRoot() ?? 'missing');
        return 0;
      },
      readEvidence: () =>
        makeEvidence({
          outcome: 'ALLOW',
          findingSeverity: 'INFO',
          findingCode: 'NO_FINDINGS',
          findingMessage: 'allow',
        }),
      emitGateBlockedNotification: () => ({ delivered: true, reason: 'delivered' }),
      emitAuditSummaryNotificationFromEvidence: () => ({ delivered: true, reason: 'delivered' }),
      nowMs: () => 1000,
      sleep: async () => {},
    })
  );

  assert.equal(result.repoRoot, '/target/repo');
  assert.deepEqual(factsRepoRoots, ['/target/repo']);
  assert.deepEqual(gateRepoRoots, ['/target/repo']);
});

test('runLifecycleWatch bloquea por atomicidad antes del gate en PRE_PUSH y no arrastra findings legacy', async () => {
  let gateCalls = 0;
  const blockedNotifications: Array<{ code: string }> = [];

  const result = await runLifecycleWatch(
    {
      stage: 'PRE_PUSH',
      scope: 'repo',
      intervalMs: 250,
      notifyCooldownMs: 0,
      severityThreshold: 'high',
      notifyEnabled: true,
      maxIterations: 1,
    },
    withAllowedAtomicity({
      resolveRepoRoot: () => '/repo',
      readChangeToken: () => 'A',
      resolveUpstreamRef: () => 'origin/main',
      resolvePolicyForStage: (stage) => ({
        policy: {
          stage,
          blockOnOrAbove: 'ERROR',
          warnOnOrAbove: 'WARN',
        },
        trace: {
          source: 'default',
          bundle: 'default',
          hash: 'hash',
        },
      }),
      evaluateGitAtomicity: () => ({
        enabled: true,
        allowed: false,
        violations: [
          {
            code: 'GIT_ATOMICITY_TOO_MANY_SCOPES',
            message: 'delta mezcla demasiados scopes',
            remediation: 'divide el cambio en slices atómicos',
          },
        ],
      }),
      runPlatformGate: async () => {
        gateCalls += 1;
        return 1;
      },
      resolveFactsForGateScope: async () => [
        {
          kind: 'FileChange',
          path: 'src/blocking.ts',
          changeType: 'modified',
          source: 'git:working-tree',
        },
        {
          kind: 'FileContent',
          path: 'src/blocking.ts',
          content: 'export const blocking = true',
          source: 'git:working-tree',
        },
      ],
      readEvidence: () =>
        makeEvidence({
          outcome: 'BLOCK',
          findingSeverity: 'ERROR',
          findingCode: 'LEGACY_FALSE_POSITIVE',
          findingMessage: 'legacy finding should not leak',
          aiGateStatus: 'BLOCKED',
          aiGateViolationCode: 'LEGACY_FALSE_POSITIVE',
        }),
      emitGateBlockedNotification: (params) => {
        blockedNotifications.push({ code: params.causeCode });
        return { delivered: true, reason: 'delivered' };
      },
      emitAuditSummaryNotificationFromEvidence: () => ({ delivered: true, reason: 'delivered' }),
      nowMs: () => 1000,
      sleep: async () => {},
    })
  );

  assert.equal(gateCalls, 0);
  assert.equal(result.lastTick.gateExitCode, 1);
  assert.equal(result.lastTick.gateOutcome, 'BLOCK');
  assert.deepEqual(result.lastTick.topCodes, ['GIT_ATOMICITY_TOO_MANY_SCOPES']);
  assert.equal(result.lastTick.totalFindings, 1);
  assert.equal(result.lastTick.findingsAtOrAboveThreshold, 1);
  assert.deepEqual(blockedNotifications, [{ code: 'GIT_ATOMICITY_TOO_MANY_SCOPES' }]);
});

test('runLifecycleWatch aplica anti-spam por cooldown y firma duplicada', async () => {
  let tokenIndex = 0;
  let nowIndex = 0;
  const nowValues = [1000, 1100];
  const blockedNotifications: Array<{ code: string }> = [];

  const result = await runLifecycleWatch(
    {
      stage: 'PRE_PUSH',
      scope: 'workingTree',
      intervalMs: 250,
      notifyCooldownMs: 60_000,
      severityThreshold: 'high',
      notifyEnabled: true,
      maxIterations: 2,
    },
    withAllowedAtomicity({
      resolveRepoRoot: () => '/repo',
      readChangeToken: () => {
        const value = tokenIndex === 0 ? 'A' : 'B';
        tokenIndex += 1;
        return value;
      },
      resolvePolicyForStage: (stage) => ({
        policy: {
          stage,
          blockOnOrAbove: 'ERROR',
          warnOnOrAbove: 'WARN',
        },
        trace: {
          source: 'default',
          bundle: 'default',
          hash: 'hash',
        },
      }),
      runPlatformGate: async () => 1,
      resolveFactsForGateScope: async () => [
        {
          kind: 'FileChange',
          path: 'src/blocking.ts',
          changeType: 'modified',
          source: 'git:working-tree',
        },
        {
          kind: 'FileContent',
          path: 'src/blocking.ts',
          content: 'export const blocking = true',
          source: 'git:working-tree',
        },
      ],
      readEvidence: () =>
        makeEvidence({
          outcome: 'BLOCK',
          findingSeverity: 'ERROR',
          findingCode: 'SAME_BLOCK',
          findingMessage: 'bloqueo repetido',
          aiGateStatus: 'BLOCKED',
          aiGateViolationCode: 'SAME_BLOCK',
        }),
      emitGateBlockedNotification: (params) => {
        blockedNotifications.push({ code: params.causeCode });
        return { delivered: true, reason: 'delivered' };
      },
      emitAuditSummaryNotificationFromEvidence: () => ({ delivered: true, reason: 'delivered' }),
      nowMs: () => {
        const value = nowValues[Math.min(nowIndex, nowValues.length - 1)] ?? 0;
        nowIndex += 1;
        return value;
      },
      sleep: async () => {},
    })
  );

  assert.equal(result.evaluations, 2);
  assert.equal(result.notificationsSent, 1);
  assert.equal(result.notificationsSuppressed, 1);
  assert.equal(result.lastTick.notification, 'suppressed-duplicate');
  assert.deepEqual(result.lastTick.changedFiles, ['src/blocking.ts']);
  assert.deepEqual(result.lastTick.evaluatedFiles, ['src/blocking.ts']);
  assert.deepEqual(blockedNotifications, [{ code: 'SAME_BLOCK' }]);
});

test('runLifecycleWatch respeta umbral de severidad y evita alertas por debajo', async () => {
  const result = await runLifecycleWatch(
    {
      stage: 'PRE_COMMIT',
      scope: 'workingTree',
      intervalMs: 250,
      notifyCooldownMs: 0,
      severityThreshold: 'high',
      notifyEnabled: true,
      maxIterations: 1,
    },
    withAllowedAtomicity({
      resolveRepoRoot: () => '/repo',
      readChangeToken: () => 'A',
      resolvePolicyForStage: (stage) => ({
        policy: {
          stage,
          blockOnOrAbove: 'ERROR',
          warnOnOrAbove: 'WARN',
        },
        trace: {
          source: 'default',
          bundle: 'default',
          hash: 'hash',
        },
      }),
      runPlatformGate: async () => 0,
      resolveFactsForGateScope: async () => [
        {
          kind: 'FileChange',
          path: 'src/warn.ts',
          changeType: 'modified',
          source: 'git:working-tree',
        },
        {
          kind: 'FileContent',
          path: 'src/warn.ts',
          content: 'export const warn = true',
          source: 'git:working-tree',
        },
      ],
      readEvidence: () =>
        makeEvidence({
          outcome: 'WARN',
          findingSeverity: 'WARN',
          findingCode: 'WARN_ONLY',
          findingMessage: 'solo warning',
          aiGateStatus: 'ALLOWED',
        }),
      emitGateBlockedNotification: () => ({ delivered: true, reason: 'delivered' }),
      emitAuditSummaryNotificationFromEvidence: () => ({ delivered: true, reason: 'delivered' }),
      nowMs: () => 1000,
      sleep: async () => {},
    })
  );

  assert.equal(result.evaluations, 1);
  assert.equal(result.notificationsSent, 0);
  assert.equal(result.notificationsSuppressed, 0);
  assert.equal(result.lastTick.notification, 'below-threshold');
  assert.deepEqual(result.lastTick.changedFiles, ['src/warn.ts']);
  assert.deepEqual(result.lastTick.evaluatedFiles, ['src/warn.ts']);
  assert.equal(result.lastTick.findingsAtOrAboveThreshold, 0);
});

test('runLifecycleWatch auto-reconcilia policy en drift de skills y reevalua en la misma iteracion', async () => {
  let gateCalls = 0;
  let reconcileCalls = 0;
  let policyReconciled = false;
  const traceHashes: string[] = [];

  const result = await runLifecycleWatch(
    {
      stage: 'PRE_COMMIT',
      scope: 'workingTree',
      intervalMs: 250,
      notifyCooldownMs: 0,
      severityThreshold: 'high',
      notifyEnabled: false,
      maxIterations: 1,
    },
    withAllowedAtomicity({
      resolveRepoRoot: () => '/repo',
      readChangeToken: () => 'A',
      resolvePolicyForStage: (stage) => ({
        policy: {
          stage,
          blockOnOrAbove: 'ERROR',
          warnOnOrAbove: 'WARN',
        },
        trace: {
          source: 'default',
          bundle: 'default',
          hash: policyReconciled ? 'hash-reconciled' : 'hash-before-reconcile',
        },
      }),
      runPlatformGate: async (params) => {
        traceHashes.push(params.policyTrace.hash);
        gateCalls += 1;
        return gateCalls === 1 ? 1 : 0;
      },
      resolveFactsForGateScope: async () => [
        {
          kind: 'FileChange',
          path: 'apps/web/src/presentation/App.tsx',
          changeType: 'modified',
          source: 'git:working-tree',
        },
        {
          kind: 'FileContent',
          path: 'apps/web/src/presentation/App.tsx',
          content: 'export const App = () => null',
          source: 'git:working-tree',
        },
      ],
      readEvidence: () =>
        gateCalls === 1
          ? makeEvidence({
              outcome: 'BLOCK',
              findingSeverity: 'ERROR',
              findingCode: 'SKILLS_PLATFORM_COVERAGE_INCOMPLETE_HIGH',
              findingMessage: 'skills coverage incompleta',
              aiGateStatus: 'BLOCKED',
              aiGateViolationCode: 'SKILLS_PLATFORM_COVERAGE_INCOMPLETE_HIGH',
            })
          : makeEvidence({
              outcome: 'ALLOW',
              findingSeverity: 'INFO',
              findingCode: 'COVERAGE_OK',
              findingMessage: 'coverage estable',
              aiGateStatus: 'ALLOWED',
            }),
      runPolicyReconcile: () => {
        reconcileCalls += 1;
        policyReconciled = true;
        return makePolicyReconcileReport('APPLIED');
      },
      emitGateBlockedNotification: () => ({ delivered: true, reason: 'delivered' }),
      emitAuditSummaryNotificationFromEvidence: () => ({ delivered: true, reason: 'delivered' }),
      nowMs: () => 1000,
      sleep: async () => {},
    })
  );

  assert.equal(reconcileCalls, 1);
  assert.equal(gateCalls, 2);
  assert.equal(result.evaluations, 1);
  assert.equal(result.lastTick.gateOutcome, 'ALLOW');
  assert.equal(result.lastTick.gateExitCode, 0);
  assert.deepEqual(traceHashes, ['hash-before-reconcile', 'hash-reconciled']);
});

test('runLifecycleWatch revierte mutaciones inesperadas de manifests y bloquea el tick', async () => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-watch-manifest-'));
  const packageJsonPath = join(repoRoot, 'package.json');
  const lockPath = join(repoRoot, 'pnpm-lock.yaml');
  const yarnLockPath = join(repoRoot, 'yarn.lock');
  const packageJsonOriginal = '{\n  "name": "watch-guard-fixture",\n  "version": "1.0.0"\n}\n';
  const lockOriginal = 'lockfileVersion: 9.0\n';

  writeFileSync(packageJsonPath, packageJsonOriginal, 'utf8');
  writeFileSync(lockPath, lockOriginal, 'utf8');

  try {
    const result = await runLifecycleWatch(
      {
        repoRoot,
        stage: 'PRE_COMMIT',
        scope: 'workingTree',
        notifyEnabled: false,
        maxIterations: 1,
      },
      withAllowedAtomicity({
        resolveRepoRoot: () => repoRoot,
        readChangeToken: () => 'A',
        resolvePolicyForStage: (stage) => ({
          policy: {
            stage,
            blockOnOrAbove: 'ERROR',
            warnOnOrAbove: 'WARN',
          },
          trace: {
            source: 'default',
            bundle: 'default',
            hash: 'hash',
          },
        }),
        runPlatformGate: async () => {
          writeFileSync(packageJsonPath, '{\n  "name": "mutated-by-watch"\n}\n', 'utf8');
          writeFileSync(lockPath, 'lockfileVersion: 9.1\n', 'utf8');
          writeFileSync(yarnLockPath, '# unexpected mutation\n', 'utf8');
          return 0;
        },
        resolveFactsForGateScope: async () => [
          {
            kind: 'FileChange',
            path: 'apps/web/src/app.ts',
            changeType: 'modified',
            source: 'git:working-tree',
          },
          {
            kind: 'FileContent',
            path: 'apps/web/src/app.ts',
            content: 'export const app = true;',
            source: 'git:working-tree',
          },
        ],
        readEvidence: () =>
          makeEvidence({
            outcome: 'ALLOW',
            findingSeverity: 'INFO',
            findingCode: 'ALLOW_BASE',
            findingMessage: 'allow base',
          }),
        emitGateBlockedNotification: () => ({ delivered: true, reason: 'delivered' }),
        emitAuditSummaryNotificationFromEvidence: () => ({ delivered: true, reason: 'delivered' }),
        nowMs: () => 1000,
        sleep: async () => {},
      })
    );

    assert.equal(result.lastTick.gateOutcome, 'BLOCK');
    assert.equal(result.lastTick.gateExitCode, 1);
    assert.ok(result.lastTick.topCodes.includes('MANIFEST_MUTATION_DETECTED'));
    assert.equal(readFileSync(packageJsonPath, 'utf8'), packageJsonOriginal);
    assert.equal(readFileSync(lockPath, 'utf8'), lockOriginal);
    assert.equal(existsSync(yarnLockPath), false);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});
