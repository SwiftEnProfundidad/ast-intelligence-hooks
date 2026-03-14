import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { RepoState } from '../integrations/evidence/schema';
import { emitGateTelemetryEvent } from '../integrations/telemetry/gateTelemetry';

const buildRepoState = (repoRoot: string): RepoState => ({
  repo_root: repoRoot,
  git: {
    available: true,
    branch: 'feature/contract-suite-telemetry-rotation',
    upstream: 'origin/feature/contract-suite-telemetry-rotation',
    ahead: 0,
    behind: 0,
    dirty: false,
    staged: 0,
    unstaged: 0,
  },
  lifecycle: {
    installed: true,
    package_version: '6.3.33',
    lifecycle_version: '6.3.33',
    hooks: {
      pre_commit: 'managed',
      pre_push: 'managed',
    },
  },
});

const main = async (): Promise<void> => {
  const workspaceRoot = mkdtempSync(join(tmpdir(), 'pumuki-contract-telemetry-rotation-'));
  const jsonlRelativePath = '.pumuki/artifacts/gate-telemetry.jsonl';
  const repoState = buildRepoState(workspaceRoot);

  try {
    await emitGateTelemetryEvent(
      {
        stage: 'PRE_COMMIT',
        auditMode: 'gate',
        gateOutcome: 'PASS',
        filesScanned: 1,
        findings: [],
        repoRoot: workspaceRoot,
        repoState,
      },
      {
        env: {
          PUMUKI_TELEMETRY_JSONL_PATH: jsonlRelativePath,
          PUMUKI_TELEMETRY_JSONL_MAX_BYTES: '1',
        } as NodeJS.ProcessEnv,
        now: () => new Date('2026-03-04T00:00:00.000Z'),
      }
    );

    const secondEvent = await emitGateTelemetryEvent(
      {
        stage: 'PRE_PUSH',
        auditMode: 'gate',
        gateOutcome: 'BLOCK',
        filesScanned: 2,
        findings: [],
        repoRoot: workspaceRoot,
        repoState,
      },
      {
        env: {
          PUMUKI_TELEMETRY_JSONL_PATH: jsonlRelativePath,
          PUMUKI_TELEMETRY_JSONL_MAX_BYTES: '1',
        } as NodeJS.ProcessEnv,
        now: () => new Date('2026-03-04T00:00:01.000Z'),
      }
    );

    assert.ok(secondEvent.jsonl_path);
    const currentPath = secondEvent.jsonl_path;
    const rotatedPath = `${currentPath}.1`;
    assert.equal(existsSync(currentPath), true);
    assert.equal(existsSync(rotatedPath), true);

    const currentPayload = JSON.parse(readFileSync(currentPath, 'utf8').trim()) as {
      schema?: string;
      stage?: string;
    };
    const rotatedPayload = JSON.parse(readFileSync(rotatedPath, 'utf8').trim()) as {
      schema?: string;
      stage?: string;
    };

    assert.equal(currentPayload.schema, 'telemetry_event_v1');
    assert.equal(currentPayload.stage, 'PRE_PUSH');
    assert.equal(rotatedPayload.schema, 'telemetry_event_v1');
    assert.equal(rotatedPayload.stage, 'PRE_COMMIT');
  } finally {
    rmSync(workspaceRoot, {
      recursive: true,
      force: true,
    });
  }
};

void main();
