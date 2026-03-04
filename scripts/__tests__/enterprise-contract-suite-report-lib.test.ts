import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildEnterpriseContractReport,
  renderEnterpriseContractSummary,
  resolveEnterpriseContractOverall,
} from '../enterprise-contract-suite-report-lib';

test('resolveEnterpriseContractOverall returns PASS when all profiles pass', () => {
  const overall = resolveEnterpriseContractOverall([
    {
      id: 'minimal',
      mode: 'minimal',
      command: 'node --import tsx scripts/package-install-smoke.ts --mode=minimal',
      expectedExitCode: 0,
      exitCode: 0,
      status: 'PASS',
    },
    {
      id: 'block',
      mode: 'block',
      command: 'node --import tsx scripts/package-install-smoke.ts --mode=block',
      expectedExitCode: 1,
      exitCode: 1,
      status: 'PASS',
    },
  ]);

  assert.equal(overall, 'PASS');
});

test('buildEnterpriseContractReport marks FAIL when one profile fails', () => {
  const report = buildEnterpriseContractReport({
    repoRoot: '/tmp/repo',
    generatedAt: '2026-03-04T00:00:00.000Z',
    profiles: [
      {
        id: 'minimal',
        mode: 'minimal',
        command: 'node --import tsx scripts/package-install-smoke.ts --mode=minimal',
        expectedExitCode: 0,
        exitCode: 0,
        status: 'PASS',
      },
      {
        id: 'block',
        mode: 'block',
        command: 'node --import tsx scripts/package-install-smoke.ts --mode=block',
        expectedExitCode: 1,
        exitCode: 0,
        status: 'FAIL',
      },
    ],
  });

  assert.equal(report.suiteVersion, '1');
  assert.equal(report.overall, 'FAIL');
  assert.equal(report.repoRoot, '/tmp/repo');
});

test('renderEnterpriseContractSummary includes profile statuses', () => {
  const report = buildEnterpriseContractReport({
    repoRoot: '/tmp/repo',
    generatedAt: '2026-03-04T00:00:00.000Z',
    profiles: [
      {
        id: 'minimal',
        mode: 'minimal',
        command: 'cmd',
        expectedExitCode: 0,
        exitCode: 0,
        status: 'PASS',
      },
    ],
  });

  const summary = renderEnterpriseContractSummary(report);
  assert.match(summary, /Overall: PASS/);
  assert.match(summary, /minimal: status=PASS expected_exit=0 actual_exit=0/);
});
