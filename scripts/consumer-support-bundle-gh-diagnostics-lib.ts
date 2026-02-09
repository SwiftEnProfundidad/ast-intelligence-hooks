import type {
  ConsumerSupportBundleArtifactResponse,
  ConsumerSupportBundleJobsResponse,
  ConsumerSupportBundleRunDiagnostic,
  ConsumerSupportBundleRunMetadata,
  ConsumerSupportBundleWorkflowRun,
} from './consumer-support-bundle-contract';
import { tryRunGhJson } from './consumer-support-bundle-gh-command-lib';

const loadConsumerSupportBundleRunMetadata = (params: {
  repo: string;
  runId: number;
}) => {
  return tryRunGhJson<ConsumerSupportBundleRunMetadata>([
    'api',
    `repos/${params.repo}/actions/runs/${params.runId}`,
  ]);
};

const loadConsumerSupportBundleRunJobs = (params: { repo: string; runId: number }) => {
  return tryRunGhJson<ConsumerSupportBundleJobsResponse>([
    'api',
    `repos/${params.repo}/actions/runs/${params.runId}/jobs`,
  ]);
};

const loadConsumerSupportBundleRunArtifacts = (params: {
  repo: string;
  runId: number;
}) => {
  return tryRunGhJson<ConsumerSupportBundleArtifactResponse>([
    'api',
    `repos/${params.repo}/actions/runs/${params.runId}/artifacts`,
  ]);
};

const collectConsumerSupportBundleRunErrors = (params: {
  metadataResult: { ok: boolean; error?: string };
  jobsResult: { ok: boolean; error?: string };
  artifactsResult: { ok: boolean; error?: string };
}): string | undefined => {
  const errors = [params.metadataResult, params.jobsResult, params.artifactsResult]
    .filter((result) => !result.ok)
    .map((result) => result.error)
    .filter((value): value is string => Boolean(value));

  return errors.length > 0 ? errors.join(' | ') : undefined;
};

const collectConsumerSupportBundleRunDiagnostic = (params: {
  repo: string;
  run: ConsumerSupportBundleWorkflowRun;
}): ConsumerSupportBundleRunDiagnostic => {
  const metadataResult = loadConsumerSupportBundleRunMetadata({
    repo: params.repo,
    runId: params.run.databaseId,
  });
  const jobsResult = loadConsumerSupportBundleRunJobs({
    repo: params.repo,
    runId: params.run.databaseId,
  });
  const artifactsResult = loadConsumerSupportBundleRunArtifacts({
    repo: params.repo,
    runId: params.run.databaseId,
  });

  return {
    run: params.run,
    metadata: metadataResult.data,
    jobsCount: jobsResult.data?.total_count,
    artifactsCount: artifactsResult.data?.total_count,
    error: collectConsumerSupportBundleRunErrors({
      metadataResult,
      jobsResult,
      artifactsResult,
    }),
  };
};

export const collectConsumerSupportBundleRunDiagnostics = (params: {
  repo: string;
  runs: ReadonlyArray<ConsumerSupportBundleWorkflowRun>;
}): ReadonlyArray<ConsumerSupportBundleRunDiagnostic> => {
  return params.runs
    .slice(0, 5)
    .map((run) =>
      collectConsumerSupportBundleRunDiagnostic({
        repo: params.repo,
        run,
      })
    );
};
