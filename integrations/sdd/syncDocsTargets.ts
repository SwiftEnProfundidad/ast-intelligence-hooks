import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readSddStatus } from './policy';
import type { SddStage } from './types';

const SDD_STATUS_SECTION = {
  id: 'sdd-status',
  begin: '<!-- PUMUKI:BEGIN SDD_STATUS -->',
  end: '<!-- PUMUKI:END SDD_STATUS -->',
} as const;

const TRACKING_HUB_SECTION = {
  id: 'pumuki-sdd-sync',
  begin: '<!-- PUMUKI:BEGIN SDD_SYNC_STATUS -->',
  end: '<!-- PUMUKI:END SDD_SYNC_STATUS -->',
} as const;

const OPERATIONAL_SUMMARY_SECTION = {
  id: 'pumuki-sdd-sync',
  begin: '<!-- PUMUKI:BEGIN SDD_SYNC_STATUS -->',
  end: '<!-- PUMUKI:END SDD_SYNC_STATUS -->',
} as const;

const OPENSPEC_AUTO_SYNC_SECTION = {
  id: 'pumuki-auto-sync',
  begin: '<!-- PUMUKI:BEGIN AUTO_SYNC_STATUS -->',
  end: '<!-- PUMUKI:END AUTO_SYNC_STATUS -->',
} as const;

export type ManagedSectionSyncResult = {
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
  createIfMissing?: boolean;
};

export type SddSyncDocsTarget = {
  path: string;
  sections?: ReadonlyArray<SddSyncDocsManagedSection>;
  renderWholeFile?: (repoRoot: string, currentSource: string) => string;
  optional?: boolean;
  bootstrapIfMissing?: string | ((repoRoot: string) => string);
};

export const normalizeSectionBody = (value: string): string => value.trim().replace(/\r\n/g, '\n');

const prefixLines = (value: string, marker: '-' | '+'): string =>
  value
    .split('\n')
    .map((line) => `${marker} ${line}`)
    .join('\n');

export const buildSectionDiffMarkdown = (params: {
  sectionId: string;
  before: string;
  after: string;
}): string => {
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

export const buildFileDiffMarkdown = (params: {
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

const formatTrackingManagedBody = (repoRoot: string): string => {
  const status = readSddStatus(repoRoot);
  return [
    `- source: pumuki sdd sync-docs`,
    `- repo_root: ${status.repoRoot}`,
    `- openspec_installed: ${status.openspec.installed ? 'yes' : 'no'}`,
    `- openspec_version: ${status.openspec.version ?? 'unknown'}`,
    `- sdd_session_active: ${status.session.active ? 'yes' : 'no'}`,
    `- sdd_session_valid: ${status.session.valid ? 'yes' : 'no'}`,
    `- sdd_session_change: ${status.session.changeId ?? 'none'}`,
  ].join('\n');
};

const renderLastRunJson = (repoRoot: string, currentSource: string): string => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(currentSource);
  } catch {
    throw new Error('[pumuki][sdd] sync-docs invalid JSON in docs/validation/refactor/last-run.json');
  }
  if (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error('[pumuki][sdd] sync-docs expected object JSON in docs/validation/refactor/last-run.json');
  }

  const status = readSddStatus(repoRoot);
  const payload = parsed as Record<string, unknown>;
  const next = {
    ...payload,
    pumuki_sdd_status: {
      source: 'pumuki sdd sync-docs',
      repo_root: status.repoRoot,
      openspec_installed: status.openspec.installed,
      openspec_version: status.openspec.version ?? null,
      openspec_project_initialized: status.openspec.projectInitialized,
      openspec_compatible: status.openspec.compatible,
      session_active: status.session.active,
      session_valid: status.session.valid,
      session_change: status.session.changeId ?? null,
    },
  };

  return `${JSON.stringify(next, null, 2)}\n`;
};

const PRIMARY_SYNC_DOCS_TARGETS: ReadonlyArray<SddSyncDocsTarget> = [
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

const OPTIONAL_SYNC_DOCS_TARGETS: ReadonlyArray<SddSyncDocsTarget> = [
  {
    path: 'docs/strategy/ruralgo-tracking-hub.md',
    optional: true,
    sections: [
      {
        id: TRACKING_HUB_SECTION.id,
        beginMarker: TRACKING_HUB_SECTION.begin,
        endMarker: TRACKING_HUB_SECTION.end,
        renderBody: formatTrackingManagedBody,
        createIfMissing: true,
      },
    ],
  },
  {
    path: 'docs/technical/08-validation/refactor/operational-summary.md',
    optional: true,
    sections: [
      {
        id: OPERATIONAL_SUMMARY_SECTION.id,
        beginMarker: OPERATIONAL_SUMMARY_SECTION.begin,
        endMarker: OPERATIONAL_SUMMARY_SECTION.end,
        renderBody: formatTrackingManagedBody,
        createIfMissing: true,
      },
    ],
  },
  {
    path: 'docs/validation/refactor/last-run.json',
    optional: true,
    renderWholeFile: renderLastRunJson,
  },
];

const DEFAULT_SYNC_DOCS_TARGETS: ReadonlyArray<SddSyncDocsTarget> = [
  ...PRIMARY_SYNC_DOCS_TARGETS,
  ...OPTIONAL_SYNC_DOCS_TARGETS,
];

export const SDD_SYNC_DOCS_CANONICAL_FILES = DEFAULT_SYNC_DOCS_TARGETS.map(
  (target) => target.path
);

export const resolveSyncDocsTargets = (
  repoRoot: string,
  targets?: ReadonlyArray<SddSyncDocsTarget>
): ReadonlyArray<SddSyncDocsTarget> => {
  if (targets) {
    return targets;
  }
  return DEFAULT_SYNC_DOCS_TARGETS.filter((target) => {
    if (!target.optional) {
      return true;
    }
    return existsSync(resolve(repoRoot, target.path));
  });
};

const formatOpenSpecAutoSyncBody = (params: {
  change: string;
  stage: SddStage | null;
  task: string | null;
  now: () => Date;
}): string =>
  [
    `- source: pumuki sdd auto-sync`,
    `- change: ${params.change}`,
    `- stage: ${params.stage ?? 'none'}`,
    `- task: ${params.task ?? 'none'}`,
    `- updated_at: ${params.now().toISOString()}`,
  ].join('\n');

export const buildOpenSpecAutoSyncTargets = (params: {
  change: string;
  stage: SddStage | null;
  task: string | null;
  now: () => Date;
}): ReadonlyArray<SddSyncDocsTarget> => {
  const buildDoc = (title: string): string =>
    [
      `# ${title}`,
      '',
      OPENSPEC_AUTO_SYNC_SECTION.begin,
      '- source: bootstrap',
      OPENSPEC_AUTO_SYNC_SECTION.end,
      '',
    ].join('\n');

  const renderBody = () =>
    formatOpenSpecAutoSyncBody({
      change: params.change,
      stage: params.stage,
      task: params.task,
      now: params.now,
    });

  return [
    {
      path: `openspec/changes/${params.change}/tasks.md`,
      sections: [
        {
          id: OPENSPEC_AUTO_SYNC_SECTION.id,
          beginMarker: OPENSPEC_AUTO_SYNC_SECTION.begin,
          endMarker: OPENSPEC_AUTO_SYNC_SECTION.end,
          renderBody,
          createIfMissing: true,
        },
      ],
      bootstrapIfMissing: buildDoc('Tasks'),
    },
    {
      path: `openspec/changes/${params.change}/design.md`,
      sections: [
        {
          id: OPENSPEC_AUTO_SYNC_SECTION.id,
          beginMarker: OPENSPEC_AUTO_SYNC_SECTION.begin,
          endMarker: OPENSPEC_AUTO_SYNC_SECTION.end,
          renderBody,
          createIfMissing: true,
        },
      ],
      bootstrapIfMissing: buildDoc('Design'),
    },
    {
      path: `openspec/changes/${params.change}/retrospective.md`,
      sections: [
        {
          id: OPENSPEC_AUTO_SYNC_SECTION.id,
          beginMarker: OPENSPEC_AUTO_SYNC_SECTION.begin,
          endMarker: OPENSPEC_AUTO_SYNC_SECTION.end,
          renderBody,
          createIfMissing: true,
        },
      ],
      bootstrapIfMissing: buildDoc('Retrospective'),
    },
  ];
};

export const applyManagedSection = (params: {
  filePath: string;
  source: string;
  beginMarker: string;
  endMarker: string;
  renderedBody: string;
  sectionId: string;
  createIfMissing?: boolean;
}): {
  nextSource: string;
  result: ManagedSectionSyncResult;
} => {
  const beginIndex = params.source.indexOf(params.beginMarker);
  const endIndex = params.source.indexOf(params.endMarker);
  const missingBegin = beginIndex === -1;
  const missingEnd = endIndex === -1;

  if (missingBegin || missingEnd) {
    if (params.createIfMissing === true && missingBegin && missingEnd) {
      const beforeBody = '';
      const afterBody = normalizeSectionBody(params.renderedBody);
      const block = `${params.beginMarker}\n${params.renderedBody}\n${params.endMarker}`;
      const sourceTrimmedEnd = params.source.replace(/\s*$/, '');
      const nextSource =
        sourceTrimmedEnd.length === 0
          ? `${block}\n`
          : `${sourceTrimmedEnd}\n\n${block}\n`;
      return {
        nextSource,
        result: {
          sectionId: params.sectionId,
          updated: true,
          before: beforeBody,
          after: afterBody,
          diffMarkdown: buildSectionDiffMarkdown({
            sectionId: params.sectionId,
            before: beforeBody,
            after: afterBody,
          }),
        },
      };
    }
    throw new Error(
      `[pumuki][sdd] sync-docs conflict in ${params.filePath}: expected managed markers ${params.beginMarker} ... ${params.endMarker}`
    );
  }
  if (endIndex < beginIndex) {
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

export const computeSyncDocsDigest = (value: string): string =>
  createHash('sha256').update(value, 'utf8').digest('hex');
