export type EnterpriseContractProfileId = 'minimal' | 'block';

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
