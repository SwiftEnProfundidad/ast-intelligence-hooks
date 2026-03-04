import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import type { Finding } from '../../../core/gate/Finding';
import type { RepoState } from '../../evidence/schema';
import { withTempDir } from '../../__tests__/helpers/tempDir';
import { emitGateTelemetryEvent } from '../gateTelemetry';

const baseRepoState: RepoState = {
  repo_root: '/repo/root',
  git: {
    available: true,
    branch: 'feature/example',
    upstream: 'origin/feature/example',
    ahead: 1,
    behind: 0,
    dirty: true,
    staged: 2,
    unstaged: 1,
  },
  lifecycle: {
    installed: true,
    package_version: '6.3.26',
    lifecycle_version: '6.3.26',
    hooks: {
      pre_commit: 'managed',
      pre_push: 'managed',
    },
  },
};

const findings: ReadonlyArray<Finding> = [
  {
    ruleId: 'governance.policy-as-code.invalid',
    severity: 'ERROR',
    code: 'POLICY_AS_CODE_SIGNATURE_MISMATCH',
    message: 'mismatch',
    filePath: '.pumuki/policy-as-code.json',
  },
];

test('emitGateTelemetryEvent escribe JSONL determinista cuando está configurado', async () => {
  await withTempDir('pumuki-gate-telemetry-jsonl-', async (repoRoot) => {
    const result = await emitGateTelemetryEvent(
      {
        stage: 'PRE_PUSH',
        auditMode: 'gate',
        gateOutcome: 'BLOCK',
        filesScanned: 7,
        findings,
        repoRoot,
        repoState: {
          ...baseRepoState,
          repo_root: repoRoot,
        },
        policyTrace: {
          source: 'default',
          bundle: 'gate-policy.default.PRE_PUSH',
          hash: 'abc123',
          version: 'policy-as-code/default@1.0',
          signature: 'f'.repeat(64),
          policySource: 'computed-local',
          validation: {
            status: 'valid',
            code: 'POLICY_AS_CODE_VALID',
            message: 'ok',
            strict: false,
          },
        },
        sddDecision: {
          allowed: false,
          code: 'SDD_CHANGE_INCOMPLETE',
          message: 'missing scenario.feature',
        },
      },
      {
        env: {
          PUMUKI_TELEMETRY_JSONL_PATH: '.pumuki/artifacts/gate-telemetry.jsonl',
        } as NodeJS.ProcessEnv,
        now: () => new Date('2026-03-04T00:00:00.000Z'),
      }
    );

    assert.equal(result.skipped, false);
    assert.equal(result.otel_dispatched, false);
    assert.ok(result.jsonl_path);
    assert.equal(
      result.jsonl_path,
      join(repoRoot, '.pumuki/artifacts/gate-telemetry.jsonl')
    );

    const line = readFileSync(result.jsonl_path, 'utf8').trim();
    const parsed = JSON.parse(line) as {
      schema: string;
      schema_version: string;
      stage: string;
      gate_outcome: string;
      findings_total: number;
      policy?: {
        bundle?: string;
        version?: string;
        signature?: string;
        policy_source?: string;
        validation_status?: string;
        validation_code?: string;
      };
      sdd?: {
        allowed?: boolean;
        code?: string;
      };
    };
    assert.equal(parsed.schema, 'telemetry_event_v1');
    assert.equal(parsed.schema_version, '1.0');
    assert.equal(parsed.stage, 'PRE_PUSH');
    assert.equal(parsed.gate_outcome, 'BLOCK');
    assert.equal(parsed.findings_total, 1);
    assert.equal(parsed.policy?.bundle, 'gate-policy.default.PRE_PUSH');
    assert.equal(parsed.policy?.version, 'policy-as-code/default@1.0');
    assert.equal(parsed.policy?.signature, 'f'.repeat(64));
    assert.equal(parsed.policy?.policy_source, 'computed-local');
    assert.equal(parsed.policy?.validation_status, 'valid');
    assert.equal(parsed.policy?.validation_code, 'POLICY_AS_CODE_VALID');
    assert.equal(parsed.sdd?.allowed, false);
    assert.equal(parsed.sdd?.code, 'SDD_CHANGE_INCOMPLETE');
  });
});

test('emitGateTelemetryEvent envía payload OTel opcional cuando endpoint está configurado', async () => {
  let captured:
    | {
      endpoint: string;
      timeoutMs: number;
      payload: unknown;
    }
    | undefined;

  const result = await emitGateTelemetryEvent(
    {
      stage: 'PRE_COMMIT',
      auditMode: 'gate',
      gateOutcome: 'PASS',
      filesScanned: 0,
      findings: [],
      repoRoot: '/repo/root',
      repoState: baseRepoState,
    },
    {
      env: {
        PUMUKI_TELEMETRY_OTEL_ENDPOINT: 'https://otel.example/v1/logs',
        PUMUKI_TELEMETRY_OTEL_SERVICE_NAME: 'pumuki-enterprise',
        PUMUKI_TELEMETRY_OTEL_TIMEOUT_MS: '2500',
      } as NodeJS.ProcessEnv,
      now: () => new Date('2026-03-04T00:00:00.000Z'),
      postOtelPayload: async (params) => {
        captured = {
          endpoint: params.endpoint,
          timeoutMs: params.timeoutMs,
          payload: params.payload,
        };
      },
    }
  );

  assert.equal(result.skipped, false);
  assert.equal(result.otel_dispatched, true);
  assert.ok(captured);
  assert.equal(captured?.endpoint, 'https://otel.example/v1/logs');
  assert.equal(captured?.timeoutMs, 2500);
});

test('emitGateTelemetryEvent no emite nada si no hay outputs configurados', async () => {
  const result = await emitGateTelemetryEvent(
    {
      stage: 'CI',
      auditMode: 'engine',
      gateOutcome: 'WARN',
      filesScanned: 3,
      findings: [],
      repoRoot: '/repo/root',
      repoState: baseRepoState,
    },
    {
      env: {} as NodeJS.ProcessEnv,
      now: () => new Date('2026-03-04T00:00:00.000Z'),
    }
  );

  assert.equal(result.skipped, true);
  assert.equal(result.otel_dispatched, false);
  assert.equal(result.event.schema, 'telemetry_event_v1');
});
