import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildConsumerStartupTriageCommands,
  buildConsumerStartupTriageReportMarkdown,
  resolveConsumerStartupTriageOutputs,
} from '../consumer-startup-triage-lib';

test('resolveConsumerStartupTriageOutputs uses deterministic output names', () => {
  const outputs = resolveConsumerStartupTriageOutputs('.audit-reports/consumer-triage');

  assert.deepEqual(outputs, {
    authReport: '.audit-reports/consumer-triage/consumer-ci-auth-check.md',
    artifactsReport: '.audit-reports/consumer-triage/consumer-ci-artifacts-report.md',
    workflowLintReport: '.audit-reports/consumer-triage/consumer-workflow-lint-report.md',
    supportBundleReport: '.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md',
    supportTicketDraft: '.audit-reports/consumer-triage/consumer-support-ticket-draft.md',
    startupUnblockStatus: '.audit-reports/consumer-triage/consumer-startup-unblock-status.md',
    triageReport: '.audit-reports/consumer-triage/consumer-startup-triage-report.md',
  });
});

test('buildConsumerStartupTriageCommands includes workflow lint when configured', () => {
  const commands = buildConsumerStartupTriageCommands({
    repo: 'owner/repo',
    limit: 20,
    outDir: 'docs/validation',
    runWorkflowLint: true,
    repoPath: '/tmp/consumer',
    actionlintBin: '/tmp/actionlint',
  });

  assert.equal(commands[0]?.id, 'auth-check');
  assert.equal(commands[1]?.id, 'ci-artifacts');
  assert.equal(commands[2]?.id, 'workflow-lint');
  assert.equal(commands.at(-1)?.id, 'startup-unblock-status');
  assert.equal(commands.length, 6);
});

test('buildConsumerStartupTriageCommands throws when workflow lint args are missing', () => {
  assert.throws(
    () =>
      buildConsumerStartupTriageCommands({
        repo: 'owner/repo',
        limit: 20,
        outDir: 'docs/validation',
        runWorkflowLint: true,
      }),
    /Workflow lint requires --repo-path and --actionlint-bin/
  );
});

test('buildConsumerStartupTriageCommands omits workflow lint when skipped', () => {
  const commands = buildConsumerStartupTriageCommands({
    repo: 'owner/repo',
    limit: 20,
    outDir: 'docs/validation',
    runWorkflowLint: false,
  });

  assert.equal(commands.some((command) => command.id === 'workflow-lint'), false);
  assert.equal(commands.length, 5);
});

test('buildConsumerStartupTriageCommands can skip auth-check when preflight already ran', () => {
  const commands = buildConsumerStartupTriageCommands({
    repo: 'owner/repo',
    limit: 20,
    outDir: 'docs/validation',
    runWorkflowLint: false,
    includeAuthCheck: false,
  });

  assert.equal(commands.some((command) => command.id === 'auth-check'), false);
  assert.equal(commands[0]?.id, 'ci-artifacts');
  assert.equal(commands.length, 4);
});

test('buildConsumerStartupTriageReportMarkdown renders READY verdict for successful required steps', () => {
  const commands = buildConsumerStartupTriageCommands({
    repo: 'owner/repo',
    limit: 20,
    outDir: 'docs/validation',
    runWorkflowLint: false,
  });

  const markdown = buildConsumerStartupTriageReportMarkdown({
    generatedAt: '2026-02-08T00:00:00.000Z',
    repo: 'owner/repo',
    outDir: 'docs/validation',
    commands,
    executions: commands.map((command) => ({
      command,
      exitCode: 0,
      ok: true,
    })),
  });

  assert.match(markdown, /- verdict: READY/);
  assert.match(markdown, /Triage outputs are ready for review and escalation workflow\./);
});

test('buildConsumerStartupTriageReportMarkdown renders BLOCKED verdict for failed required steps', () => {
  const commands = buildConsumerStartupTriageCommands({
    repo: 'owner/repo',
    limit: 20,
    outDir: 'docs/validation',
    runWorkflowLint: false,
  });

  const markdown = buildConsumerStartupTriageReportMarkdown({
    generatedAt: '2026-02-08T00:00:00.000Z',
    repo: 'owner/repo',
    outDir: 'docs/validation',
    commands,
    executions: commands.map((command) => ({
      command,
      exitCode: command.id === 'auth-check' ? 1 : 0,
      ok: command.id !== 'auth-check',
    })),
  });

  assert.match(markdown, /- verdict: BLOCKED/);
  assert.match(markdown, /Resolve failed required step `auth-check` and rerun startup triage\./);
});
