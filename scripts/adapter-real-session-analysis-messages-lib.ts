import type { AdapterRealSessionSignals } from './adapter-real-session-analysis-signals-lib';
import type { AdapterRealSessionReportParams } from './adapter-real-session-contract';

type EvaluationMessageSet = {
  summary: string;
  rootCause: string;
  correctiveAction: string;
};

export const buildAdapterRealSessionEvaluationMessages = (params: {
  validationPass: boolean;
  signals: AdapterRealSessionSignals;
  report: AdapterRealSessionReportParams;
}): EvaluationMessageSet => {
  const missingWriteEvents = !params.signals.preWriteObserved || !params.signals.postWriteObserved;
  const strictAssessmentPass = params.report.parsedStatus.strictAssessmentPass;

  if (params.validationPass) {
    return {
      summary:
        'Real Adapter session signals look healthy, with strict session assessment passing.',
      rootCause: 'none',
      correctiveAction: 'No corrective action required. Keep monitoring in regular validation runs.',
    };
  }

  if (params.signals.nodeCommandMissing) {
    return {
      summary: 'Runtime still reports missing Node in hook shell environment.',
      rootCause: 'Hook runtime shell cannot resolve Node binary (`node: command not found`).',
      correctiveAction:
        'Fix shell PATH/runtime setup for Adapter hooks and rerun the validation playbook.',
    };
  }

  if (missingWriteEvents) {
    return {
      summary: 'Real pre/post write events were not fully observed in available logs.',
      rootCause: 'Incomplete real IDE event coverage in the captured diagnostics.',
      correctiveAction:
        'Execute full real-session validation steps and capture fresh `.audit_tmp` logs.',
    };
  }

  if (strictAssessmentPass) {
    return {
      summary: 'Strict assessment passed but other required runtime signals are incomplete.',
      rootCause: 'Session-level strict assessment not satisfied with current evidence.',
      correctiveAction: 'Repeat strict real-session run and verify both pre/post events are captured.',
    };
  }

  return {
    summary: 'Strict real-session assessment is not yet passing.',
    rootCause: 'Session-level strict assessment not satisfied with current evidence.',
    correctiveAction: 'Repeat strict real-session run and verify both pre/post events are captured.',
  };
};
