import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { runSddStateSync } from '../stateSync';

const runGit = (cwd: string, args: ReadonlyArray<string>): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8' });

const withFixtureRepo = async (
  prefix: string,
  callback: (repoRoot: string) => Promise<void> | void
): Promise<void> => {
  const repoRoot = mkdtempSync(join(tmpdir(), prefix));
  runGit(repoRoot, ['init', '-b', 'main']);
  runGit(repoRoot, ['config', 'user.email', 'pumuki-test@example.com']);
  runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
  writeFileSync(join(repoRoot, 'README.md'), '# fixture\n', 'utf8');
  try {
    await callback(repoRoot);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
};

const writeScenarioEvidence = (params: {
  repoRoot: string;
  scenarioId: string;
  status: 'passed' | 'failed';
  generatedAt: string;
  version?: '1.0' | '1';
}): string => {
  const path = join(params.repoRoot, '.pumuki', 'artifacts', 'pumuki-evidence-v1.json');
  mkdirSync(join(params.repoRoot, '.pumuki', 'artifacts'), { recursive: true });
  const payload = {
    version: params.version ?? '1.0',
    generated_at: params.generatedAt,
    scenario_id: params.scenarioId,
    test_run: {
      command: 'npm run test:unit',
      status: params.status,
      output_path: '.audit-reports/test.txt',
      executed_at: params.generatedAt,
    },
    ai_evidence: {
      source: 'local-file',
      path: join(params.repoRoot, '.ai_evidence.json'),
      digest: 'sha256:source',
      generated_at: params.generatedAt,
      status: 'valid',
    },
  };
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return path;
};

test('runSddStateSync dry-run proyecta sincronización sin escribir board', async () => {
  await withFixtureRepo('pumuki-sdd-state-sync-dry-run-', (repoRoot) => {
    writeScenarioEvidence({
      repoRoot,
      scenarioId: 'BDD-101',
      status: 'passed',
      generatedAt: '2026-03-05T12:00:00.000Z',
    });

    const result = runSddStateSync({
      repoRoot,
      dryRun: true,
    });

    assert.equal(result.command, 'pumuki sdd state-sync');
    assert.equal(result.context.scenarioId, 'BDD-101');
    assert.equal(result.context.desiredStatus, 'done');
    assert.equal(result.board.updated, true);
    assert.equal(result.board.written, false);
    assert.equal(result.decision.allowed, true);
    assert.equal(result.decision.code, 'STATE_SYNC_DRY_RUN');
    assert.equal(
      existsSync(join(repoRoot, '.pumuki', 'artifacts', 'scenario-state-sync-v1.json')),
      false
    );
  });
});

test('runSddStateSync apply escribe board determinista', async () => {
  await withFixtureRepo('pumuki-sdd-state-sync-apply-', (repoRoot) => {
    writeScenarioEvidence({
      repoRoot,
      scenarioId: 'BDD-102',
      status: 'failed',
      generatedAt: '2026-03-05T12:10:00.000Z',
    });

    const result = runSddStateSync({
      repoRoot,
      dryRun: false,
    });

    assert.equal(result.context.desiredStatus, 'blocked');
    assert.equal(result.board.written, true);
    const boardPath = join(repoRoot, '.pumuki', 'artifacts', 'scenario-state-sync-v1.json');
    mkdirSync(join(repoRoot, '.pumuki', 'artifacts'), { recursive: true });
    assert.equal(existsSync(boardPath), true);
    const board = JSON.parse(readFileSync(boardPath, 'utf8')) as {
      scenarios?: Array<{ scenario_id?: string; status?: string }>;
    };
    assert.equal(board.scenarios?.[0]?.scenario_id, 'BDD-102');
    assert.equal(board.scenarios?.[0]?.status, 'blocked');
  });
});

test('runSddStateSync acepta evidencia source con version=1', async () => {
  await withFixtureRepo('pumuki-sdd-state-sync-version-1-', (repoRoot) => {
    writeScenarioEvidence({
      repoRoot,
      scenarioId: 'BDD-150',
      status: 'passed',
      generatedAt: '2026-03-05T12:30:00.000Z',
      version: '1',
    });

    const result = runSddStateSync({
      repoRoot,
      dryRun: true,
    });

    assert.equal(result.decision.allowed, true);
    assert.equal(result.context.scenarioId, 'BDD-150');
    assert.equal(result.context.desiredStatus, 'done');
  });
});

test('runSddStateSync detecta conflicto y sugiere remediación con --force', async () => {
  await withFixtureRepo('pumuki-sdd-state-sync-conflict-', (repoRoot) => {
    writeScenarioEvidence({
      repoRoot,
      scenarioId: 'BDD-103',
      status: 'failed',
      generatedAt: '2026-03-05T12:20:00.000Z',
    });

    const boardPath = join(repoRoot, '.pumuki', 'artifacts', 'scenario-state-sync-v1.json');
    const existing = {
      version: '1.0',
      generated_at: '2026-03-05T12:15:00.000Z',
      recent_sync: {
        scenario_id: 'BDD-103',
        status: 'done',
        evidence_digest: 'sha256:old',
        source_test_status: 'passed',
        source_evidence_path: '.pumuki/artifacts/pumuki-evidence-v1.json',
      },
      summary: {
        total: 1,
        todo: 0,
        in_progress: 0,
        blocked: 0,
        done: 1,
      },
      scenarios: [
        {
          scenario_id: 'BDD-103',
          status: 'done',
          evidence_digest: 'sha256:old',
          source_test_status: 'passed',
          updated_at: '2026-03-05T12:15:00.000Z',
        },
      ],
    };
    writeFileSync(boardPath, `${JSON.stringify(existing, null, 2)}\n`, 'utf8');

    const conflict = runSddStateSync({
      repoRoot,
      dryRun: false,
    });

    assert.equal(conflict.board.conflict, true);
    assert.equal(conflict.decision.allowed, false);
    assert.equal(conflict.decision.code, 'STATE_SYNC_CONFLICT');
    assert.match(conflict.decision.nextAction ?? '', /--force/);

    const forced = runSddStateSync({
      repoRoot,
      dryRun: false,
      force: true,
    });
    assert.equal(forced.decision.allowed, true);
    assert.equal(forced.board.conflict, false);
    assert.equal(forced.board.written, true);
  });
});
