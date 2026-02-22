import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';
import {
  runRepoAndStagedPrePushGateSilent,
  runRepoGateSilent,
  runWorkingTreePrePushGateSilent,
} from '../framework-menu-gate-lib';

const runGit = (cwd: string, args: ReadonlyArray<string>): string =>
  execFileSync('git', args, { cwd, encoding: 'utf8' });

test('runRepoGateSilent no inyecta sdd.policy.blocked en modo auditoria de menu', async () => {
  await withTempDir('pumuki-menu-gate-sdd-bypass-', async (repoRoot) => {
    const previousCwd = process.cwd();
    try {
      runGit(repoRoot, ['init']);
      runGit(repoRoot, ['config', 'user.email', 'pumuki@example.test']);
      runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
      mkdirSync(join(repoRoot, 'scripts'), { recursive: true });
      writeFileSync(
        join(repoRoot, 'scripts', 'sample.ts'),
        'export const sample = () => { console.log("menu gate"); };\n',
        'utf8'
      );
      runGit(repoRoot, ['add', '.']);
      runGit(repoRoot, ['commit', '-m', 'init']);

      process.chdir(repoRoot);
      await runRepoGateSilent();
      const evidence = JSON.parse(readFileSync(join(repoRoot, '.ai_evidence.json'), 'utf8')) as {
        snapshot?: { findings?: Array<{ ruleId?: string }> };
      };
      const findings = Array.isArray(evidence.snapshot?.findings) ? evidence.snapshot.findings : [];
      const ruleIds = findings.map((finding) => finding.ruleId ?? '');

      assert.equal(ruleIds.includes('sdd.policy.blocked'), false);
      assert.equal(
        ruleIds.includes('skills.backend.no-console-log') ||
          ruleIds.includes('skills.frontend.no-console-log') ||
          ruleIds.includes('heuristics.ts.console-log.ast'),
        true
      );
    } finally {
      process.chdir(previousCwd);
    }
  });
});

test('runRepoAndStagedPrePushGateSilent emite evidencia con stage PRE_PUSH', async () => {
  await withTempDir('pumuki-menu-gate-prepush-', async (repoRoot) => {
    const previousCwd = process.cwd();
    try {
      runGit(repoRoot, ['init']);
      runGit(repoRoot, ['config', 'user.email', 'pumuki@example.test']);
      runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
      mkdirSync(join(repoRoot, 'scripts'), { recursive: true });
      writeFileSync(
        join(repoRoot, 'scripts', 'sample.ts'),
        'export const sample = () => { console.log("menu gate prepush"); };\n',
        'utf8'
      );
      runGit(repoRoot, ['add', '.']);
      runGit(repoRoot, ['commit', '-m', 'init']);

      process.chdir(repoRoot);
      await runRepoAndStagedPrePushGateSilent();
      const evidence = JSON.parse(readFileSync(join(repoRoot, '.ai_evidence.json'), 'utf8')) as {
        snapshot?: { stage?: string; findings?: Array<{ ruleId?: string }> };
      };

      assert.equal(evidence.snapshot?.stage, 'PRE_PUSH');
      const findings = Array.isArray(evidence.snapshot?.findings) ? evidence.snapshot.findings : [];
      const ruleIds = findings.map((finding) => finding.ruleId ?? '');
      assert.equal(
        ruleIds.includes('skills.backend.no-console-log') ||
          ruleIds.includes('skills.frontend.no-console-log') ||
          ruleIds.includes('heuristics.ts.console-log.ast'),
        true
      );
    } finally {
      process.chdir(previousCwd);
    }
  });
});

test('runWorkingTreePrePushGateSilent emite evidencia con stage PRE_PUSH', async () => {
  await withTempDir('pumuki-menu-gate-workingtree-prepush-', async (repoRoot) => {
    const previousCwd = process.cwd();
    try {
      runGit(repoRoot, ['init']);
      runGit(repoRoot, ['config', 'user.email', 'pumuki@example.test']);
      runGit(repoRoot, ['config', 'user.name', 'Pumuki Test']);
      mkdirSync(join(repoRoot, 'scripts'), { recursive: true });
      writeFileSync(
        join(repoRoot, 'scripts', 'sample.ts'),
        'export const sample = () => { console.log("menu gate working tree prepush"); };\n',
        'utf8'
      );
      runGit(repoRoot, ['add', '.']);
      runGit(repoRoot, ['commit', '-m', 'init']);

      writeFileSync(
        join(repoRoot, 'scripts', 'sample.ts'),
        'export const sample = () => { console.log("menu gate working tree prepush changed"); };\n',
        'utf8'
      );

      process.chdir(repoRoot);
      await runWorkingTreePrePushGateSilent();
      const evidence = JSON.parse(readFileSync(join(repoRoot, '.ai_evidence.json'), 'utf8')) as {
        snapshot?: { stage?: string; findings?: Array<{ ruleId?: string }> };
      };

      assert.equal(evidence.snapshot?.stage, 'PRE_PUSH');
      const findings = Array.isArray(evidence.snapshot?.findings) ? evidence.snapshot.findings : [];
      const ruleIds = findings.map((finding) => finding.ruleId ?? '');
      assert.equal(
        ruleIds.includes('skills.backend.no-console-log') ||
          ruleIds.includes('skills.frontend.no-console-log') ||
          ruleIds.includes('heuristics.ts.console-log.ast'),
        true
      );
    } finally {
      process.chdir(previousCwd);
    }
  });
});
