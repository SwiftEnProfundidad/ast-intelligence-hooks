import type {
  EnterpriseContractProfileResult,
  EnterpriseContractSuiteReport,
} from './enterprise-contract-suite-contract';

export const resolveEnterpriseContractOverall = (
  profiles: ReadonlyArray<EnterpriseContractProfileResult>
): 'PASS' | 'FAIL' =>
  profiles.every((profile) => profile.status === 'PASS') ? 'PASS' : 'FAIL';

export const buildEnterpriseContractReport = (params: {
  repoRoot: string;
  generatedAt?: string;
  profiles: ReadonlyArray<EnterpriseContractProfileResult>;
}): EnterpriseContractSuiteReport => ({
  suiteVersion: '1',
  generatedAt: params.generatedAt ?? new Date().toISOString(),
  repoRoot: params.repoRoot,
  profiles: params.profiles,
  overall: resolveEnterpriseContractOverall(params.profiles),
});

export const renderEnterpriseContractSummary = (
  report: EnterpriseContractSuiteReport
): string => {
  const lines: string[] = [
    '# Enterprise Contract Suite Summary',
    '',
    `- Overall: ${report.overall}`,
    `- Generated At: ${report.generatedAt}`,
    `- Repo Root: ${report.repoRoot}`,
    '',
    '## Profiles',
    '',
  ];

  for (const profile of report.profiles) {
    lines.push(
      `- ${profile.id}: status=${profile.status} expected_exit=${profile.expectedExitCode} actual_exit=${profile.exitCode}`
    );
  }

  lines.push('');
  return lines.join('\n');
};
