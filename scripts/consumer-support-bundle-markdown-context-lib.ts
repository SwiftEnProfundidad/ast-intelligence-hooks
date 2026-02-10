import type { ConsumerSupportBundleWorkflowRun } from './consumer-support-bundle-contract';

export type ConsumerSupportBundleMarkdownContext = {
  startupFailures: ReadonlyArray<ConsumerSupportBundleWorkflowRun>;
  sampleRuns: ReadonlyArray<ConsumerSupportBundleWorkflowRun>;
};

export const createConsumerSupportBundleMarkdownContext = (params: {
  runs: ReadonlyArray<ConsumerSupportBundleWorkflowRun>;
}): ConsumerSupportBundleMarkdownContext => {
  const startupFailures = params.runs.filter(
    (run) => run.conclusion === 'startup_failure'
  );

  return {
    startupFailures,
    sampleRuns: startupFailures.slice(0, 3),
  };
};
