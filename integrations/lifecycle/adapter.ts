import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
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
  mode?: 'replace' | 'json-merge';
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const mergeObjects = (base: unknown, incoming: unknown): unknown => {
  if (!isRecord(base) || !isRecord(incoming)) {
    return incoming;
  }
  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(incoming)) {
    merged[key] = key in base ? mergeObjects(base[key], value) : value;
  }
  return merged;
};

const resolveHomeDir = (): string => process.env.HOME ?? homedir();

const resolveTemplatePath = (repoRoot: string, templatePath: string): string => {
  if (templatePath.startsWith('$HOME/')) {
    return resolve(resolveHomeDir(), templatePath.slice('$HOME/'.length));
  }
  if (templatePath.startsWith('~/')) {
    return resolve(resolveHomeDir(), templatePath.slice(2));
  }
  if (isAbsolute(templatePath)) {
    return templatePath;
  }
  return join(repoRoot, templatePath);
};

const buildTemplateContents = (params: {
  template: AdapterTemplate;
  absolutePath: string;
}): { currentContents: string; nextContents: string } => {
  const currentContents = readFileOrEmpty(params.absolutePath);
  if (params.template.mode !== 'json-merge') {
    return {
      currentContents,
      nextContents: toJson(params.template.payload),
    };
  }

  if (!isRecord(params.template.payload)) {
    throw new Error(`Invalid adapter template payload for JSON merge: "${params.template.path}".`);
  }

  let baseObject: Record<string, unknown> = {};
  if (currentContents.trim().length > 0) {
    let parsedCurrent: unknown;
    try {
      parsedCurrent = JSON.parse(currentContents) as unknown;
    } catch {
      throw new Error(
        `Cannot merge adapter template into invalid JSON file: "${params.template.path}" (${params.absolutePath}).`
      );
    }
    if (!isRecord(parsedCurrent)) {
      throw new Error(
        `Cannot merge adapter template into non-object JSON file: "${params.template.path}" (${params.absolutePath}).`
      );
    }
    baseObject = parsedCurrent;
  }

  const merged = mergeObjects(baseObject, params.template.payload);
  return {
    currentContents,
    nextContents: toJson(merged),
  };
};

export const runLifecycleAdapterInstall = (params: {
  cwd?: string;
  git?: ILifecycleGitService;
  agent: AdapterAgent;
  dryRun?: boolean;
}): LifecycleAdapterInstallResult => {
  const git = params.git ?? new LifecycleGitService();
  const repoRoot = git.resolveRepoRoot(params.cwd ?? process.cwd());
  const dryRun = params.dryRun === true;
  const templates = resolveTemplatesForAgent(params.agent);
  const changedFiles: string[] = [];

  for (const template of templates) {
    const absolutePath = resolveTemplatePath(repoRoot, template.path);
    const { currentContents, nextContents } = buildTemplateContents({
      template,
      absolutePath,
    });
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
