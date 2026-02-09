import { execFileSync } from 'node:child_process';

export const runGh = (args: ReadonlyArray<string>): string => {
  return execFileSync('gh', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
};

export const runGhJson = <T>(args: ReadonlyArray<string>): T => {
  const output = runGh(args);
  return JSON.parse(output) as T;
};

export const assertConsumerCiArtifactsAuth = (): void => {
  runGh(['auth', 'status']);
};
