import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { readEvidenceResult, type EvidenceReadResult } from '../evidence/readEvidence';
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
  learning?: {
    path: string;
    written: boolean;
    digest: string;
    artifact: {
      version: '1.0';
      change_id: string;
      stage: SddStage | null;
      task: string | null;
      generated_at: string;
      failed_patterns: string[];
      successful_patterns: string[];
      rule_updates: string[];
      gate_anomalies: string[];
      sync_docs: {
        updated: boolean;
        file_paths: string[];
      };
    };
  };
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

const toSortedArray = (set: Set<string>): string[] => {
  return [...set].sort((left, right) => left.localeCompare(right));
};

const collectLearningSignals = (params: {
  updated: boolean;
  evidenceResult: EvidenceReadResult;
}): {
  failedPatterns: string[];
  successfulPatterns: string[];
  gateAnomalies: string[];
  ruleUpdates: string[];
} => {
  const failedPatterns = new Set<string>();
  const successfulPatterns = new Set<string>();
  const gateAnomalies = new Set<string>();
  const ruleUpdates = new Set<string>();

  successfulPatterns.add('sync-docs.completed');
  successfulPatterns.add(params.updated ? 'sync-docs.updated' : 'sync-docs.no_changes');

  if (params.evidenceResult.kind === 'missing') {
    gateAnomalies.add('evidence.missing');
    ruleUpdates.add('evidence.bootstrap.required');
  } else if (params.evidenceResult.kind === 'invalid') {
    gateAnomalies.add(`evidence.invalid.${params.evidenceResult.reason}`);
    ruleUpdates.add('evidence.rebuild.required');
    if (params.evidenceResult.reason === 'schema') {
      ruleUpdates.add('evidence.schema.repair');
    }
    if (params.evidenceResult.reason === 'evidence-chain-invalid') {
      ruleUpdates.add('evidence.chain.repair');
    }
  } else {
    const evidence = params.evidenceResult.evidence;
    if (evidence.ai_gate.status === 'BLOCKED') {
      failedPatterns.add('ai-gate.blocked');
      ruleUpdates.add('ai-gate.unblock.required');
      for (const violation of evidence.ai_gate.violations) {
        gateAnomalies.add(`ai-gate.violation.${violation.code}`);
        ruleUpdates.add(`ai-gate.violation.${violation.code}.review`);
      }
    } else {
      successfulPatterns.add('ai-gate.allowed');
    }
    if (evidence.snapshot.outcome === 'BLOCK') {
      gateAnomalies.add('snapshot.outcome.block');
      ruleUpdates.add('snapshot.outcome.review');
    }
    const sddDecision = evidence.sdd_metrics?.decision;
    if (sddDecision) {
      if (sddDecision.allowed) {
        successfulPatterns.add('sdd.allowed');
      } else {
        failedPatterns.add(`sdd.blocked.${sddDecision.code}`);
        ruleUpdates.add(`sdd.${sddDecision.code}.remediate`);
      }
    }
  }

  return {
    failedPatterns: toSortedArray(failedPatterns),
    successfulPatterns: toSortedArray(successfulPatterns),
    gateAnomalies: toSortedArray(gateAnomalies),
    ruleUpdates: toSortedArray(ruleUpdates),
  };
};

export const runSddSyncDocs = (params?: {
  repoRoot?: string;
  dryRun?: boolean;
  change?: string;
  stage?: SddStage;
  task?: string;
  targets?: ReadonlyArray<SddSyncDocsTarget>;
  now?: () => Date;
  evidenceReader?: (repoRoot: string) => EvidenceReadResult;
}): SddSyncDocsResult => {
  const repoRoot = resolve(params?.repoRoot ?? process.cwd());
  const dryRun = params?.dryRun === true;
  const change = params?.change?.trim() ? params.change.trim() : null;
  const stage = params?.stage ?? null;
  const task = params?.task?.trim() ? params.task.trim() : null;
  const targets = params?.targets ?? DEFAULT_SYNC_DOCS_TARGETS;
  const now = params?.now ?? (() => new Date());
  const evidenceReader = params?.evidenceReader ?? readEvidenceResult;

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

  const updated = files.some((file) => file.updated);
  let learning: SddSyncDocsResult['learning'];
  if (change) {
    const signals = collectLearningSignals({
      updated,
      evidenceResult: evidenceReader(repoRoot),
    });
    const artifact = {
      version: '1.0' as const,
      change_id: change,
      stage,
      task,
      generated_at: now().toISOString(),
      failed_patterns: signals.failedPatterns,
      successful_patterns: signals.successfulPatterns,
      rule_updates: signals.ruleUpdates,
      gate_anomalies: signals.gateAnomalies,
      sync_docs: {
        updated,
        file_paths: files.map((file) => file.path),
      },
    };
    const relativePath = `openspec/changes/${change}/learning.json`;
    const absolutePath = resolve(repoRoot, relativePath);
    const serialized = `${JSON.stringify(artifact, null, 2)}\n`;
    const digest = computeDigest(serialized);
    if (!dryRun) {
      mkdirSync(dirname(absolutePath), { recursive: true });
      writeFileSync(absolutePath, serialized, 'utf8');
    }
    learning = {
      path: relativePath,
      written: !dryRun,
      digest,
      artifact,
    };
  }

  return {
    command: 'pumuki sdd sync-docs',
    dryRun,
    repoRoot,
    context: {
      change,
      stage,
      task,
    },
    updated,
    files,
    ...(learning ? { learning } : {}),
  };
};
