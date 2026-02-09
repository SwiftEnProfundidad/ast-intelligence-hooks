import type { AdapterRealSessionReportParams } from './adapter-real-session-contract';
import type { AdapterRealSessionSignals } from './adapter-real-session-analysis-signals-lib';

type PassFailUnknown = 'PASS' | 'FAIL' | 'UNKNOWN';

export type AdapterRealSessionEvaluation = {
  verifyStatus: PassFailUnknown;
  installStatus: 'PASS' | 'FAIL';
  validationPass: boolean;
  summary: string;
  rootCause: string;
  correctiveAction: string;
};

const deriveVerifyStatus = (verifyExitCode?: number): PassFailUnknown => {
  if (verifyExitCode === undefined) {
    return 'UNKNOWN';
  }

  return verifyExitCode === 0 ? 'PASS' : 'FAIL';
};

export const evaluateAdapterRealSessionSignals = (params: {
  report: AdapterRealSessionReportParams;
  signals: AdapterRealSessionSignals;
}): AdapterRealSessionEvaluation => {
  const verifyStatus = deriveVerifyStatus(params.report.parsedStatus.verifyExitCode);
  const installStatus = params.report.hookConfigExists ? 'PASS' : 'FAIL';
  const { signals } = params;

  const validationPass =
    verifyStatus === 'PASS' &&
    signals.preWriteObserved &&
    signals.postWriteObserved &&
    !signals.nodeCommandMissing &&
    params.report.parsedStatus.strictAssessmentPass;

  const summary = validationPass
    ? 'Real Adapter session signals look healthy, with strict session assessment passing.'
    : signals.nodeCommandMissing
      ? 'Runtime still reports missing Node in hook shell environment.'
      : !signals.preWriteObserved || !signals.postWriteObserved
        ? 'Real pre/post write events were not fully observed in available logs.'
        : params.report.parsedStatus.strictAssessmentPass
          ? 'Strict assessment passed but other required runtime signals are incomplete.'
          : 'Strict real-session assessment is not yet passing.';

  const rootCause = validationPass
    ? 'none'
    : signals.nodeCommandMissing
      ? 'Hook runtime shell cannot resolve Node binary (`node: command not found`).'
      : !signals.preWriteObserved || !signals.postWriteObserved
        ? 'Incomplete real IDE event coverage in the captured diagnostics.'
        : 'Session-level strict assessment not satisfied with current evidence.';

  const correctiveAction = validationPass
    ? 'No corrective action required. Keep monitoring in regular validation runs.'
    : signals.nodeCommandMissing
      ? 'Fix shell PATH/runtime setup for Adapter hooks and rerun the validation playbook.'
      : !signals.preWriteObserved || !signals.postWriteObserved
        ? 'Execute full real-session validation steps and capture fresh `.audit_tmp` logs.'
        : 'Repeat strict real-session run and verify both pre/post events are captured.';

  return {
    verifyStatus,
    installStatus,
    validationPass,
    summary,
    rootCause,
    correctiveAction,
  };
};
