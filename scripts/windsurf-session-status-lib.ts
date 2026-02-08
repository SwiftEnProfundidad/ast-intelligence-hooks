export type WindsurfSessionVerdict = 'PASS' | 'NEEDS_REAL_SESSION' | 'BLOCKED';

const hasSessionPass = (output: string): boolean => {
  return /session-assessment=PASS/.test(output);
};

export const determineWindsurfSessionVerdict = (params: {
  verifyExitCode: number;
  strictOutput: string;
  anyOutput: string;
}): WindsurfSessionVerdict => {
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
