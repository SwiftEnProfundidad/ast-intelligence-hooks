import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  assertNoFatalOutput,
  assertSuccess,
  runCommand,
} from './package-install-smoke-runner-common';
import {
  pushCommandLog,
  type SmokeWorkspace,
} from './package-install-smoke-workspace-lib';
import { resolveConsumerPumukiCommand } from './package-install-smoke-command-resolution-lib';
import packageJson from '../package.json';

const runNpmStep = (
  workspace: SmokeWorkspace,
  args: string[],
  context: string,
  env?: NodeJS.ProcessEnv
): void => {
  assertSuccess(
    runCommand({ cwd: workspace.consumerRepo, executable: 'npm', args, env }),
    context
  );
};

export const installTarballIntoConsumerRepo = (
  workspace: SmokeWorkspace
): void => {
  runNpmStep(workspace, ['init', '-y'], 'npm init');
  writeFileSync(
    join(workspace.consumerRepo, '.gitignore'),
    'node_modules/\n.ai_evidence.json\n',
    'utf8'
  );
  runNpmStep(
    workspace,
    ['install', workspace.tarballPath ?? ''],
    'npm install <tarball>',
    {
      PUMUKI_SKIP_POSTINSTALL: '1',
    }
  );
};

export const verifyInstalledPackageCanBeRequired = (
  workspace: SmokeWorkspace
): void => {
  const packageName = packageJson.name;
  const installCheck = runCommand({
    cwd: workspace.consumerRepo,
    executable: 'node',
    args: ['-e', `const p=require('${packageName}'); console.log(p.name,p.version);`],
  });
  pushCommandLog(workspace.commandLog, installCheck);
  assertSuccess(installCheck, 'package require smoke');
};

export const verifyInstalledPumukiBinaryVersion = (
  workspace: SmokeWorkspace
): void => {
  const hasInstalledStatusVersion = (
    result: ReturnType<typeof runCommand>,
  ): boolean => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(result.stdout);
    } catch {
      return false;
    }

    const packageVersion =
      typeof parsed === 'object' && parsed !== null && 'packageVersion' in parsed
        ? (parsed as { packageVersion?: unknown }).packageVersion
        : null;
    const effectiveVersion =
      typeof parsed === 'object'
      && parsed !== null
      && 'version' in parsed
      && typeof (parsed as { version?: unknown }).version === 'object'
      && (parsed as { version: { effective?: unknown } }).version !== null
        ? (parsed as { version: { effective?: unknown } }).version.effective
        : null;

    return packageVersion === packageJson.version || effectiveVersion === packageJson.version;
  };

  const assertInstalledStatusVersion = (
    result: ReturnType<typeof runCommand>,
    context: string
  ): void => {
    if (hasInstalledStatusVersion(result)) {
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(result.stdout);
    } catch {
      throw new Error(`${context} returned invalid JSON\n${result.combined}`);
    }

    const packageVersion =
      typeof parsed === 'object' && parsed !== null && 'packageVersion' in parsed
        ? (parsed as { packageVersion?: unknown }).packageVersion
        : null;
    const effectiveVersion =
      typeof parsed === 'object'
      && parsed !== null
      && 'version' in parsed
      && typeof (parsed as { version?: unknown }).version === 'object'
      && (parsed as { version: { effective?: unknown } }).version !== null
        ? (parsed as { version: { effective?: unknown } }).version.effective
        : null;

    throw new Error(
      `${context} reported unexpected version (packageVersion=${String(packageVersion)}, effectiveVersion=${String(effectiveVersion)}, expected=${packageJson.version})`
    );
  };

  const noInstallVersionCheck = runCommand({
    cwd: workspace.consumerRepo,
    executable: 'npx',
    args: ['--no-install', 'pumuki', 'status', '--json'],
  });
  pushCommandLog(workspace.commandLog, noInstallVersionCheck);

  const noInstallPassed =
    noInstallVersionCheck.exitCode === 0
    && !/Cannot find module|ERR_MODULE_NOT_FOUND|failed to resolve tsx runtime/.test(
      noInstallVersionCheck.combined
    )
    && hasInstalledStatusVersion(noInstallVersionCheck);
  if (noInstallPassed) {
    assertNoFatalOutput(noInstallVersionCheck, 'pumuki status --json smoke');
    assertInstalledStatusVersion(noInstallVersionCheck, 'pumuki status --json smoke');
    return;
  }

  const fallback = resolveConsumerPumukiCommand({
    consumerRepo: workspace.consumerRepo,
    binary: 'pumuki',
    args: ['status', '--json'],
  });
  const fallbackCheck = runCommand({
    cwd: workspace.consumerRepo,
    executable: fallback.executable,
    args: fallback.args,
  });
  pushCommandLog(workspace.commandLog, fallbackCheck);
  assertSuccess(
    fallbackCheck,
    `pumuki status --json smoke fallback (${fallback.resolution})`
  );
  assertNoFatalOutput(
    fallbackCheck,
    `pumuki status --json smoke fallback (${fallback.resolution})`
  );
  assertInstalledStatusVersion(
    fallbackCheck,
    `pumuki status --json smoke fallback (${fallback.resolution})`
  );
};
