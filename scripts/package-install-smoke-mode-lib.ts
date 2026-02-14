import type { SmokeExpectation, SmokeMode } from './package-install-smoke-contract';

export const parsePackageInstallSmokeMode = (
  args: ReadonlyArray<string>
): SmokeMode => {
  const modeArg = args.find((argument) => argument.startsWith('--mode='));
  if (!modeArg) {
    return 'block';
  }

  const value = modeArg.slice('--mode='.length).trim();
  if (value === 'block' || value === 'minimal') {
    return value;
  }

  throw new Error(`Unsupported --mode value "${value}". Allowed values: block, minimal`);
};

export const resolveSmokeExpectation = (mode: SmokeMode): SmokeExpectation => {
  if (mode === 'block') {
    return {
      expectedExitCode: 1,
      expectedOutcome: 'BLOCK',
    };
  }

  return {
    expectedExitCode: 0,
    expectedOutcome: 'PASS',
  };
};
