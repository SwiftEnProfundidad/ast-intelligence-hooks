import { existsSync, readFileSync } from 'node:fs';
import { delimiter, join } from 'node:path';
import packageJson from '../../package.json';

const readConsumerInstalledVersion = (repoRoot: string): string | null => {
  const packagePath = join(repoRoot, 'node_modules', packageJson.name, 'package.json');
  if (!existsSync(packagePath)) {
    return null;
  }
  try {
    const parsed = JSON.parse(readFileSync(packagePath, 'utf8')) as { version?: unknown };
    return typeof parsed.version === 'string' && parsed.version.trim().length > 0
      ? parsed.version.trim()
      : null;
  } catch {
    return null;
  }
};

export type PumukiVersionMetadata = {
  resolvedVersion: string;
  runtimeVersion: string;
  consumerInstalledVersion: string | null;
  source: 'consumer-node-modules' | 'runtime-package' | 'source-bin';
};

export type LifecycleVersionReport = {
  effective: string;
  runtime: string;
  consumerInstalled: string | null;
  lifecycleInstalled: string | null;
  source: PumukiVersionMetadata['source'];
  driftFromRuntime: boolean;
  driftFromLifecycleInstalled: boolean;
  driftWarning: string | null;
  alignmentCommand: string | null;
  pathExecutionHazard: boolean;
  pathExecutionWarning: string | null;
  pathExecutionWorkaroundCommand: string | null;
};

const buildLocalPumukiCommand = (): string =>
  process.platform === 'win32'
    ? 'node .\\node_modules\\pumuki\\bin\\pumuki.js'
    : 'node ./node_modules/pumuki/bin/pumuki.js';

const hasPathExecutionHazard = (repoRoot?: string): boolean =>
  typeof repoRoot === 'string' &&
  repoRoot.trim().length > 0 &&
  repoRoot.includes(delimiter);

export const buildLifecycleAlignmentCommand = (
  runtimeVersion: string,
  repoRoot?: string
): string => {
  const installStep = `npm install --save-exact pumuki@${runtimeVersion}`;
  const runStep = hasPathExecutionHazard(repoRoot)
    ? `${buildLocalPumukiCommand()} install`
    : `npx --yes --package pumuki@${runtimeVersion} pumuki install`;
  return `${installStep} && ${runStep}`;
};

export const resolvePumukiVersionMetadata = (params?: { repoRoot?: string }): PumukiVersionMetadata => {
  const runtimeVersion = packageJson.version;
  const repoRoot = params?.repoRoot;
  const consumerInstalledVersion =
    typeof repoRoot === 'string' && repoRoot.trim().length > 0
      ? readConsumerInstalledVersion(repoRoot.trim())
      : null;

  if (process.env.PUMUKI_RUNTIME_EXECUTION_SOURCE === 'source-bin') {
    return {
      resolvedVersion: runtimeVersion,
      runtimeVersion,
      consumerInstalledVersion,
      source: 'source-bin',
    };
  }

  if (typeof repoRoot === 'string' && repoRoot.trim().length > 0) {
    if (consumerInstalledVersion) {
      return {
        resolvedVersion: consumerInstalledVersion,
        runtimeVersion,
        consumerInstalledVersion,
        source: 'consumer-node-modules',
      };
    }
  }
  return {
    resolvedVersion: runtimeVersion,
    runtimeVersion,
    consumerInstalledVersion: null,
    source: 'runtime-package',
  };
};

export const getCurrentPumukiVersion = (params?: { repoRoot?: string }): string => {
  return resolvePumukiVersionMetadata(params).resolvedVersion;
};

export const getCurrentPumukiPackageName = (): string => packageJson.name;

export const buildLifecycleVersionReport = (params?: {
  repoRoot?: string;
  lifecycleVersion?: string | null | undefined;
}): LifecycleVersionReport => {
  const metadata = resolvePumukiVersionMetadata({ repoRoot: params?.repoRoot });
  const lifecycleInstalled =
    typeof params?.lifecycleVersion === 'string' && params.lifecycleVersion.trim().length > 0
      ? params.lifecycleVersion.trim()
      : null;
  const driftFromRuntime = metadata.resolvedVersion !== metadata.runtimeVersion;
  const driftFromConsumerInstalled =
    metadata.consumerInstalledVersion !== null &&
    metadata.consumerInstalledVersion !== metadata.runtimeVersion;
  const driftFromLifecycleInstalled =
    lifecycleInstalled !== null && metadata.resolvedVersion !== lifecycleInstalled;
  const driftTargets = [
    driftFromRuntime ? `runtime=${metadata.runtimeVersion}` : null,
    driftFromConsumerInstalled ? `consumer=${metadata.consumerInstalledVersion}` : null,
    driftFromLifecycleInstalled ? `lifecycle=${lifecycleInstalled}` : null,
  ].filter((value): value is string => value !== null);
  const pathExecutionHazard = hasPathExecutionHazard(params?.repoRoot);
  const pathExecutionWorkaroundCommand = pathExecutionHazard ? buildLocalPumukiCommand() : null;

  return {
    effective: metadata.resolvedVersion,
    runtime: metadata.runtimeVersion,
    consumerInstalled: metadata.consumerInstalledVersion,
    lifecycleInstalled,
    source: metadata.source,
    driftFromRuntime,
    driftFromLifecycleInstalled,
    driftWarning:
      driftTargets.length > 0
        ? `Version drift detectado: effective=${metadata.resolvedVersion} ${driftTargets.join(' ')}.`
        : null,
    alignmentCommand:
      driftTargets.length > 0
        ? buildLifecycleAlignmentCommand(metadata.runtimeVersion, params?.repoRoot)
        : null,
    pathExecutionHazard,
    pathExecutionWarning: pathExecutionHazard
      ? `La ruta del repositorio contiene "${delimiter}", que rompe PATH en este sistema y puede hacer fallar invocaciones con npx/npm exec.`
      : null,
    pathExecutionWorkaroundCommand,
  };
};
