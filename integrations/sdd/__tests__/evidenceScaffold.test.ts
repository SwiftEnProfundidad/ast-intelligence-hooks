import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { computeEvidencePayloadHash } from '../../evidence/evidenceChain';
import { runSddEvidenceScaffold } from '../evidenceScaffold';

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

const writeValidEvidence = (repoRoot: string): void => {
  const evidence = {
    version: '2.1' as const,
    timestamp: '2026-03-05T10:00:00.000Z',
    snapshot: {
      stage: 'PRE_WRITE' as const,
      outcome: 'ALLOW' as const,
      rules_coverage: {
        stage: 'PRE_WRITE' as const,
        active_rule_ids: ['skills.backend.no-empty-catch'],
        evaluated_rule_ids: ['skills.backend.no-empty-catch'],
        matched_rule_ids: [],
        unevaluated_rule_ids: [],
        counts: {
          active: 1,
          evaluated: 1,
          matched: 0,
          unevaluated: 0,
        },
        coverage_ratio: 1,
      },
      findings: [],
    },
    ledger: [],
    platforms: {},
    rulesets: [],
    human_intent: null,
    ai_gate: {
      status: 'ALLOWED' as const,
      violations: [],
      human_intent: null,
    },
    severity_metrics: {
      gate_status: 'ALLOWED' as const,
      total_violations: 0,
      by_severity: {
        CRITICAL: 0,
        ERROR: 0,
        WARN: 0,
        INFO: 0,
      },
    },
    repo_state: {
      repo_root: repoRoot,
      git: {
        available: true,
        branch: 'main',
        upstream: null,
        ahead: 0,
        behind: 0,
        dirty: false,
        staged: 0,
        unstaged: 0,
      },
      lifecycle: {
        installed: true,
        package_version: '6.3.39',
        lifecycle_version: '6.3.39',
        hooks: {
          pre_commit: 'managed' as const,
          pre_push: 'managed' as const,
        },
      },
    },
  };
  const payloadHash = computeEvidencePayloadHash(evidence);
  const withChain = {
    ...evidence,
    evidence_chain: {
      algorithm: 'sha256' as const,
      previous_payload_hash: null,
      payload_hash: payloadHash,
      sequence: 1,
    },
  };
  writeFileSync(join(repoRoot, '.ai_evidence.json'), JSON.stringify(withChain, null, 2), 'utf8');
};

test('runSddEvidenceScaffold dry-run devuelve payload y no escribe artefacto', async () => {
  await withFixtureRepo('pumuki-sdd-evidence-dry-run-', (repoRoot) => {
    writeValidEvidence(repoRoot);
    const result = runSddEvidenceScaffold({
      repoRoot,
      dryRun: true,
      scenarioId: 'BDD-001',
      testCommand: 'npm run test:unit -- --grep BDD-001',
      testStatus: 'passed',
      testOutputPath: '.audit-reports/bdd-001.txt',
      now: () => new Date('2026-03-05T10:05:00.000Z'),
    });

    assert.equal(result.command, 'pumuki sdd evidence');
    assert.equal(result.dryRun, true);
    assert.equal(result.context.scenarioId, 'BDD-001');
    assert.equal(result.context.testStatus, 'passed');
    assert.equal(result.output.path, '.pumuki/artifacts/pumuki-evidence-v1.json');
    assert.equal(result.output.written, false);
    assert.equal(result.artifact.generated_at, '2026-03-05T10:05:00.000Z');
    assert.equal(result.artifact.ai_evidence.status, 'valid');
    assert.equal(
      existsSync(join(repoRoot, '.pumuki', 'artifacts', 'pumuki-evidence-v1.json')),
      false
    );
  });
});

test('runSddEvidenceScaffold aplica artefacto cuando dry-run=false', async () => {
  await withFixtureRepo('pumuki-sdd-evidence-apply-', (repoRoot) => {
    writeValidEvidence(repoRoot);
    const testOutput = join(repoRoot, '.audit-reports', 'bdd-001.txt');
    mkdirSync(join(repoRoot, '.audit-reports'), { recursive: true });
    writeFileSync(testOutput, 'ok\n', 'utf8');

    const result = runSddEvidenceScaffold({
      repoRoot,
      scenarioId: 'BDD-001',
      testCommand: 'npm run test:unit -- --grep BDD-001',
      testStatus: 'failed',
      testOutputPath: '.audit-reports/bdd-001.txt',
      now: () => new Date('2026-03-05T10:06:00.000Z'),
    });

    const outputPath = join(repoRoot, '.pumuki', 'artifacts', 'pumuki-evidence-v1.json');
    assert.equal(result.output.written, true);
    assert.equal(existsSync(outputPath), true);
    const artifact = JSON.parse(readFileSync(outputPath, 'utf8')) as {
      scenario_id?: string;
      test_run?: { status?: string; output_path?: string | null };
    };
    assert.equal(artifact.scenario_id, 'BDD-001');
    assert.equal(artifact.test_run?.status, 'failed');
    assert.equal(artifact.test_run?.output_path, '.audit-reports/bdd-001.txt');
  });
});

test('runSddEvidenceScaffold falla cuando faltan datos de test o escenario', async () => {
  await withFixtureRepo('pumuki-sdd-evidence-validation-', (repoRoot) => {
    writeValidEvidence(repoRoot);
    assert.throws(
      () =>
        runSddEvidenceScaffold({
          repoRoot,
          scenarioId: 'todo',
          testCommand: 'npm run test:unit',
          testStatus: 'passed',
        }),
      /placeholder/i
    );
    assert.throws(
      () =>
        runSddEvidenceScaffold({
          repoRoot,
          scenarioId: 'BDD-001',
          testCommand: ' ',
          testStatus: 'passed',
        }),
      /--test-command/i
    );
  });
});

test('runSddEvidenceScaffold falla cuando .ai_evidence.json no es válida', async () => {
  await withFixtureRepo('pumuki-sdd-evidence-invalid-', (repoRoot) => {
    writeFileSync(join(repoRoot, '.ai_evidence.json'), '{invalid', 'utf8');
    assert.throws(
      () =>
        runSddEvidenceScaffold({
          repoRoot,
          scenarioId: 'BDD-001',
          testCommand: 'npm run test:unit',
          testStatus: 'passed',
        }),
      /source is invalid/i
    );
  });
});
