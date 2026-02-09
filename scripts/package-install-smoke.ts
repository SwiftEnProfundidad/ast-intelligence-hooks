import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

type RunCommandResult = {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  combined: string;
};

const FATAL_OUTPUT_PATTERNS = [
  'Cannot find module',
  'ERR_MODULE_NOT_FOUND',
  'failed to resolve tsx runtime',
];

const REPORTS_DIR = join('.audit-reports', 'package-smoke');

const ensureDirectory = (path: string): void => {
  mkdirSync(path, { recursive: true });
};

const writeReportFile = (repoRoot: string, relativePath: string, content: string): void => {
  const filePath = join(repoRoot, relativePath);
  ensureDirectory(join(filePath, '..'));
  writeFileSync(filePath, content, 'utf8');
};

const runCommand = (params: {
  cwd: string;
  executable: string;
  args: string[];
  env?: NodeJS.ProcessEnv;
}): RunCommandResult => {
  const { cwd, executable, args, env } = params;
  const command = `${executable} ${args.join(' ')}`.trim();
  const result = spawnSync(executable, args, {
    cwd,
    env: {
      ...process.env,
      ...env,
    },
    encoding: 'utf8',
  });

  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const combined = `${stdout}${stderr}`;
  const exitCode =
    typeof result.status === 'number'
      ? result.status
      : result.error
        ? 1
        : 0;

  return { command, exitCode, stdout, stderr, combined };
};

const assertSuccess = (result: RunCommandResult, context: string): void => {
  if (result.exitCode !== 0) {
    throw new Error(
      `${context} failed (${result.command}) with exit code ${result.exitCode}\n${result.combined}`
    );
  }
};

const assertNoFatalOutput = (result: RunCommandResult, context: string): void => {
  const failingPattern = FATAL_OUTPUT_PATTERNS.find((pattern) =>
    result.combined.includes(pattern)
  );
  if (failingPattern) {
    throw new Error(
      `${context} output contains fatal pattern "${failingPattern}"\n${result.combined}`
    );
  }
};

const writeBaselineFile = (consumerRepo: string): void => {
  const relativePath = 'apps/backend/src/baseline.ts';
  const filePath = join(consumerRepo, relativePath);
  ensureDirectory(join(filePath, '..'));
  writeFileSync(
    filePath,
    ["export const baseline = (): string => 'ok';", ''].join('\n'),
    'utf8'
  );
};

const writeRangePayloadFiles = (consumerRepo: string): void => {
  const files: Record<string, string> = {
    'apps/backend/src/range-smoke.ts': [
      'export const backendRangeSmoke = (): string => {',
      "  console.log('backend-range-smoke');",
      "  return 'ok';",
      '};',
      '',
    ].join('\n'),
    'apps/web/src/range-smoke.tsx': [
      'export function FrontendRangeSmoke(): string {',
      "  console.log('frontend-range-smoke');",
      "  return 'ok';",
      '}',
      '',
    ].join('\n'),
    'apps/android/app/src/main/java/com/example/RangeSmoke.kt': [
      'package com.example',
      '',
      'class RangeSmoke {',
      '  fun block(): String {',
      '    Thread.sleep(1000)',
      '    return "ok"',
      '  }',
      '}',
      '',
    ].join('\n'),
    'apps/ios/RangeSmoke.swift': [
      'import Foundation',
      '',
      'func rangeSmoke() -> String {',
      '  let value: String? = "ok"',
      '  return value!',
      '}',
      '',
    ].join('\n'),
  };

  for (const [relativePath, content] of Object.entries(files)) {
    const filePath = join(consumerRepo, relativePath);
    ensureDirectory(join(filePath, '..'));
    writeFileSync(filePath, content, 'utf8');
  }
};

const writeStagedOnlyFile = (consumerRepo: string): string => {
  const relativePath = 'apps/backend/src/staged-smoke.ts';
  const filePath = join(consumerRepo, relativePath);
  ensureDirectory(join(filePath, '..'));
  writeFileSync(
    filePath,
    [
      'export const stagedSmoke = (): string => {',
      "  console.log('backend-staged-smoke');",
      "  return 'ok';",
      '};',
      '',
    ].join('\n'),
    'utf8'
  );
  return relativePath;
};

const parseEvidence = (filePath: string): { version: string; stage: string; outcome: string } => {
  const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as {
    version?: string;
    snapshot?: { stage?: string; outcome?: string };
  };
  return {
    version: parsed.version ?? 'missing',
    stage: parsed.snapshot?.stage ?? 'missing',
    outcome: parsed.snapshot?.outcome ?? 'missing',
  };
};

const main = (): void => {
  const repoRoot = resolve(process.cwd());
  const reportRoot = join(repoRoot, REPORTS_DIR);
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

    const stagedFile = writeStagedOnlyFile(consumerRepo);
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
    if (preCommit.exitCode !== 1) {
      throw new Error(`pumuki-pre-commit expected exit code 1, got ${preCommit.exitCode}`);
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
    if (prePush.exitCode !== 1) {
      throw new Error(`pumuki-pre-push expected exit code 1, got ${prePush.exitCode}`);
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
    if (ci.exitCode !== 1) {
      throw new Error(`pumuki-ci expected exit code 1, got ${ci.exitCode}`);
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

    summary.push('- Status: PASS');
    summary.push(`- pre-commit exit: \`${preCommit.exitCode}\` (${preCommitEvidence.outcome})`);
    summary.push(`- pre-push exit: \`${prePush.exitCode}\` (${prePushEvidence.outcome})`);
    summary.push(`- ci exit: \`${ci.exitCode}\` (${ciEvidence.outcome})`);
    summary.push(`- Artifact root: \`${REPORTS_DIR}\``);
  } catch (error) {
    summary.push('- Status: FAIL');
    summary.push(`- Error: ${(error as Error).message}`);
    writeReportFile(repoRoot, join(REPORTS_DIR, 'command.log'), commandLog.join('\n\n'));
    writeReportFile(repoRoot, join(REPORTS_DIR, 'summary.md'), summary.join('\n'));
    throw error;
  } finally {
    if (tarballPath) {
      rmSync(tarballPath, { force: true });
    }
    rmSync(tmpRoot, { recursive: true, force: true });
  }

  writeReportFile(repoRoot, join(REPORTS_DIR, 'command.log'), commandLog.join('\n\n'));
  writeReportFile(repoRoot, join(REPORTS_DIR, 'summary.md'), summary.join('\n'));
};

main();
