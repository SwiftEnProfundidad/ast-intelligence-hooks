import {
  DEFAULT_CONSUMER_WORKFLOW_LINT_OUT_FILE,
  type ConsumerWorkflowLintCliOptions,
} from './consumer-workflow-lint-contract';

export const parseConsumerWorkflowLintArgs = (
  args: ReadonlyArray<string>
): ConsumerWorkflowLintCliOptions => {
  const options: ConsumerWorkflowLintCliOptions = {
    repoPath: '',
    outFile: DEFAULT_CONSUMER_WORKFLOW_LINT_OUT_FILE,
    actionlintBin: 'actionlint',
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--repo-path') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --repo-path');
      }
      options.repoPath = value;
      index += 1;
      continue;
    }

    if (arg === '--out') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --out');
      }
      options.outFile = value;
      index += 1;
      continue;
    }

    if (arg === '--actionlint-bin') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --actionlint-bin');
      }
      options.actionlintBin = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.repoPath) {
    throw new Error('Missing required argument --repo-path <path>');
  }

  return options;
};
