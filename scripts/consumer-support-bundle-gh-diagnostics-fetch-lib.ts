import type {
  ConsumerSupportBundleArtifactResponse,
  ConsumerSupportBundleJobsResponse,
  ConsumerSupportBundleRunMetadata,
} from './consumer-support-bundle-contract';
import { tryRunGhJson } from './consumer-support-bundle-gh-command-lib';

export const loadConsumerSupportBundleRunMetadata = (params: {
  repo: string;
  runId: number;
}) => {
  return tryRunGhJson<ConsumerSupportBundleRunMetadata>([
    'api',
    `repos/${params.repo}/actions/runs/${params.runId}`,
  ]);
};

export const loadConsumerSupportBundleRunJobs = (params: {
  repo: string;
  runId: number;
}) => {
  return tryRunGhJson<ConsumerSupportBundleJobsResponse>([
    'api',
    `repos/${params.repo}/actions/runs/${params.runId}/jobs`,
  ]);
};

export const loadConsumerSupportBundleRunArtifacts = (params: {
  repo: string;
  runId: number;
}) => {
  return tryRunGhJson<ConsumerSupportBundleArtifactResponse>([
    'api',
    `repos/${params.repo}/actions/runs/${params.runId}/artifacts`,
  ]);
};
