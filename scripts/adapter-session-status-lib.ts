export type AdapterSessionVerdict = 'PASS' | 'NEEDS_REAL_SESSION' | 'BLOCKED';

const hasSessionPass = (output: string): boolean => {
  return /session-assessment=PASS/.test(output);
};

export const determineAdapterSessionVerdict = (params: {
  verifyExitCode: number;
  strictOutput: string;
  anyOutput: string;
}): AdapterSessionVerdict => {
  if (params.verifyExitCode !== 0) {
    return 'BLOCKED';
  }

  if (hasSessionPass(params.strictOutput)) {
    return 'PASS';
  }

  if (hasSessionPass(params.anyOutput)) {
    return 'NEEDS_REAL_SESSION';
  }

  return 'BLOCKED';
};
