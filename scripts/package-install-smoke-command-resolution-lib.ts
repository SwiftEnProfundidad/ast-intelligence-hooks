import { existsSync } from 'node:fs';
import { join } from 'node:path';

export type SmokeCommandResolution =
  | 'local-bin'
  | 'local-node-entry'
  | 'npx-package';

export type ResolvedSmokeCommand = {
  executable: string;
  args: string[];
  resolution: SmokeCommandResolution;
};

const resolveLocalBinPath = (consumerRepo: string, binary: string): string | null => {
  const candidates =
    process.platform === 'win32'
      ? [join(consumerRepo, 'node_modules', '.bin', `${binary}.cmd`), join(consumerRepo, 'node_modules', '.bin', binary)]
      : [join(consumerRepo, 'node_modules', '.bin', binary)];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
};

const resolveLocalNodeEntrypoint = (consumerRepo: string, binary: string): string | null => {
  const entrypoint = join(consumerRepo, 'node_modules', 'pumuki', 'bin', `${binary}.js`);
  return existsSync(entrypoint) ? entrypoint : null;
};

export const resolveConsumerPumukiCommand = (params: {
  consumerRepo: string;
  binary: string;
  args?: ReadonlyArray<string>;
}): ResolvedSmokeCommand => {
  const args = [...(params.args ?? [])];
  const localBinPath = resolveLocalBinPath(params.consumerRepo, params.binary);
  if (localBinPath) {
    return {
      executable: localBinPath,
      args,
      resolution: 'local-bin',
    };
  }

  const localEntrypoint = resolveLocalNodeEntrypoint(params.consumerRepo, params.binary);
  if (localEntrypoint) {
    return {
      executable: 'node',
      args: [localEntrypoint, ...args],
      resolution: 'local-node-entry',
    };
  }

  return {
    executable: 'npx',
    args: ['--yes', '--package', 'pumuki@latest', params.binary, ...args],
    resolution: 'npx-package',
  };
};
