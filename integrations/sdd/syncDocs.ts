import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readSddStatus } from './policy';
import type { SddStage } from './types';

const SDD_STATUS_SECTION = {
  id: 'sdd-status',
  begin: '<!-- PUMUKI:BEGIN SDD_STATUS -->',
  end: '<!-- PUMUKI:END SDD_STATUS -->',
} as const;

type ManagedSectionSyncResult = {
  sectionId: string;
  updated: boolean;
  before: string;
  after: string;
  diffMarkdown: string;
};

export type SddSyncDocsManagedSection = {
  id: string;
  beginMarker: string;
  endMarker: string;
  renderBody: (repoRoot: string) => string;
};

export type SddSyncDocsTarget = {
  path: string;
  sections: ReadonlyArray<SddSyncDocsManagedSection>;
};

export type SddSyncDocsFileResult = {
  path: string;
  updated: boolean;
  beforeDigest: string;
  afterDigest: string;
  sections: ReadonlyArray<ManagedSectionSyncResult>;
  diffMarkdown: string;
};

export type SddSyncDocsResult = {
  command: 'pumuki sdd sync-docs';
  dryRun: boolean;
  repoRoot: string;
  context: {
    change: string | null;
    stage: SddStage | null;
    task: string | null;
  };
  updated: boolean;
  files: ReadonlyArray<SddSyncDocsFileResult>;
};

const normalizeSectionBody = (value: string): string => value.trim().replace(/\r\n/g, '\n');

const computeDigest = (value: string): string =>
  createHash('sha256').update(value, 'utf8').digest('hex');

const prefixLines = (value: string, marker: '-' | '+'): string =>
  value
    .split('\n')
    .map((line) => `${marker} ${line}`)
    .join('\n');

const buildSectionDiffMarkdown = (params: { sectionId: string; before: string; after: string }): string => {
  if (params.before === params.after) {
    return `### ${params.sectionId}\nNo changes.\n`;
  }
  return [
    `### ${params.sectionId}`,
    '```diff',
    prefixLines(params.before, '-'),
    prefixLines(params.after, '+'),
    '```',
    '',
  ].join('\n');
};

const buildFileDiffMarkdown = (params: {
  path: string;
  sections: ReadonlyArray<ManagedSectionSyncResult>;
}): string =>
  [
    `## ${params.path}`,
    ...params.sections.map((section) => section.diffMarkdown),
  ].join('\n');

const formatSddStatusManagedBody = (repoRoot: string): string => {
  const status = readSddStatus(repoRoot);
  return [
    `- repo_root: ${status.repoRoot}`,
    `- openspec_installed: ${status.openspec.installed ? 'yes' : 'no'}`,
    `- openspec_version: ${status.openspec.version ?? 'unknown'}`,
    `- openspec_project_initialized: ${status.openspec.projectInitialized ? 'yes' : 'no'}`,
    `- openspec_compatible: ${status.openspec.compatible ? 'yes' : 'no'}`,
    `- sdd_session_active: ${status.session.active ? 'yes' : 'no'}`,
    `- sdd_session_valid: ${status.session.valid ? 'yes' : 'no'}`,
    `- sdd_session_change: ${status.session.changeId ?? 'none'}`,
  ].join('\n');
};

const DEFAULT_SYNC_DOCS_TARGETS: ReadonlyArray<SddSyncDocsTarget> = [
  {
    path: 'docs/technical/08-validation/refactor/pumuki-integration-feedback.md',
    sections: [
      {
        id: SDD_STATUS_SECTION.id,
        beginMarker: SDD_STATUS_SECTION.begin,
        endMarker: SDD_STATUS_SECTION.end,
        renderBody: formatSddStatusManagedBody,
      },
    ],
  },
];

export const SDD_SYNC_DOCS_CANONICAL_FILES = DEFAULT_SYNC_DOCS_TARGETS.map(
  (target) => target.path
);

const applyManagedSection = (params: {
  filePath: string;
  source: string;
  beginMarker: string;
  endMarker: string;
  renderedBody: string;
  sectionId: string;
}): {
  nextSource: string;
  result: ManagedSectionSyncResult;
} => {
  const beginIndex = params.source.indexOf(params.beginMarker);
  const endIndex = params.source.indexOf(params.endMarker);

  if (beginIndex === -1 || endIndex === -1 || endIndex < beginIndex) {
    throw new Error(
      `[pumuki][sdd] sync-docs conflict in ${params.filePath}: expected managed markers ${params.beginMarker} ... ${params.endMarker}`
    );
  }

  const bodyStart = beginIndex + params.beginMarker.length;
  const bodyEnd = endIndex;
  const beforeBody = normalizeSectionBody(params.source.slice(bodyStart, bodyEnd));
  const afterBody = normalizeSectionBody(params.renderedBody);
  const updated = beforeBody !== afterBody;
  const replacement = `${params.beginMarker}\n${params.renderedBody}\n${params.endMarker}`;
  const nextSource = updated
    ? `${params.source.slice(0, beginIndex)}${replacement}${params.source.slice(
      endIndex + params.endMarker.length
    )}`
    : params.source;

  const result: ManagedSectionSyncResult = {
    sectionId: params.sectionId,
    updated,
    before: beforeBody,
    after: afterBody,
    diffMarkdown: buildSectionDiffMarkdown({
      sectionId: params.sectionId,
      before: beforeBody,
      after: afterBody,
    }),
  };
  return { nextSource, result };
};

export const runSddSyncDocs = (params?: {
  repoRoot?: string;
  dryRun?: boolean;
  change?: string;
  stage?: SddStage;
  task?: string;
  targets?: ReadonlyArray<SddSyncDocsTarget>;
}): SddSyncDocsResult => {
  const repoRoot = resolve(params?.repoRoot ?? process.cwd());
  const dryRun = params?.dryRun === true;
  const change = params?.change?.trim() ? params.change.trim() : null;
  const stage = params?.stage ?? null;
  const task = params?.task?.trim() ? params.task.trim() : null;
  const targets = params?.targets ?? DEFAULT_SYNC_DOCS_TARGETS;

  const updates = targets.map((target) => {
    const absolutePath = resolve(repoRoot, target.path);
    if (!existsSync(absolutePath)) {
      throw new Error(
        `[pumuki][sdd] sync-docs missing canonical file: ${target.path}`
      );
    }

    const currentSource = readFileSync(absolutePath, 'utf8');
    let nextSource = currentSource;
    const sectionUpdates: ManagedSectionSyncResult[] = [];

    for (const section of target.sections) {
      const update = applyManagedSection({
        filePath: target.path,
        source: nextSource,
        beginMarker: section.beginMarker,
        endMarker: section.endMarker,
        renderedBody: section.renderBody(repoRoot),
        sectionId: section.id,
      });
      nextSource = update.nextSource;
      sectionUpdates.push(update.result);
    }

    return {
      relativePath: target.path,
      absolutePath,
      currentSource,
      nextSource,
      sections: sectionUpdates,
    };
  });

  if (!dryRun) {
    for (const update of updates) {
      if (update.currentSource === update.nextSource) {
        continue;
      }
      writeFileSync(update.absolutePath, update.nextSource, 'utf8');
    }
  }

  const files: ReadonlyArray<SddSyncDocsFileResult> = updates.map((update) => ({
    path: update.relativePath,
    updated: update.currentSource !== update.nextSource,
    beforeDigest: computeDigest(update.currentSource),
    afterDigest: computeDigest(update.nextSource),
    sections: update.sections,
    diffMarkdown: buildFileDiffMarkdown({
      path: update.relativePath,
      sections: update.sections,
    }),
  }));

  return {
    command: 'pumuki sdd sync-docs',
    dryRun,
    repoRoot,
    context: {
      change,
      stage,
      task,
    },
    updated: files.some((file) => file.updated),
    files,
  };
};
