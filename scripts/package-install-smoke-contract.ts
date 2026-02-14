export type SmokeMode = 'block' | 'minimal';

export type SmokeExpectation = {
  expectedExitCode: number;
  expectedOutcome: 'BLOCK' | 'PASS';
};
