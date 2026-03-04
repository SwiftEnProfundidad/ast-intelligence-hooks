import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_ENTERPRISE_CONTRACT_REPORT_PATH,
  DEFAULT_ENTERPRISE_CONTRACT_SUMMARY_PATH,
  parseEnterpriseContractSuiteArgs,
} from '../enterprise-contract-suite-args-lib';

test('parseEnterpriseContractSuiteArgs uses defaults when no args are provided', () => {
  const options = parseEnterpriseContractSuiteArgs([], '/tmp/repo');
  assert.equal(options.repoRoot, '/tmp/repo');
  assert.equal(options.reportPath, DEFAULT_ENTERPRISE_CONTRACT_REPORT_PATH);
  assert.equal(options.summaryPath, DEFAULT_ENTERPRISE_CONTRACT_SUMMARY_PATH);
  assert.equal(options.printJson, false);
});

test('parseEnterpriseContractSuiteArgs accepts explicit flags', () => {
  const options = parseEnterpriseContractSuiteArgs(
    ['--repo=/tmp/custom', '--out=.audit-reports/custom/report.json', '--summary=.audit-reports/custom/summary.md', '--json'],
    '/tmp/repo'
  );

  assert.equal(options.repoRoot, '/tmp/custom');
  assert.equal(options.reportPath, '.audit-reports/custom/report.json');
  assert.equal(options.summaryPath, '.audit-reports/custom/summary.md');
  assert.equal(options.printJson, true);
});

test('parseEnterpriseContractSuiteArgs rejects unsupported flags', () => {
  assert.throws(
    () => parseEnterpriseContractSuiteArgs(['--unknown=true']),
    /Unsupported argument/
  );
});
