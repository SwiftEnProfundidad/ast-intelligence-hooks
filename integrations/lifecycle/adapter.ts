import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { LifecycleGitService, type ILifecycleGitService } from './gitService';

export type AdapterAgent = string;

export type LifecycleAdapterInstallResult = {
  repoRoot: string;
  agent: AdapterAgent;
  dryRun: boolean;
  written: boolean;
  changedFiles: ReadonlyArray<string>;
};

type AdapterTemplate = {
  path: string;
  payload: unknown;
};

type AdapterTemplatesManifest = Record<string, ReadonlyArray<AdapterTemplate>>;

let cachedTemplatesManifest: AdapterTemplatesManifest | null = null;

const readTemplatesManifest = (): AdapterTemplatesManifest => {
  if (cachedTemplatesManifest) {
    return cachedTemplatesManifest;
  }
  const manifestPath = join(__dirname, 'adapter.templates.json');
  const parsed = JSON.parse(readFileSync(manifestPath, 'utf8')) as unknown;
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid adapter templates manifest.');
  }
  cachedTemplatesManifest = parsed as AdapterTemplatesManifest;
  return cachedTemplatesManifest;
};

const resolveTemplatesForAgent = (agent: AdapterAgent): ReadonlyArray<AdapterTemplate> => {
  const manifest = readTemplatesManifest();
  const templates = manifest[agent];
  if (!Array.isArray(templates) || templates.length === 0) {
    throw new Error(`Unsupported adapter agent "${agent}".`);
  }
  return templates;
};

const toJson = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

const readFileOrEmpty = (path: string): string => {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
};

export const runLifecycleAdapterInstall = (params: {
  cwd?: string;
  git?: ILifecycleGitService;
  agent: AdapterAgent;
  dryRun?: boolean;
}): LifecycleAdapterInstallResult => {
  const git = params.git ?? new LifecycleGitService();
  const repoRoot = git.resolveRepoRoot(params.cwd);
  const dryRun = params.dryRun === true;
  const templates = resolveTemplatesForAgent(params.agent);
  const changedFiles: string[] = [];

  for (const template of templates) {
    const absolutePath = join(repoRoot, template.path);
    const nextContents = toJson(template.payload);
    const currentContents = readFileOrEmpty(absolutePath);
    if (currentContents === nextContents) {
      continue;
    }
    changedFiles.push(template.path);
    if (dryRun) {
      continue;
    }
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, nextContents, 'utf8');
  }

  return {
    repoRoot,
    agent: params.agent,
    dryRun,
    written: !dryRun,
    changedFiles,
  };
};
