import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { runPreCommitStage } from '../stageRunners';

type EvidenceShape = {
  version: string;
  snapshot: {
    stage: string;
    outcome: string;
    findings: Array<{ ruleId: string }>;
  };
  rulesets: Array<{ platform: string; bundle: string; hash: string }>;
};

const runGit = (cwd: string, args: ReadonlyArray<string>): string => {
  return execFileSync('git', args, { cwd, encoding: 'utf8' });
};

const withTempRepo = async (callback: (repoRoot: string) => Promise<void>) => {
  const repoRoot = mkdtempSync(join(tmpdir(), 'pumuki-stage-runner-'));
  const previousCwd = process.cwd();

  try {
    runGit(repoRoot, ['init']);
    process.chdir(repoRoot);
    await callback(repoRoot);
  } finally {
    process.chdir(previousCwd);
    rmSync(repoRoot, { recursive: true, force: true });
  }
};

test('runPreCommitStage uses skills stage policy override and writes policy trace into evidence', async () => {
  await withTempRepo(async (repoRoot) => {
    const backendDir = join(repoRoot, 'apps', 'backend', 'src');
    mkdirSync(backendDir, { recursive: true });

    writeFileSync(
      join(repoRoot, 'skills.policy.json'),
      JSON.stringify(
        {
          version: '1.0',
          defaultBundleEnabled: true,
          stages: {
            PRE_COMMIT: {
              blockOnOrAbove: 'CRITICAL',
              warnOnOrAbove: 'WARN',
            },
            PRE_PUSH: {
              blockOnOrAbove: 'ERROR',
              warnOnOrAbove: 'WARN',
            },
            CI: {
              blockOnOrAbove: 'ERROR',
              warnOnOrAbove: 'WARN',
            },
          },
          bundles: {},
        },
        null,
        2
      ),
      'utf8'
    );

    writeFileSync(
      join(backendDir, 'service.ts'),
      'export const value: any = 1;\n',
      'utf8'
    );
    runGit(repoRoot, ['add', 'apps/backend/src/service.ts']);

    const exitCode = await runPreCommitStage();
    assert.equal(exitCode, 0);

    const evidence = JSON.parse(
      readFileSync(join(repoRoot, '.ai_evidence.json'), 'utf8')
    ) as EvidenceShape;
    assert.equal(evidence.version, '2.1');
    assert.equal(evidence.snapshot.stage, 'PRE_COMMIT');
    assert.equal(evidence.snapshot.outcome, 'WARN');
    assert.equal(
      evidence.snapshot.findings.some(
        (finding) => finding.ruleId === 'backend.avoid-explicit-any'
      ),
      true
    );

    const policyRuleset = evidence.rulesets.find((ruleset) => ruleset.platform === 'policy');
    assert.ok(policyRuleset);
    assert.equal(policyRuleset.bundle, 'gate-policy.skills.policy.PRE_COMMIT');
    assert.match(policyRuleset.hash, /^[A-Fa-f0-9]{64}$/);
  });
});

test('runPreCommitStage keeps default policy thresholds when skills policy is absent', async () => {
  await withTempRepo(async (repoRoot) => {
    const backendDir = join(repoRoot, 'apps', 'backend', 'src');
    mkdirSync(backendDir, { recursive: true });

    writeFileSync(
      join(backendDir, 'service.ts'),
      'export const value: any = 1;\n',
      'utf8'
    );
    runGit(repoRoot, ['add', 'apps/backend/src/service.ts']);

    const exitCode = await runPreCommitStage();
    assert.equal(exitCode, 0);

    const evidence = JSON.parse(
      readFileSync(join(repoRoot, '.ai_evidence.json'), 'utf8')
    ) as EvidenceShape;
    assert.equal(evidence.version, '2.1');
    assert.equal(evidence.snapshot.stage, 'PRE_COMMIT');
    assert.equal(evidence.snapshot.outcome, 'PASS');
    assert.equal(
      evidence.snapshot.findings.some(
        (finding) => finding.ruleId === 'backend.avoid-explicit-any'
      ),
      true
    );

    const policyRuleset = evidence.rulesets.find((ruleset) => ruleset.platform === 'policy');
    assert.ok(policyRuleset);
    assert.equal(policyRuleset.bundle, 'gate-policy.default.PRE_COMMIT');
    assert.match(policyRuleset.hash, /^[A-Fa-f0-9]{64}$/);
  });
});
