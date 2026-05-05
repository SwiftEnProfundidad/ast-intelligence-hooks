import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { computeEvidencePayloadHash } from '../../evidence/evidenceChain';
import { getCurrentPumukiVersion } from '../../lifecycle/packageInfo';
import { readTddBddEvidence } from '../../tdd/contract';
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
        package_version: getCurrentPumukiVersion(),
        lifecycle_version: getCurrentPumukiVersion(),
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
    assert.equal(result.artifact.version, '1');
    assert.equal(result.artifact.generated_at, '2026-03-05T10:05:00.000Z');
    assert.equal(result.artifact.slices.length, 1);
    assert.equal(result.artifact.slices[0]?.scenario_ref, 'BDD-001.feature');
    assert.equal(result.artifact.slices[0]?.red.status, 'failed');
    assert.equal(result.artifact.slices[0]?.green.status, 'passed');
    assert.equal(result.artifact.slices[0]?.refactor.status, 'passed');
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
      version?: string;
      slices?: Array<{
        scenario_ref?: string;
        green?: { status?: string };
        refactor?: { status?: string };
      }>;
      scenario_id?: string;
      test_run?: { status?: string; output_path?: string | null };
    };
    assert.equal(artifact.version, '1');
    assert.equal(artifact.slices?.[0]?.scenario_ref, 'BDD-001.feature');
    assert.equal(artifact.slices?.[0]?.green?.status, 'failed');
    assert.equal(artifact.slices?.[0]?.refactor?.status, 'failed');
    assert.equal(artifact.scenario_id, 'BDD-001');
    assert.equal(artifact.test_run?.status, 'failed');
    assert.equal(artifact.test_run?.output_path, '.audit-reports/bdd-001.txt');

    const evidenceRead = readTddBddEvidence(repoRoot);
    assert.equal(evidenceRead.kind, 'valid');
    if (evidenceRead.kind === 'valid') {
      assert.equal(evidenceRead.evidence.version, '1');
      assert.equal(evidenceRead.evidence.slices.length, 1);
    }
  });
});

test('runSddEvidenceScaffold mantiene JSON válido y conserva slices con escrituras paralelas', async () => {
  await withFixtureRepo('pumuki-sdd-evidence-parallel-', async (repoRoot) => {
    writeValidEvidence(repoRoot);
    const testOutput = join(repoRoot, '.audit-reports', 'parallel.txt');
    mkdirSync(join(repoRoot, '.audit-reports'), { recursive: true });
    writeFileSync(testOutput, 'ok\n', 'utf8');
    const modulePath = join(process.cwd(), 'integrations', 'sdd', 'evidenceScaffold.ts');
    const script = `
      import { createRequire } from 'node:module';
      const require = createRequire(import.meta.url);
      const { runSddEvidenceScaffold } = require(${JSON.stringify(modulePath)});
      runSddEvidenceScaffold({
        repoRoot: process.argv[1],
        scenarioId: process.argv[2],
        testCommand: 'npm run test:unit -- --grep ' + process.argv[2],
        testStatus: 'passed',
        testOutputPath: '.audit-reports/parallel.txt'
      });
    `;
    const run = (scenarioId: string): Promise<void> =>
      new Promise((resolveProcess, rejectProcess) => {
        const child = spawn(process.execPath, ['--import', 'tsx', '-e', script, repoRoot, scenarioId], {
          cwd: process.cwd(),
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        let stderr = '';
        child.stderr.on('data', (chunk: Buffer) => {
          stderr += chunk.toString('utf8');
        });
        child.on('error', rejectProcess);
        child.on('exit', (code) => {
          if (code === 0) {
            resolveProcess();
            return;
          }
          rejectProcess(new Error(stderr));
        });
      });

    await Promise.all([run('BDD-001'), run('BDD-002')]);

    const outputPath = join(repoRoot, '.pumuki', 'artifacts', 'pumuki-evidence-v1.json');
    const artifact = JSON.parse(readFileSync(outputPath, 'utf8')) as {
      slices?: Array<{ id?: string }>;
    };
    assert.deepEqual(
      (artifact.slices ?? []).map((slice) => slice.id).sort(),
      ['BDD-001', 'BDD-002']
    );
    const artifacts = readdirSync(join(repoRoot, '.pumuki', 'artifacts'));
    assert.equal(artifacts.some((entry) => entry.endsWith('.lock') || entry.endsWith('.tmp')), false);
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

test('runSddEvidenceScaffold sugiere una ruta efímera válida cuando --test-output apunta fuera del repo', async () => {
  await withFixtureRepo('pumuki-sdd-evidence-test-output-outside-', (repoRoot) => {
    writeValidEvidence(repoRoot);
    assert.throws(
      () =>
        runSddEvidenceScaffold({
          repoRoot,
          scenarioId: 'BDD-001',
          testCommand: 'npm run test:unit',
          testStatus: 'passed',
          testOutputPath: '/tmp/flux-athlete-detail-phase29-test.log',
        }),
      /Try "--test-output=\.pumuki\/runtime\/flux-athlete-detail-phase29-test\.log"/i
    );
  });
});
