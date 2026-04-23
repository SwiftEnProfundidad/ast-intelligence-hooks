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

type ConsumerNodeRuntimeSpec = {
  version: string;
  source: 'volta' | '.nvmrc' | 'package.engines';
  commandPrefix: 'volta' | 'nvm';
};

const normalizeNodeVersionToken = (value: string): string =>
  value.trim().replace(/^node@/i, '').replace(/^v/i, '');

const extractNodeVersionToken = (value: string): string | null => {
  const normalized = normalizeNodeVersionToken(value);
  const exactVersion = normalized.match(/\d+\.\d+\.\d+/)?.[0];
  if (exactVersion) {
    return exactVersion;
  }
  const majorOnly = normalized.match(/^\d+$/)?.[0];
  return majorOnly ?? null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readNestedString = (
  source: Record<string, unknown>,
  path: ReadonlyArray<string>
): string | undefined => {
  let cursor: unknown = source;
  for (const segment of path) {
    if (!isRecord(cursor)) {
      return undefined;
    }
    cursor = cursor[segment];
  }
  return typeof cursor === 'string' && cursor.trim().length > 0 ? cursor.trim() : undefined;
};

const readConsumerNodeRuntimeSpec = (repoRoot?: string): ConsumerNodeRuntimeSpec | null => {
  if (typeof repoRoot !== 'string' || repoRoot.trim().length === 0) {
    return null;
  }

  const packageJsonPath = join(repoRoot, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const parsed = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as unknown;
      if (isRecord(parsed)) {
        const voltaNode = readNestedString(parsed, ['volta', 'node']);
        const voltaVersion = voltaNode ? extractNodeVersionToken(voltaNode) : null;
        if (voltaVersion) {
          return {
            version: voltaVersion,
            source: 'volta',
            commandPrefix: 'volta',
          };
        }

        const enginesNode = readNestedString(parsed, ['engines', 'node']);
        const enginesVersion = enginesNode ? extractNodeVersionToken(enginesNode) : null;
        if (enginesVersion) {
          return {
            version: enginesVersion,
            source: 'package.engines',
            commandPrefix: 'nvm',
          };
        }
      }
    } catch {
      return null;
    }
  }

  const nvmrcPath = join(repoRoot, '.nvmrc');
  if (existsSync(nvmrcPath)) {
    try {
      const nvmrcVersion = extractNodeVersionToken(readFileSync(nvmrcPath, 'utf8'));
      if (nvmrcVersion) {
        return {
          version: nvmrcVersion,
          source: '.nvmrc',
          commandPrefix: 'nvm',
        };
      }
    } catch {
      return null;
    }
  }

  return null;
};

const buildConsumerNodeAlignmentCommand = (repoRoot?: string): string | null => {
  const runtimeSpec = readConsumerNodeRuntimeSpec(repoRoot);
  if (!runtimeSpec) {
    return null;
  }

  const currentNodeVersion = normalizeNodeVersionToken(process.version);
  if (currentNodeVersion === runtimeSpec.version) {
    return null;
  }

  if (runtimeSpec.commandPrefix === 'volta') {
    return `volta install node@${runtimeSpec.version} && volta pin node@${runtimeSpec.version}`;
  }

  return `nvm install ${runtimeSpec.version} && nvm use ${runtimeSpec.version}`;
};

export const buildLifecycleAlignmentCommand = (
  runtimeVersion: string,
  repoRoot?: string
): string => {
  const consumerNodeAlignmentCommand = buildConsumerNodeAlignmentCommand(repoRoot);
  const installStep = `npm install --save-exact pumuki@${runtimeVersion}`;
  const runStep = hasPathExecutionHazard(repoRoot)
    ? `${buildLocalPumukiCommand()} install`
    : `npx --yes --package pumuki@${runtimeVersion} pumuki install`;
  return [consumerNodeAlignmentCommand, installStep, runStep]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .join(' && ');
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
  const consumerNodeSpec = readConsumerNodeRuntimeSpec(params?.repoRoot);
  const consumerNodeVersion = consumerNodeSpec?.version ?? null;
  const currentNodeVersion = normalizeNodeVersionToken(process.version);
  const driftFromConsumerNode =
    consumerNodeVersion !== null && currentNodeVersion !== consumerNodeVersion;
  const driftFromLifecycleInstalled =
    lifecycleInstalled !== null && metadata.resolvedVersion !== lifecycleInstalled;
  const driftTargets = [
    driftFromRuntime ? `runtime=${metadata.runtimeVersion}` : null,
    driftFromConsumerInstalled ? `consumer=${metadata.consumerInstalledVersion}` : null,
    driftFromConsumerNode ? `node=${consumerNodeVersion}` : null,
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
