import { execFileSync } from 'node:child_process';
import type {
  ConsumerWorkflowLintCliOptions,
  ConsumerWorkflowLintResult,
} from './consumer-workflow-lint-contract';

const normalizeWorkflowLintFailure = (params: {
  error: unknown;
  workflowPath: string;
}): ConsumerWorkflowLintResult | undefined => {
  if (
    params.error &&
    typeof params.error === 'object' &&
    'status' in params.error &&
    'stdout' in params.error &&
    'stderr' in params.error
  ) {
    const status = Number((params.error as { status?: number }).status ?? 1);
    const stdout = String((params.error as { stdout?: string | Buffer }).stdout ?? '');
    const stderr = String((params.error as { stderr?: string | Buffer }).stderr ?? '');
    return {
      exitCode: Number.isFinite(status) ? status : 1,
      output: `${stdout}${stderr}`.trim(),
      workflowPath: params.workflowPath,
    };
  }

  return undefined;
};

export const executeConsumerWorkflowLintCommand = (params: {
  options: ConsumerWorkflowLintCliOptions;
  workflowFiles: ReadonlyArray<string>;
  workflowPath: string;
}): ConsumerWorkflowLintResult => {
  try {
    const output = execFileSync(
      params.options.actionlintBin,
      ['-color', '-shellcheck=', '-pyflakes=', ...params.workflowFiles],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    return {
      exitCode: 0,
      output,
      workflowPath: params.workflowPath,
    };
  } catch (error) {
    const normalizedFailure = normalizeWorkflowLintFailure({
      error,
      workflowPath: params.workflowPath,
    });
    if (normalizedFailure) {
      return normalizedFailure;
    }
    throw error;
  }
};
