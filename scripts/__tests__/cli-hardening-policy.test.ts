import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const PROCESS_EXIT_FILES = [
  'integrations/git/runCliCommand.ts',
  'integrations/lifecycle/cli.ts',
  'scripts/adapters/install-agent-config.ts',
  'scripts/build-adapter-readiness.ts',
  'scripts/build-adapter-real-session-report.ts',
  'scripts/build-consumer-startup-triage.ts',
  'scripts/build-consumer-startup-unblock-status.ts',
  'scripts/build-consumer-support-ticket-draft.ts',
  'scripts/build-mock-consumer-ab-report.ts',
  'scripts/build-mock-consumer-startup-triage.ts',
  'scripts/build-phase5-blockers-readiness.ts',
  'scripts/build-phase5-execution-closure-status.ts',
  'scripts/build-phase5-external-handoff.ts',
  'scripts/clean-validation-artifacts.ts',
  'scripts/run-phase5-execution-closure.ts',
];

const CONSOLE_FILES = [
  'integrations/git/runCliCommand.ts',
  'integrations/git/runPlatformGate.ts',
  'integrations/git/runPlatformGateOutput.ts',
  'integrations/git/stageRunners.ts',
  'integrations/lifecycle/cli.ts',
  'scripts/build-mock-consumer-ab-report.ts',
  'scripts/check-package-manifest.ts',
];

const CHILD_PROCESS_SYNC_FILES = [
  'integrations/git/GitService.ts',
  'integrations/evidence/repoState.ts',
  'integrations/git/evaluateStagedIOS.ts',
  'integrations/git/resolveGitRefs.ts',
  'integrations/lifecycle/gitService.ts',
  'integrations/lifecycle/npmService.ts',
  'integrations/mcp/enterpriseServer.ts',
  'integrations/sdd/openSpecCli.ts',
  'scripts/adapter-real-session-git-lib.ts',
  'scripts/adapter-session-status-command-lib.ts',
  'scripts/build-consumer-startup-triage-runner-lib.ts',
  'scripts/collect-consumer-ci-artifacts-gh-command-lib.ts',
  'scripts/consumer-ci-auth-check-gh-lib.ts',
  'scripts/consumer-support-bundle-gh-command-lib.ts',
  'scripts/consumer-workflow-lint-command-lib.ts',
  'scripts/framework-menu-runner-git-lib.ts',
  'scripts/framework-menu-runner-process-lib.ts',
  'scripts/package-install-smoke-command-lib.ts',
  'scripts/phase5-execution-closure-runner-exec-command-lib.ts',
];

const readRepoFile = (relativePath: string): string => {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
};

test('policy: scripts/integrations productivos no deben usar process.exit directamente', () => {
  for (const filePath of PROCESS_EXIT_FILES) {
    const source = readRepoFile(filePath);
    assert.equal(
      /process\.exit\s*\(/.test(source),
      false,
      `${filePath} still uses process.exit(...)`
    );
  }
});

test('policy: salida CLI usa stdout/stderr en vez de console.log/error', () => {
  for (const filePath of CONSOLE_FILES) {
    const source = readRepoFile(filePath);
    assert.equal(
      /console\.log\s*\(/.test(source),
      false,
      `${filePath} still uses console.log(...)`
    );
    assert.equal(
      /console\.error\s*\(/.test(source),
      false,
      `${filePath} still uses console.error(...)`
    );
  }
});

test('policy: evitar child_process sync en rutas auditadas', () => {
  for (const filePath of CHILD_PROCESS_SYNC_FILES) {
    const source = readRepoFile(filePath);
    assert.equal(
      /execFileSync\s*\(/.test(source),
      false,
      `${filePath} still uses execFileSync(...)`
    );
    assert.equal(
      /spawnSync\s*\(/.test(source),
      false,
      `${filePath} still uses spawnSync(...)`
    );
  }
});
