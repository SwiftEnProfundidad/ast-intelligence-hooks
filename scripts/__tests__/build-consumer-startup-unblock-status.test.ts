import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';

const scriptPath = resolve(process.cwd(), 'scripts/build-consumer-startup-unblock-status.ts');

const runGenerator = (params: {
  cwd: string;
  repo: string;
  supportBundleFile: string;
  authReportFile: string;
  workflowLintReportFile: string;
  outFile: string;
}): string => {
  return execFileSync(
    'npx',
    [
      '--yes',
      'tsx@4.21.0',
      scriptPath,
      '--repo',
      params.repo,
      '--support-bundle',
      params.supportBundleFile,
      '--auth-report',
      params.authReportFile,
      '--workflow-lint-report',
      params.workflowLintReportFile,
      '--out',
      params.outFile,
    ],
    {
      cwd: params.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    }
  );
};

test('build-consumer-startup-unblock-status generates READY_FOR_RETEST report', async () => {
  await withTempDir('pumuki-consumer-unblock-build-', (tempRoot) => {
    const outDir = join(tempRoot, '.audit-reports/consumer-triage');
    mkdirSync(outDir, { recursive: true });

    writeFileSync(
      join(outDir, 'consumer-startup-failure-support-bundle.md'),
      [
        '# Consumer CI Startup Failure Support Bundle',
        '',
        '- startup_failure_runs: 0',
        '',
        'https://github.com/owner/repo/actions/runs/123',
      ].join('\n'),
      'utf8'
    );
    writeFileSync(
      join(outDir, 'consumer-ci-auth-check.md'),
      [
        '# Consumer CI Auth Check',
        '',
        '- verdict: READY',
        '- missing_scopes: (none)',
      ].join('\n'),
      'utf8'
    );
    writeFileSync(
      join(outDir, 'consumer-workflow-lint-report.md'),
      [
        '# Consumer Workflow Lint Report',
        '',
        '- exit_code: 0',
        '',
        '## Result',
        '',
        '- No issues reported by actionlint.',
      ].join('\n'),
      'utf8'
    );

    const stdout = runGenerator({
      cwd: tempRoot,
      repo: 'owner/repo',
      supportBundleFile:
        '.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md',
      authReportFile: '.audit-reports/consumer-triage/consumer-ci-auth-check.md',
      workflowLintReportFile:
        '.audit-reports/consumer-triage/consumer-workflow-lint-report.md',
      outFile: '.audit-reports/consumer-triage/consumer-startup-unblock-status.md',
    });

    assert.match(stdout, /verdict=READY_FOR_RETEST/);

    const report = readFileSync(
      join(outDir, 'consumer-startup-unblock-status.md'),
      'utf8'
    );
    assert.match(report, /- verdict: READY_FOR_RETEST/);
    assert.match(report, /- startup_failure_runs: 0/);
    assert.match(report, /- workflow_lint_findings: 0/);
  });
});
