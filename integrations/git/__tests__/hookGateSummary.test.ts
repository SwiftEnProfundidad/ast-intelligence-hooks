import assert from 'node:assert/strict';
import test from 'node:test';
import type { EvidenceReadResult } from '../../evidence/readEvidence';
import { runPreCommitStage, runPrePushStage } from '../stageRunners';

const POLICY_TRACE_HASH = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

const buildValidEvidenceResult = (): EvidenceReadResult => ({
  kind: 'valid',
  evidence: {
    timestamp: '2026-03-03T00:00:00.000Z',
  } as Extract<EvidenceReadResult, { kind: 'valid' }>['evidence'],
  source_descriptor: {
    source: 'local-file',
    path: '/repo/.ai_evidence.json',
    digest: 'sha256:abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    generated_at: '2026-03-03T00:00:00.000Z',
  },
});

test('runPreCommitStage emite resumen mínimo del gate en éxito', async () => {
  const previousAtomicity = process.env.PUMUKI_GIT_ATOMICITY_ENABLED;
  process.env.PUMUKI_GIT_ATOMICITY_ENABLED = '0';
  const summaries: string[] = [];

  try {
    const exitCode = await runPreCommitStage({
      resolvePolicyForStage: () => ({
        policy: {
          stage: 'STAGED',
          blockOnOrAbove: 'ERROR',
          warnOnOrAbove: 'WARN',
        },
        trace: {
          source: 'default',
          bundle: 'gate-policy.default.PRE_COMMIT',
          hash: POLICY_TRACE_HASH,
          version: 'policy-as-code/default@1.0',
          signature: 'a'.repeat(64),
          policySource: 'computed-local',
          degraded: {
            enabled: true,
            action: 'allow',
            reason: 'offline-airgapped',
            source: 'env',
            code: 'DEGRADED_MODE_ALLOWED',
          },
        },
      }),
      runPlatformGate: async () => 0,
      resolveRepoRoot: () => '/repo',
      readEvidenceResult: () => buildValidEvidenceResult(),
      now: () => Date.parse('2026-03-03T00:00:30.000Z'),
      writeHookGateSummary: (message) => {
        summaries.push(message);
      },
      notifyAuditSummaryFromEvidence: () => {},
    });

    assert.equal(exitCode, 0);
    assert.equal(summaries.length, 1);
    assert.match(summaries[0] ?? '', /\[pumuki\]\[hook-gate\]/);
    assert.match(summaries[0] ?? '', /stage=PRE_COMMIT/);
    assert.match(summaries[0] ?? '', /decision=ALLOW/);
    assert.match(summaries[0] ?? '', /policy_hash=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef/);
    assert.match(summaries[0] ?? '', /policy_version=policy-as-code\/default@1.0/);
    assert.match(summaries[0] ?? '', /policy_signature=a{64}/);
    assert.match(summaries[0] ?? '', /policy_source=computed-local/);
    assert.match(summaries[0] ?? '', /degraded_mode=enabled/);
    assert.match(summaries[0] ?? '', /degraded_action=allow/);
    assert.match(summaries[0] ?? '', /degraded_reason=offline-airgapped/);
    assert.match(summaries[0] ?? '', /evidence_kind=valid/);
    assert.match(summaries[0] ?? '', /evidence_age_seconds=30/);
  } finally {
    if (typeof previousAtomicity === 'undefined') {
      delete process.env.PUMUKI_GIT_ATOMICITY_ENABLED;
    } else {
      process.env.PUMUKI_GIT_ATOMICITY_ENABLED = previousAtomicity;
    }
  }
});

test('runPrePushStage respeta --quiet y suprime resumen mínimo en éxito', async () => {
  const previousAtomicity = process.env.PUMUKI_GIT_ATOMICITY_ENABLED;
  process.env.PUMUKI_GIT_ATOMICITY_ENABLED = '0';
  const summaries: string[] = [];

  try {
    const exitCode = await runPrePushStage({
      resolveUpstreamRef: () => 'origin/feature/hook-summary',
      resolvePolicyForStage: () => ({
        policy: {
          stage: 'RANGE',
          blockOnOrAbove: 'ERROR',
          warnOnOrAbove: 'WARN',
        },
        trace: {
          source: 'default',
          bundle: 'gate-policy.default.PRE_PUSH',
          hash: POLICY_TRACE_HASH,
          version: 'policy-as-code/default@1.0',
          signature: 'b'.repeat(64),
          policySource: 'computed-local',
        },
      }),
      runPlatformGate: async () => 0,
      resolveRepoRoot: () => '/repo',
      readEvidenceResult: () => buildValidEvidenceResult(),
      isQuietMode: () => true,
      writeHookGateSummary: (message) => {
        summaries.push(message);
      },
      notifyAuditSummaryFromEvidence: () => {},
    });

    assert.equal(exitCode, 0);
    assert.deepEqual(summaries, []);
  } finally {
    if (typeof previousAtomicity === 'undefined') {
      delete process.env.PUMUKI_GIT_ATOMICITY_ENABLED;
    } else {
      process.env.PUMUKI_GIT_ATOMICITY_ENABLED = previousAtomicity;
    }
  }
});
