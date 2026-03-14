import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ADAPTER_SESSION_STATUS_COMMAND_SPECS,
  type AdapterSessionStatusCommand,
  type AdapterSessionStatusCommandSpec,
} from './adapter-session-status-contract';

type ConsumerPackageJson = {
  scripts?: Record<string, string>;
};

const readConsumerPackageJson = (repoRoot: string): ConsumerPackageJson | null => {
  const packageJsonPath = join(repoRoot, 'package.json');
  if (!existsSync(packageJsonPath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(packageJsonPath, 'utf8')) as ConsumerPackageJson;
  } catch {
    return null;
  }
};

const isDeprecatedVerifyAlias = (scriptBody: string): boolean =>
  scriptBody.includes('Migrated to');

const resolveCommandFromSpec = (
  spec: AdapterSessionStatusCommandSpec,
  scripts: Record<string, string> | undefined
): AdapterSessionStatusCommand => {
  if (spec.scriptName === null) {
    return {
      label: spec.label,
      command: spec.command,
      availability: 'unavailable',
      unavailableReason: spec.unavailableReason,
    };
  }

  const scriptBody = scripts?.[spec.scriptName];
  if (typeof scriptBody !== 'string') {
    return {
      label: spec.label,
      command: spec.command,
      availability: 'unavailable',
      unavailableReason: `Consumer package.json does not expose \`${spec.scriptName}\`.`,
    };
  }

  if (spec.scriptName === 'verify:adapter-hooks-runtime' && isDeprecatedVerifyAlias(scriptBody)) {
    return {
      label: spec.label,
      command: spec.command,
      availability: 'unavailable',
      unavailableReason:
        'Consumer only exposes a deprecated verification alias and no direct adapter runtime probe.',
    };
  }

  return {
    label: spec.label,
    command: spec.command,
    availability: 'available',
  };
};

export const resolveAdapterSessionStatusCommands = (
  repoRoot: string
): ReadonlyArray<AdapterSessionStatusCommand> => {
  const pkg = readConsumerPackageJson(repoRoot);
  const scripts = pkg?.scripts;
  return ADAPTER_SESSION_STATUS_COMMAND_SPECS.map((spec) =>
    resolveCommandFromSpec(spec, scripts)
  );
};
