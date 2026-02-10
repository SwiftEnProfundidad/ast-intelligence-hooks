import type { ConsumerSupportBundleWorkflowRun } from './consumer-support-bundle-contract';

export type ConsumerSupportBundleMarkdownContext = {
  startupFailures: ReadonlyArray<ConsumerSupportBundleWorkflowRun>;
  startupStalledRuns: ReadonlyArray<ConsumerSupportBundleWorkflowRun>;
  oldestQueuedRunAgeMinutes?: number;
  sampleRuns: ReadonlyArray<ConsumerSupportBundleWorkflowRun>;
};

const resolveOldestQueuedRunAgeMinutes = (
  runs: ReadonlyArray<ConsumerSupportBundleWorkflowRun>
): number | undefined => {
  const nowEpochMs = Date.now();
  let oldestAgeMinutes: number | undefined;

  for (const run of runs) {
    const createdAtEpochMs = Date.parse(run.createdAt);
    if (!Number.isFinite(createdAtEpochMs)) {
      continue;
    }
    const ageMinutes = Math.max(0, Math.floor((nowEpochMs - createdAtEpochMs) / 60000));
    if (oldestAgeMinutes === undefined || ageMinutes > oldestAgeMinutes) {
      oldestAgeMinutes = ageMinutes;
    }
  }

  return oldestAgeMinutes;
};

export const createConsumerSupportBundleMarkdownContext = (params: {
  runs: ReadonlyArray<ConsumerSupportBundleWorkflowRun>;
}): ConsumerSupportBundleMarkdownContext => {
  const startupFailures = params.runs.filter(
    (run) => run.conclusion === 'startup_failure'
  );
  const startupStalledRuns = params.runs.filter(
    (run) => run.status === 'queued' && !run.conclusion
  );
  const oldestQueuedRunAgeMinutes = resolveOldestQueuedRunAgeMinutes(startupStalledRuns);
  const highlightedRuns =
    startupStalledRuns.length > 0 ? startupStalledRuns : startupFailures;

  return {
    startupFailures,
    startupStalledRuns,
    oldestQueuedRunAgeMinutes,
    sampleRuns: highlightedRuns.slice(0, 3),
  };
};
