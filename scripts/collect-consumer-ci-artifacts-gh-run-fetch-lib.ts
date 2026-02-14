import type {
  ConsumerCiArtifactResponse,
  ConsumerCiArtifactsCliOptions,
  ConsumerCiRunArtifactsResult,
  ConsumerCiRunMetadata,
  ConsumerCiWorkflowRun,
} from './collect-consumer-ci-artifacts-contract';
import { runGhJson } from './collect-consumer-ci-artifacts-gh-command-lib';

const loadRunMetadata = (
  options: ConsumerCiArtifactsCliOptions,
  runId: number
): ConsumerCiRunMetadata => {
  return runGhJson<ConsumerCiRunMetadata>([
    'api',
    `repos/${options.repo}/actions/runs/${runId}`,
  ]);
};

const loadRunArtifacts = (
  options: ConsumerCiArtifactsCliOptions,
  runId: number
): ConsumerCiArtifactResponse => {
  return runGhJson<ConsumerCiArtifactResponse>([
    'api',
    `repos/${options.repo}/actions/runs/${runId}/artifacts`,
  ]);
};

const normalizeConsumerCiErrorLabel = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message.replace(/\s+/g, ' ').trim();
  }
  return 'failed to fetch run metadata';
};

export const loadConsumerCiRunArtifactsResult = (params: {
  options: ConsumerCiArtifactsCliOptions;
  run: ConsumerCiWorkflowRun;
}): ConsumerCiRunArtifactsResult => {
  try {
    const metadata = loadRunMetadata(params.options, params.run.databaseId);
    const artifacts = loadRunArtifacts(params.options, params.run.databaseId);
    return {
      run: params.run,
      metadata,
      artifacts,
      errorLabel: '',
    };
  } catch (error) {
    return {
      run: params.run,
      errorLabel: normalizeConsumerCiErrorLabel(error),
    };
  }
};
