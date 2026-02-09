import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { withTempDir } from '../../integrations/__tests__/helpers/tempDir';

const scriptPath = resolve(process.cwd(), 'scripts/build-consumer-support-ticket-draft.ts');

const runGenerator = (params: {
  cwd: string;
  repo: string;
  supportBundleFile: string;
  authReportFile: string;
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

test('build-consumer-support-ticket-draft generates deterministic support draft', async () => {
  await withTempDir('pumuki-consumer-support-ticket-build-', (tempRoot) => {
    const outDir = join(tempRoot, '.audit-reports/consumer-triage');
    mkdirSync(outDir, { recursive: true });

    writeFileSync(
      join(outDir, 'consumer-startup-failure-support-bundle.md'),
      [
        '# Consumer CI Startup Failure Support Bundle',
        '',
        '- startup_failure_runs: 2',
        '- path: BuildFailed',
        '- jobs.total_count: 0',
        '- artifacts.total_count: 0',
        '- repo_visibility: `private`',
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
        '- detected_scopes: repo, workflow, user',
        '- missing_scopes: (none)',
      ].join('\n'),
      'utf8'
    );

    const stdout = runGenerator({
      cwd: tempRoot,
      repo: 'owner/repo',
      supportBundleFile:
        '.audit-reports/consumer-triage/consumer-startup-failure-support-bundle.md',
      authReportFile: '.audit-reports/consumer-triage/consumer-ci-auth-check.md',
      outFile: '.audit-reports/consumer-triage/consumer-support-ticket-draft.md',
    });

    assert.match(stdout, /consumer support ticket draft generated at/);

    const report = readFileSync(
      join(outDir, 'consumer-support-ticket-draft.md'),
      'utf8'
    );
    assert.match(report, /# Consumer CI Support Ticket Draft/);
    assert.match(report, /- startup_failure_runs observed: 2\./);
    assert.match(report, /- auth verdict: READY/);
    assert.match(report, /- https:\/\/github.com\/owner\/repo\/actions\/runs\/123/);
  });
});
