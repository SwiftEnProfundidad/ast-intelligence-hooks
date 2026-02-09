import { copyFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { SmokeExpectation, SmokeMode } from './package-install-smoke-contract';
import { resolveSmokeExpectation } from './package-install-smoke-mode-lib';
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
  type RunCommandResult,
} from './package-install-smoke-runner-common';

type SmokeWorkspace = {
  repoRoot: string;
  reportsDir: string;
  reportRoot: string;
  tmpRoot: string;
  consumerRepo: string;
  bareRemote: string;
  commandLog: string[];
  summary: string[];
  tarballPath?: string;
};

const pushCommandLog = (
  commandLog: string[],
  result: RunCommandResult
): void => {
  commandLog.push(`$ ${result.command}\n${result.combined}`.trim());
};

const createSmokeWorkspace = (
  mode: SmokeMode
): SmokeWorkspace => {
  const repoRoot = resolve(process.cwd());
  const reportsDir = join(REPORTS_DIR_ROOT, mode);
  const reportRoot = join(repoRoot, reportsDir);
  ensureDirectory(reportRoot);

  const tmpRoot = mkdtempSync(join(tmpdir(), 'pumuki-package-smoke-'));
  const consumerRepo = join(tmpRoot, 'consumer');
  const bareRemote = join(tmpRoot, 'origin.git');

  return {
    repoRoot,
    reportsDir,
    reportRoot,
    tmpRoot,
    consumerRepo,
    bareRemote,
    commandLog: [],
    summary: ['# Package Install Smoke Report', ''],
  };
};

const createTarball = (
  workspace: SmokeWorkspace
): { id: string; tarballPath: string } => {
  const packResult = runCommand({
    cwd: workspace.repoRoot,
    executable: 'npm',
    args: ['pack', '--json'],
  });
  pushCommandLog(workspace.commandLog, packResult);
  assertSuccess(packResult, 'npm pack --json');

  const packInfo = JSON.parse(packResult.stdout) as Array<{ filename: string; id: string }>;
  if (!Array.isArray(packInfo) || packInfo.length === 0 || !packInfo[0]?.filename) {
    throw new Error('npm pack --json did not return a valid tarball payload');
  }

  const tarballPath = join(workspace.repoRoot, packInfo[0].filename);
  if (!existsSync(tarballPath)) {
    throw new Error(`Packed tarball not found at ${tarballPath}`);
  }

  return { id: packInfo[0].id, tarballPath };
};

const runGitStep = (
  workspace: SmokeWorkspace,
  args: string[],
  context: string,
  cwd = workspace.consumerRepo
): void => {
  assertSuccess(
    runCommand({ cwd, executable: 'git', args }),
    context
  );
};

const runNpmStep = (
  workspace: SmokeWorkspace,
  args: string[],
  context: string
): void => {
  assertSuccess(
    runCommand({ cwd: workspace.consumerRepo, executable: 'npm', args }),
    context
  );
};

const setupConsumerRepository = (
  workspace: SmokeWorkspace,
  mode: SmokeMode
): void => {
  ensureDirectory(workspace.consumerRepo);

  runGitStep(workspace, ['init', '-b', 'main'], 'git init');
  runGitStep(
    workspace,
    ['config', 'user.email', 'pumuki-smoke@example.com'],
    'git config user.email'
  );
  runGitStep(
    workspace,
    ['config', 'user.name', 'Pumuki Smoke'],
    'git config user.name'
  );
  runNpmStep(workspace, ['init', '-y'], 'npm init');
  runNpmStep(workspace, ['install', workspace.tarballPath ?? ''], 'npm install <tarball>');

  const installCheck = runCommand({
    cwd: workspace.consumerRepo,
    executable: 'node',
    args: ['-e', "const p=require('pumuki-ast-hooks'); console.log(p.name,p.version);"],
  });
  pushCommandLog(workspace.commandLog, installCheck);
  assertSuccess(installCheck, 'package require smoke');

  writeBaselineFile(workspace.consumerRepo);
  runGitStep(workspace, ['add', '.'], 'git add baseline');
  runGitStep(workspace, ['commit', '-m', 'chore: baseline'], 'git commit baseline');

  runGitStep(
    workspace,
    ['init', '--bare', workspace.bareRemote],
    'git init --bare',
    workspace.tmpRoot
  );
  runGitStep(workspace, ['remote', 'add', 'origin', workspace.bareRemote], 'git remote add origin');
  runGitStep(workspace, ['push', '-u', 'origin', 'main'], 'git push origin main');
  runGitStep(workspace, ['checkout', '-b', 'feature/package-smoke'], 'git checkout feature branch');
  runGitStep(
    workspace,
    ['branch', '--set-upstream-to=origin/main', 'feature/package-smoke'],
    'git branch --set-upstream-to'
  );

  if (mode === 'block') {
    writeRangePayloadFiles(workspace.consumerRepo);
    runGitStep(workspace, ['add', '.'], 'git add range payload');
    runGitStep(
      workspace,
      ['commit', '-m', 'test: range payload for package smoke'],
      'git commit range payload'
    );
  }
};

const writeStagedPayload = (
  workspace: SmokeWorkspace,
  mode: SmokeMode
): void => {
  const stagedFile =
    mode === 'block'
      ? writeStagedOnlyViolationFile(workspace.consumerRepo)
      : writeStagedOnlyFile(workspace.consumerRepo);
  runGitStep(workspace, ['add', stagedFile], 'git add staged-only payload');
};

const runGateStep = (
  workspace: SmokeWorkspace,
  step: {
    label: 'pre-commit' | 'pre-push' | 'ci';
    command: string;
    args: string[];
    evidenceFile: string;
    stage: 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';
  },
  expectation: SmokeExpectation
): { outcome: string; exitCode: number } => {
  const result = runCommand({
    cwd: workspace.consumerRepo,
    executable: step.command,
    args: step.args,
    env: step.label === 'ci' ? { GITHUB_BASE_REF: 'main' } : undefined,
  });

  pushCommandLog(workspace.commandLog, result);
  assertNoFatalOutput(result, `pumuki-${step.label}`);
  if (result.exitCode !== expectation.expectedExitCode) {
    throw new Error(
      `pumuki-${step.label} expected exit code ${expectation.expectedExitCode}, got ${result.exitCode}`
    );
  }

  copyFileSync(
    join(workspace.consumerRepo, '.ai_evidence.json'),
    join(workspace.reportRoot, step.evidenceFile)
  );

  const evidence = parseEvidence(join(workspace.reportRoot, step.evidenceFile));
  if (evidence.version !== '2.1' || evidence.stage !== step.stage) {
    throw new Error(
      `Invalid ${step.stage} evidence metadata: version=${evidence.version} stage=${evidence.stage}`
    );
  }

  if (evidence.outcome !== expectation.expectedOutcome) {
    throw new Error(
      `Unexpected ${step.stage} evidence outcome for mode: ${evidence.outcome}`
    );
  }

  return {
    outcome: evidence.outcome,
    exitCode: result.exitCode,
  };
};

const writeFailureReport = (
  workspace: SmokeWorkspace,
  error: Error
): void => {
  workspace.summary.push('- Status: FAIL');
  workspace.summary.push(`- Error: ${error.message}`);
  writeReportFile(
    workspace.repoRoot,
    join(workspace.reportsDir, 'command.log'),
    workspace.commandLog.join('\n\n')
  );
  writeReportFile(
    workspace.repoRoot,
    join(workspace.reportsDir, 'summary.md'),
    workspace.summary.join('\n')
  );
};

const cleanupWorkspace = (workspace: SmokeWorkspace): void => {
  if (workspace.tarballPath) {
    rmSync(workspace.tarballPath, { force: true });
  }
  rmSync(workspace.tmpRoot, { recursive: true, force: true });
};

const writeSuccessReport = (workspace: SmokeWorkspace): void => {
  writeReportFile(
    workspace.repoRoot,
    join(workspace.reportsDir, 'command.log'),
    workspace.commandLog.join('\n\n')
  );
  writeReportFile(
    workspace.repoRoot,
    join(workspace.reportsDir, 'summary.md'),
    workspace.summary.join('\n')
  );
};

export const runPackageInstallSmoke = (mode: SmokeMode): void => {
  const workspace = createSmokeWorkspace(mode);
  const expectation = resolveSmokeExpectation(mode);

  try {
    workspace.summary.push(`- Repository root: \`${workspace.repoRoot}\``);
    workspace.summary.push(`- Temporary workspace: \`${workspace.tmpRoot}\``);
    workspace.summary.push('');

    const tarball = createTarball(workspace);
    workspace.tarballPath = tarball.tarballPath;
    workspace.summary.push(`- Smoke mode: \`${mode}\``);
    workspace.summary.push(`- Packed tarball: \`${tarball.id}\``);

    setupConsumerRepository(workspace, mode);
    writeStagedPayload(workspace, mode);

    const preCommit = runGateStep(
      workspace,
      {
        label: 'pre-commit',
        command: 'npx',
        args: ['--yes', 'pumuki-pre-commit'],
        evidenceFile: 'pre-commit.ai_evidence.json',
        stage: 'PRE_COMMIT',
      },
      expectation
    );

    const prePush = runGateStep(
      workspace,
      {
        label: 'pre-push',
        command: 'npx',
        args: ['--yes', 'pumuki-pre-push'],
        evidenceFile: 'pre-push.ai_evidence.json',
        stage: 'PRE_PUSH',
      },
      expectation
    );

    const ci = runGateStep(
      workspace,
      {
        label: 'ci',
        command: 'npx',
        args: ['--yes', 'pumuki-ci'],
        evidenceFile: 'ci.ai_evidence.json',
        stage: 'CI',
      },
      expectation
    );

    workspace.summary.push('- Status: PASS');
    workspace.summary.push(`- pre-commit exit: \`${preCommit.exitCode}\` (${preCommit.outcome})`);
    workspace.summary.push(`- pre-push exit: \`${prePush.exitCode}\` (${prePush.outcome})`);
    workspace.summary.push(`- ci exit: \`${ci.exitCode}\` (${ci.outcome})`);
    workspace.summary.push(`- Artifact root: \`${workspace.reportsDir}\``);

    writeSuccessReport(workspace);
  } catch (error) {
    writeFailureReport(
      workspace,
      error instanceof Error ? error : new Error('unknown package smoke failure')
    );
    throw error;
  } finally {
    cleanupWorkspace(workspace);
  }
};
