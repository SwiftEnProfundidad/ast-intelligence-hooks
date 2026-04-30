import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatConsumerPreflight,
  runConsumerPreflight,
} from '../framework-menu-consumer-preflight-lib';

test('formatConsumerPreflight incluye causas accionables cuando gate está bloqueado', () => {
  const result = runConsumerPreflight(
    {
      repoRoot: '/tmp/repo',
      stage: 'PRE_COMMIT',
    },
    {
      evaluateAiGate: () => ({
        stage: 'PRE_COMMIT',
        status: 'BLOCKED',
        allowed: false,
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
            branch: 'feature/preflight',
            upstream: 'origin/feature/preflight',
            ahead: 0,
            behind: 0,
            dirty: true,
            staged: 1,
            unstaged: 0,
          },
          lifecycle: {
            installed: true,
            package_version: '6.3.17',
            lifecycle_version: '6.3.17',
            hooks: { pre_commit: 'managed', pre_push: 'managed' },
          },
        },
        violations: [
          { code: 'EVIDENCE_GATE_BLOCKED', message: 'Evidence AI gate status is BLOCKED.', severity: 'ERROR' },
        ],
      }),
      emitSystemNotification: () => ({ delivered: false, reason: 'disabled' }),
    }
  );

  const rendered = formatConsumerPreflight(result, {
    panelWidth: 140,
    color: false,
  });

  assert.match(rendered, /Governance truth:/);
  assert.match(rendered, /Governance next action:/);
  assert.match(rendered, /Governance: BLOCKED|Governance: ATTENTION/);
  assert.match(rendered, /Policy-as-code: PRE_WRITE=POLICY_AS_CODE_VALID strict=no/);
  assert.match(rendered, /Experimental: ANALYTICS=off/);
  assert.match(rendered, /Blocking causes:/);
  assert.match(rendered, /EVIDENCE_GATE_BLOCKED: Evidence AI gate status is BLOCKED\./);
  assert.match(rendered, /Action: corrige primero las violaciones bloqueantes y vuelve a auditar\./);
});

test('formatConsumerPreflight renderiza panel legacy con estado de repo e hints', () => {
  const result = runConsumerPreflight(
    {
      repoRoot: '/tmp/repo',
      stage: 'PRE_COMMIT',
    },
    {
      evaluateAiGate: () => ({
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
          kind: 'missing',
          max_age_seconds: 900,
          age_seconds: null,
          source: { source: 'local-file', path: '/tmp/repo/.ai_evidence.json', digest: null, generated_at: null },
        },
        repo_state: {
          repo_root: '/tmp/repo',
          git: {
            available: true,
            branch: 'feature/menu',
            upstream: 'origin/feature/menu',
            ahead: 1,
            behind: 0,
            dirty: false,
            staged: 0,
            unstaged: 0,
          },
          lifecycle: {
            installed: true,
            package_version: '6.3.17',
            lifecycle_version: '6.3.17',
            hooks: { pre_commit: 'managed', pre_push: 'managed' },
          },
        },
        violations: [],
      }),
      emitSystemNotification: () => ({ delivered: false, reason: 'disabled' }),
    }
  );

  const rendered = formatConsumerPreflight(result, {
    panelWidth: 80,
    color: false,
  });

  assert.match(rendered, /PRE-FLIGHT CHECK/);
  assert.match(rendered, /Branch: feature\/menu/);
  assert.match(rendered, /Gate: ALLOWED/);
  assert.match(rendered, /Governance truth:/);
  assert.match(rendered, /Governance next action:/);
  assert.match(rendered, /Policy-as-code: PRE_WRITE=POLICY_AS_CODE_VALID strict=no/);
  assert.match(rendered, /Experimental: ANALYTICS=off/);
  assert.match(rendered, /Contract: AGENTS=/);
});
