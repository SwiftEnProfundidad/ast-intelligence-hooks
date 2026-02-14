import {
  DEFAULT_CONSUMER_CI_AUTH_OUT_FILE,
  type CliOptions,
} from './consumer-ci-auth-check-contract';

export const parseConsumerCiAuthArgs = (
  args: ReadonlyArray<string>
): CliOptions => {
  const options: CliOptions = {
    repo: '',
    outFile: DEFAULT_CONSUMER_CI_AUTH_OUT_FILE,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--repo') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Missing value for --repo');
      }
      options.repo = value;
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

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (!options.repo) {
    throw new Error('Missing required argument --repo <owner/repo>');
  }

  return options;
};

export const parseAuthScopes = (
  authStatusOutput: string
): ReadonlyArray<string> => {
  const scopesLine = authStatusOutput
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('- Token scopes:'));

  if (!scopesLine) {
    return [];
  }

  const raw = scopesLine.replace('- Token scopes:', '').trim();
  const normalized = raw.replace(/'/g, '');
  return normalized
    .split(',')
    .map((scope) => scope.trim())
    .filter((scope) => scope.length > 0);
};
