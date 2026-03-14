export type EnterpriseContractProfileId =
  | 'minimal'
  | 'block'
  | 'minimal-repeat'
  | 'telemetry-rotation';

export type EnterpriseContractProfileSpec = {
  id: EnterpriseContractProfileId;
  mode: 'minimal' | 'block';
  expectedExitCode: number;
};

export type EnterpriseContractProfileResult = {
  id: EnterpriseContractProfileId;
  mode: 'minimal' | 'block';
  command: string;
  expectedExitCode: number;
  exitCode: number;
  status: 'PASS' | 'FAIL';
};

export type EnterpriseContractSuiteReport = {
  suiteVersion: '1';
  generatedAt: string;
  repoRoot: string;
  profiles: ReadonlyArray<EnterpriseContractProfileResult>;
  overall: 'PASS' | 'FAIL';
};

export type EnterpriseContractSuiteOptions = {
  repoRoot: string;
  reportPath: string;
  summaryPath: string;
  printJson: boolean;
};

export const resolveEnterpriseContractProfiles = (): ReadonlyArray<EnterpriseContractProfileSpec> => [
  {
    id: 'minimal',
    mode: 'minimal',
    expectedExitCode: 0,
  },
  {
    id: 'block',
    mode: 'block',
    expectedExitCode: 0,
  },
  {
    id: 'minimal-repeat',
    mode: 'minimal',
    expectedExitCode: 0,
  },
  {
    id: 'telemetry-rotation',
    mode: 'minimal',
    expectedExitCode: 0,
  },
];
