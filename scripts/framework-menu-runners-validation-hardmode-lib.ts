import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export type HardModeProfile = 'critical-high' | 'all-severities';

const HARD_MODE_CONFIG_PATH = '.pumuki/hard-mode.json';

export const buildHardModeConfigFromSelection = (
  profile: HardModeProfile
): { enabled: true; profile: HardModeProfile } => {
  return {
    enabled: true,
    profile,
  };
};

export const persistHardModeConfig = (
  repoRoot: string,
  profile: HardModeProfile
): string => {
  const configPath = join(repoRoot, HARD_MODE_CONFIG_PATH);
  mkdirSync(join(repoRoot, '.pumuki'), { recursive: true });
  writeFileSync(
    configPath,
    `${JSON.stringify(buildHardModeConfigFromSelection(profile), null, 2)}\n`,
    'utf8'
  );
  return configPath;
};

export const runHardModeEnforcementConfig = async (params: {
  profile: HardModeProfile;
  repoRoot?: string;
}): Promise<number> => {
  const repoRoot = params.repoRoot ?? process.cwd();
  const configPath = persistHardModeConfig(repoRoot, params.profile);
  process.stdout.write(
    [
      '',
      '[pumuki] Hard Mode Enforcement Config',
      `- Mode selected: ${params.profile}`,
      `- Persisted config: ${configPath}`,
      '',
    ].join('\n')
  );

  return 0;
};
