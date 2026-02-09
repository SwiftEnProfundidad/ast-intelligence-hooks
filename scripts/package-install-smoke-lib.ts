import { copyFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
  writeBaselineFile,
  writeRangePayloadFiles,
  writeStagedOnlyFile,
  writeStagedOnlyViolationFile,
} from './package-install-smoke-fixtures-lib';
import {
  REPORTS_DIR_ROOT,
  assertNoFatalOutput,
  assertSuccess,
  ensureDirectory,
  parseEvidence,
  runCommand,
  writeReportFile,
} from './package-install-smoke-runner-common';

export type SmokeMode = 'block' | 'minimal';

export const parsePackageInstallSmokeMode = (
  args: ReadonlyArray<string>
): SmokeMode => {
  const modeArg = args.find((argument) => argument.startsWith('--mode='));
  if (!modeArg) {
    return 'block';
  }

  const value = modeArg.slice('--mode='.length).trim();
  if (value === 'block' || value === 'minimal') {
    return value;
  }

  throw new Error(`Unsupported --mode value "${value}". Allowed values: block, minimal`);
};

export const runPackageInstallSmoke = (mode: SmokeMode): void => {
  const expectedExitCode = mode === 'block' ? 1 : 0;
  const expectedOutcome = mode === 'block' ? 'BLOCK' : 'PASS';
  const repoRoot = resolve(process.cwd());
  const reportsDir = join(REPORTS_DIR_ROOT, mode);
  const reportRoot = join(repoRoot, reportsDir);
  ensureDirectory(reportRoot);

  const commandLog: string[] = [];
  const summary: string[] = ['# Package Install Smoke Report', ''];
  const tmpRoot = mkdtempSync(join(tmpdir(), 'pumuki-package-smoke-'));
  const consumerRepo = join(tmpRoot, 'consumer');
  const bareRemote = join(tmpRoot, 'origin.git');
  let tarballPath = '';

  try {
    summary.push(`- Repository root: \`${repoRoot}\``);
    summary.push(`- Temporary workspace: \`${tmpRoot}\``);
    summary.push('');

    const packResult = runCommand({
      cwd: repoRoot,
      executable: 'npm',
      args: ['pack', '--json'],
    });
    commandLog.push(`$ ${packResult.command}\n${packResult.combined}`.trim());
    assertSuccess(packResult, 'npm pack --json');

    const packInfo = JSON.parse(packResult.stdout) as Array<{ filename: string; id: string }>;
    if (!Array.isArray(packInfo) || packInfo.length === 0 || !packInfo[0]?.filename) {
      throw new Error('npm pack --json did not return a valid tarball payload');
    }

    tarballPath = join(repoRoot, packInfo[0].filename);
    if (!existsSync(tarballPath)) {
      throw new Error(`Packed tarball not found at ${tarballPath}`);
    }

    summary.push(`- Smoke mode: \`${mode}\``);
    summary.push(`- Packed tarball: \`${packInfo[0].id}\``);

    ensureDirectory(consumerRepo);
    assertSuccess(
      runCommand({ cwd: consumerRepo, executable: 'git', args: ['init', '-b', 'main'] }),
      'git init'
    );
    assertSuccess(
      runCommand({
        cwd: consumerRepo,
        executable: 'git',
        args: ['config', 'user.email', 'pumuki-smoke@example.com'],
      }),
      'git config user.email'
    );
    assertSuccess(
      runCommand({
        cwd: consumerRepo,
        executable: 'git',
        args: ['config', 'user.name', 'Pumuki Smoke'],
      }),
      'git config user.name'
    );
    assertSuccess(
      runCommand({ cwd: consumerRepo, executable: 'npm', args: ['init', '-y'] }),
      'npm init'
    );
    assertSuccess(
      runCommand({
        cwd: consumerRepo,
        executable: 'npm',
        args: ['install', tarballPath],
      }),
      'npm install <tarball>'
    );

    const installCheck = runCommand({
      cwd: consumerRepo,
      executable: 'node',
      args: ['-e', "const p=require('pumuki-ast-hooks'); console.log(p.name,p.version);"],
    });
    commandLog.push(`$ ${installCheck.command}\n${installCheck.combined}`.trim());
    assertSuccess(installCheck, 'package require smoke');

    writeBaselineFile(consumerRepo);

    assertSuccess(
      runCommand({ cwd: consumerRepo, executable: 'git', args: ['add', '.'] }),
      'git add baseline'
    );
    assertSuccess(
      runCommand({
        cwd: consumerRepo,
        executable: 'git',
        args: ['commit', '-m', 'chore: baseline'],
      }),
      'git commit baseline'
    );

    assertSuccess(
      runCommand({ cwd: tmpRoot, executable: 'git', args: ['init', '--bare', bareRemote] }),
      'git init --bare'
    );
    assertSuccess(
      runCommand({ cwd: consumerRepo, executable: 'git', args: ['remote', 'add', 'origin', bareRemote] }),
      'git remote add origin'
    );
    assertSuccess(
      runCommand({ cwd: consumerRepo, executable: 'git', args: ['push', '-u', 'origin', 'main'] }),
      'git push origin main'
    );

    assertSuccess(
      runCommand({ cwd: consumerRepo, executable: 'git', args: ['checkout', '-b', 'feature/package-smoke'] }),
      'git checkout feature branch'
    );
    assertSuccess(
      runCommand({
        cwd: consumerRepo,
        executable: 'git',
        args: ['branch', '--set-upstream-to=origin/main', 'feature/package-smoke'],
      }),
      'git branch --set-upstream-to'
    );

    if (mode === 'block') {
      writeRangePayloadFiles(consumerRepo);
      assertSuccess(
        runCommand({ cwd: consumerRepo, executable: 'git', args: ['add', '.'] }),
        'git add range payload'
      );
      assertSuccess(
        runCommand({
          cwd: consumerRepo,
          executable: 'git',
          args: ['commit', '-m', 'test: range payload for package smoke'],
        }),
        'git commit range payload'
      );
    }

    const stagedFile =
      mode === 'block'
        ? writeStagedOnlyViolationFile(consumerRepo)
        : writeStagedOnlyFile(consumerRepo);
    assertSuccess(
      runCommand({ cwd: consumerRepo, executable: 'git', args: ['add', stagedFile] }),
      'git add staged-only payload'
    );

    const preCommit = runCommand({
      cwd: consumerRepo,
      executable: 'npx',
      args: ['--yes', 'pumuki-pre-commit'],
    });
    commandLog.push(`$ ${preCommit.command}\n${preCommit.combined}`.trim());
    assertNoFatalOutput(preCommit, 'pumuki-pre-commit');
    if (preCommit.exitCode !== expectedExitCode) {
      throw new Error(
        `pumuki-pre-commit expected exit code ${expectedExitCode}, got ${preCommit.exitCode}`
      );
    }
    copyFileSync(
      join(consumerRepo, '.ai_evidence.json'),
      join(reportRoot, 'pre-commit.ai_evidence.json')
    );

    const prePush = runCommand({
      cwd: consumerRepo,
      executable: 'npx',
      args: ['--yes', 'pumuki-pre-push'],
    });
    commandLog.push(`$ ${prePush.command}\n${prePush.combined}`.trim());
    assertNoFatalOutput(prePush, 'pumuki-pre-push');
    if (prePush.exitCode !== expectedExitCode) {
      throw new Error(
        `pumuki-pre-push expected exit code ${expectedExitCode}, got ${prePush.exitCode}`
      );
    }
    copyFileSync(
      join(consumerRepo, '.ai_evidence.json'),
      join(reportRoot, 'pre-push.ai_evidence.json')
    );

    const ci = runCommand({
      cwd: consumerRepo,
      executable: 'npx',
      args: ['--yes', 'pumuki-ci'],
      env: { GITHUB_BASE_REF: 'main' },
    });
    commandLog.push(`$ ${ci.command}\n${ci.combined}`.trim());
    assertNoFatalOutput(ci, 'pumuki-ci');
    if (ci.exitCode !== expectedExitCode) {
      throw new Error(`pumuki-ci expected exit code ${expectedExitCode}, got ${ci.exitCode}`);
    }
    copyFileSync(join(consumerRepo, '.ai_evidence.json'), join(reportRoot, 'ci.ai_evidence.json'));

    const preCommitEvidence = parseEvidence(join(reportRoot, 'pre-commit.ai_evidence.json'));
    const prePushEvidence = parseEvidence(join(reportRoot, 'pre-push.ai_evidence.json'));
    const ciEvidence = parseEvidence(join(reportRoot, 'ci.ai_evidence.json'));

    if (preCommitEvidence.version !== '2.1' || preCommitEvidence.stage !== 'PRE_COMMIT') {
      throw new Error(
        `Invalid PRE_COMMIT evidence metadata: version=${preCommitEvidence.version} stage=${preCommitEvidence.stage}`
      );
    }
    if (prePushEvidence.version !== '2.1' || prePushEvidence.stage !== 'PRE_PUSH') {
      throw new Error(
        `Invalid PRE_PUSH evidence metadata: version=${prePushEvidence.version} stage=${prePushEvidence.stage}`
      );
    }
    if (ciEvidence.version !== '2.1' || ciEvidence.stage !== 'CI') {
      throw new Error(
        `Invalid CI evidence metadata: version=${ciEvidence.version} stage=${ciEvidence.stage}`
      );
    }
    if (
      preCommitEvidence.outcome !== expectedOutcome ||
      prePushEvidence.outcome !== expectedOutcome ||
      ciEvidence.outcome !== expectedOutcome
    ) {
      throw new Error(
        `Unexpected evidence outcomes for mode=${mode}: preCommit=${preCommitEvidence.outcome}, prePush=${prePushEvidence.outcome}, ci=${ciEvidence.outcome}`
      );
    }

    summary.push('- Status: PASS');
    summary.push(`- pre-commit exit: \`${preCommit.exitCode}\` (${preCommitEvidence.outcome})`);
    summary.push(`- pre-push exit: \`${prePush.exitCode}\` (${prePushEvidence.outcome})`);
    summary.push(`- ci exit: \`${ci.exitCode}\` (${ciEvidence.outcome})`);
    summary.push(`- Artifact root: \`${reportsDir}\``);
  } catch (error) {
    summary.push('- Status: FAIL');
    summary.push(`- Error: ${(error as Error).message}`);
    writeReportFile(repoRoot, join(reportsDir, 'command.log'), commandLog.join('\n\n'));
    writeReportFile(repoRoot, join(reportsDir, 'summary.md'), summary.join('\n'));
    throw error;
  } finally {
    if (tarballPath) {
      rmSync(tarballPath, { force: true });
    }
    rmSync(tmpRoot, { recursive: true, force: true });
  }

  writeReportFile(repoRoot, join(reportsDir, 'command.log'), commandLog.join('\n\n'));
  writeReportFile(repoRoot, join(reportsDir, 'summary.md'), summary.join('\n'));
};
