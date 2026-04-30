import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export type SmokeBinStrategy = 'source' | 'installed';

export const resolveBinStrategy = (raw: string | undefined): SmokeBinStrategy => {
  const normalized = (raw ?? 'source').trim().toLowerCase();
  if (normalized === 'installed' || normalized === 'consumer') {
    return 'installed';
  }
  return 'source';
};

export type SmokeLayout = {
  pumukiPackageRoot: string;
  smokeCwd: string;
  binStrategy: SmokeBinStrategy;
  binRoot: string;
};

export const resolveSmokeLayout = (params: {
  scriptFileUrl: string;
  env: NodeJS.ProcessEnv;
}): SmokeLayout => {
  const pumukiPackageRoot = join(dirname(fileURLToPath(params.scriptFileUrl)), '..');
  const smokeCwd =
    (params.env.PUMUKI_SMOKE_REPO_ROOT ?? pumukiPackageRoot).trim() || pumukiPackageRoot;
  const binStrategy = resolveBinStrategy(params.env.PUMUKI_SMOKE_BIN_STRATEGY);
  const binRoot =
    binStrategy === 'installed'
      ? join(smokeCwd, 'node_modules', 'pumuki')
      : pumukiPackageRoot;
  return { pumukiPackageRoot, smokeCwd, binStrategy, binRoot };
};

export const installedBinMarkerPath = (layout: SmokeLayout): string =>
  join(layout.binRoot, 'bin', 'pumuki.js');
