import { execFileSync } from 'node:child_process';
import { checkValidationDocsHygiene } from './validation-docs-hygiene-lib';

const loadTrackedValidationDocs = (): ReadonlyArray<string> => {
  const output = execFileSync('git', ['ls-files', 'docs/validation'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

const main = (): number => {
  const trackedPaths = loadTrackedValidationDocs();
  const result = checkValidationDocsHygiene(trackedPaths);

  if (result.violations.length === 0) {
    process.stdout.write('validation docs hygiene check passed\n');
    return 0;
  }

  process.stderr.write('validation docs hygiene check failed\n');
  process.stderr.write(
    [
      'Unexpected tracked files under docs/validation (generated outputs should not be committed):',
      ...result.violations.map((violation) => `- ${violation}`),
    ].join('\n')
  );
  process.stderr.write('\n');
  return 1;
};

try {
  process.exit(main());
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`validation docs hygiene check failed: ${message}\n`);
  process.exit(1);
}
