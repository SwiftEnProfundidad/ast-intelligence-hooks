import {
  determineAdapterSessionVerdict,
  type AdapterSessionVerdict,
} from './adapter-session-status-lib';
import type { AdapterSessionStatusCommandExecution } from './adapter-session-status-contract';

export const deriveAdapterSessionVerdictFromCommands = (
  commands: ReadonlyArray<AdapterSessionStatusCommandExecution>
): AdapterSessionVerdict => {
  const verifyResult = commands.find(
    (item) => item.label === 'verify-adapter-hooks-runtime'
  );
  const strictResult = commands.find(
    (item) => item.label === 'assess-adapter-hooks-session'
  );
  const anyResult = commands.find(
    (item) => item.label === 'assess-adapter-hooks-session:any'
  );

  if (
    !verifyResult ||
    verifyResult.availability === 'unavailable' ||
    verifyResult.exitCode === undefined
  ) {
    return 'BLOCKED';
  }

  const hasStrictProbe = strictResult?.availability === 'available';
  const hasAnyProbe = anyResult?.availability === 'available';

  if (!hasStrictProbe && !hasAnyProbe) {
    return verifyResult.exitCode === 0 ? 'NEEDS_REAL_SESSION' : 'BLOCKED';
  }

  return determineAdapterSessionVerdict({
    verifyExitCode: verifyResult.exitCode,
    strictOutput: strictResult?.output ?? '',
    anyOutput: anyResult?.output ?? '',
  });
};

export const exitCodeForAdapterSessionVerdict = (
  verdict: AdapterSessionVerdict
): number => {
  if (verdict === 'PASS') {
    return 0;
  }

  if (verdict === 'NEEDS_REAL_SESSION') {
    return 2;
  }

  return 1;
};
