import type { AdapterRealSessionReportParams } from './adapter-real-session-contract';
import type { AdapterRealSessionSignals } from './adapter-real-session-analysis-signals-lib';
import {
  type PassFailUnknown,
  deriveAdapterRealSessionInstallStatus,
  deriveAdapterRealSessionValidationPass,
  deriveAdapterRealSessionVerifyStatus,
} from './adapter-real-session-analysis-status-lib';
import { buildAdapterRealSessionEvaluationMessages } from './adapter-real-session-analysis-messages-lib';

export type AdapterRealSessionEvaluation = {
  verifyStatus: PassFailUnknown;
  installStatus: 'PASS' | 'FAIL';
  validationPass: boolean;
  summary: string;
  rootCause: string;
  correctiveAction: string;
};

export const evaluateAdapterRealSessionSignals = (params: {
  report: AdapterRealSessionReportParams;
  signals: AdapterRealSessionSignals;
}): AdapterRealSessionEvaluation => {
  const verifyStatus = deriveAdapterRealSessionVerifyStatus(
    params.report.parsedStatus.verifyExitCode
  );
  const installStatus = deriveAdapterRealSessionInstallStatus({
    report: params.report,
  });
  const validationPass = deriveAdapterRealSessionValidationPass({
    verifyStatus,
    report: params.report,
    signals: params.signals,
  });
  const messages = buildAdapterRealSessionEvaluationMessages({
    validationPass,
    signals: params.signals,
    report: params.report,
  });

  return {
    verifyStatus,
    installStatus,
    validationPass,
    summary: messages.summary,
    rootCause: messages.rootCause,
    correctiveAction: messages.correctiveAction,
  };
};
