import type { AdapterRealSessionReportParams } from './adapter-real-session-contract';
import type { AdapterRealSessionSignals } from './adapter-real-session-analysis-signals-lib';

export type PassFailUnknown = 'PASS' | 'FAIL' | 'UNKNOWN';

export const deriveAdapterRealSessionVerifyStatus = (
  verifyExitCode?: number
): PassFailUnknown => {
  if (verifyExitCode === undefined) {
    return 'UNKNOWN';
  }

  return verifyExitCode === 0 ? 'PASS' : 'FAIL';
};

export const deriveAdapterRealSessionInstallStatus = (params: {
  report: AdapterRealSessionReportParams;
}): 'PASS' | 'FAIL' => (params.report.hookConfigExists ? 'PASS' : 'FAIL');

export const deriveAdapterRealSessionValidationPass = (params: {
  verifyStatus: PassFailUnknown;
  report: AdapterRealSessionReportParams;
  signals: AdapterRealSessionSignals;
}): boolean =>
  params.verifyStatus === 'PASS' &&
  params.signals.preWriteObserved &&
  params.signals.postWriteObserved &&
  !params.signals.nodeCommandMissing &&
  params.report.parsedStatus.strictAssessmentPass;
