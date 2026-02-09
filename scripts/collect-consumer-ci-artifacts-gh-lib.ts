import { execFileSync } from 'node:child_process';
import type {
  ConsumerCiArtifactResponse,
  ConsumerCiArtifactsCliOptions,
  ConsumerCiRunArtifactsResult,
  ConsumerCiRunMetadata,
  ConsumerCiWorkflowRun,
} from './collect-consumer-ci-artifacts-contract';

const runGh = (args: ReadonlyArray<string>): string => {
  return execFileSync('gh', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
};

const runGhJson = <T>(args: ReadonlyArray<string>): T => {
  const output = runGh(args);
  return JSON.parse(output) as T;
};

export const assertConsumerCiArtifactsAuth = (): void => {
  runGh(['auth', 'status']);
};

export const loadConsumerCiWorkflowRuns = (
  options: ConsumerCiArtifactsCliOptions
): ConsumerCiWorkflowRun[] => {
  return runGhJson<ConsumerCiWorkflowRun[]>([
    'run',
    'list',
    '--repo',
    options.repo,
    '--limit',
    String(options.limit),
    '--json',
    [
      'databaseId',
      'displayTitle',
      'workflowName',
      'status',
      'conclusion',
      'url',
      'createdAt',
      'event',
      'headBranch',
      'headSha',
    ].join(','),
  ]);
};

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

export const loadConsumerCiRunArtifactsResults = (
  options: ConsumerCiArtifactsCliOptions,
  runs: ReadonlyArray<ConsumerCiWorkflowRun>
): ConsumerCiRunArtifactsResult[] => {
  return runs.map((run) => {
    try {
      const metadata = loadRunMetadata(options, run.databaseId);
      const artifacts = loadRunArtifacts(options, run.databaseId);
      return {
        run,
        metadata,
        artifacts,
        errorLabel: '',
      };
    } catch (error) {
      return {
        run,
        errorLabel: normalizeConsumerCiErrorLabel(error),
      };
    }
  });
};
