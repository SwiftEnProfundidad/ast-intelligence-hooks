import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { readEvidenceResult, type EvidenceReadResult } from '../evidence/readEvidence';
import { readSddStatus } from './policy';
import {
  applyManagedSection,
  buildSectionDiffMarkdown,
  buildFileDiffMarkdown,
  buildOpenSpecAutoSyncTargets,
  computeSyncDocsDigest,
  normalizeSectionBody,
  resolveSyncDocsTargets,
  SDD_SYNC_DOCS_CANONICAL_FILES,
  type ManagedSectionSyncResult,
  type SddSyncDocsManagedSection,
  type SddSyncDocsTarget,
} from './syncDocsTargets';
import type { SddStage } from './types';

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
    fromEvidencePath: string | null;
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
      scoring: {
        profile: 'heuristic-v1';
        score: number;
        successful_count: number;
        failed_count: number;
        anomaly_count: number;
        rule_update_count: number;
      };
      sync_docs: {
        updated: boolean;
        file_paths: string[];
      };
    };
  };
};

export type SddLearnResult = {
  command: 'pumuki sdd learn';
  dryRun: boolean;
  repoRoot: string;
  context: {
    change: string;
    stage: SddStage | null;
    task: string | null;
    fromEvidencePath: string | null;
  };
  learning: NonNullable<SddSyncDocsResult['learning']>;
};

export type SddAutoSyncResult = {
  command: 'pumuki sdd auto-sync';
  dryRun: boolean;
  repoRoot: string;
  context: {
    change: string;
    stage: SddStage | null;
    task: string | null;
    fromEvidencePath: string | null;
  };
  syncDocs: {
    updated: boolean;
    files: ReadonlyArray<SddSyncDocsFileResult>;
  };
  learning: NonNullable<SddSyncDocsResult['learning']>;
};

const resolveRepoBoundPath = (params: {
  repoRoot: string;
  candidatePath: string;
  flagName: '--from-evidence';
}): string => {
  const repoRootAbsolute = resolve(params.repoRoot);
  const resolved = isAbsolute(params.candidatePath)
    ? resolve(params.candidatePath)
    : resolve(repoRootAbsolute, params.candidatePath);
  const rel = relative(repoRootAbsolute, resolved);
  if (
    rel === '..' ||
    rel.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) ||
    isAbsolute(rel)
  ) {
    throw new Error(
      `[pumuki][sdd] ${params.flagName} must resolve inside repository root: ${params.candidatePath}`
    );
  }
  return resolved;
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

const toLearningScore = (params: {
  successfulPatterns: string[];
  failedPatterns: string[];
  gateAnomalies: string[];
  ruleUpdates: string[];
}): {
  profile: 'heuristic-v1';
  score: number;
  successful_count: number;
  failed_count: number;
  anomaly_count: number;
  rule_update_count: number;
} => {
  const successfulCount = params.successfulPatterns.length;
  const failedCount = params.failedPatterns.length;
  const anomalyCount = params.gateAnomalies.length;
  const ruleUpdateCount = params.ruleUpdates.length;
  const rawScore = 100 + successfulCount * 4 - failedCount * 25 - anomalyCount * 10 - ruleUpdateCount * 5;
  const score = Math.max(0, Math.min(100, rawScore));
  return {
    profile: 'heuristic-v1',
    score,
    successful_count: successfulCount,
    failed_count: failedCount,
    anomaly_count: anomalyCount,
    rule_update_count: ruleUpdateCount,
  };
};

export const runSddSyncDocs = (params?: {
  repoRoot?: string;
  dryRun?: boolean;
  change?: string;
  stage?: SddStage;
  task?: string;
  fromEvidencePath?: string;
  targets?: ReadonlyArray<SddSyncDocsTarget>;
  now?: () => Date;
  evidenceReader?: (repoRoot: string) => EvidenceReadResult;
}): SddSyncDocsResult => {
  const repoRoot = resolve(params?.repoRoot ?? process.cwd());
  const dryRun = params?.dryRun === true;
  const change = params?.change?.trim() ? params.change.trim() : null;
  const stage = params?.stage ?? null;
  const task = params?.task?.trim() ? params.task.trim() : null;
  const fromEvidencePath = params?.fromEvidencePath?.trim()
    ? params.fromEvidencePath.trim()
    : null;
  const fromEvidenceAbsolutePath = fromEvidencePath
    ? resolveRepoBoundPath({
      repoRoot,
      candidatePath: fromEvidencePath,
      flagName: '--from-evidence',
    })
    : null;
  const targets = resolveSyncDocsTargets(repoRoot, params?.targets);
  const now = params?.now ?? (() => new Date());
  const evidenceReader =
    params?.evidenceReader ??
    ((candidateRepoRoot: string) =>
      readEvidenceResult(
        candidateRepoRoot,
        fromEvidenceAbsolutePath
          ? { evidencePath: fromEvidenceAbsolutePath }
          : undefined
      ));

  const updates: Array<{
    relativePath: string;
    absolutePath: string;
    currentSource: string;
    nextSource: string;
    sections: ManagedSectionSyncResult[];
  }> = [];

  for (const target of targets) {
    const absolutePath = resolve(repoRoot, target.path);
    const exists = existsSync(absolutePath);
    let currentSource = '';

    if (!exists) {
      if (target.bootstrapIfMissing !== undefined) {
        currentSource =
          typeof target.bootstrapIfMissing === 'function'
            ? target.bootstrapIfMissing(repoRoot)
            : target.bootstrapIfMissing;
      } else if (target.optional) {
        continue;
      } else {
        throw new Error(
          `[pumuki][sdd] sync-docs missing canonical file: ${target.path}`
        );
      }
    } else {
      currentSource = readFileSync(absolutePath, 'utf8');
    }

    let nextSource = currentSource;
    const sectionUpdates: ManagedSectionSyncResult[] = [];

    if (target.renderWholeFile) {
      nextSource = target.renderWholeFile(repoRoot, nextSource);
      sectionUpdates.push({
        sectionId: 'file-content',
        updated: normalizeSectionBody(currentSource) !== normalizeSectionBody(nextSource),
        before: normalizeSectionBody(currentSource),
        after: normalizeSectionBody(nextSource),
        diffMarkdown: buildSectionDiffMarkdown({
          sectionId: 'file-content',
          before: normalizeSectionBody(currentSource),
          after: normalizeSectionBody(nextSource),
        }),
      });
    } else {
      if (!target.sections || target.sections.length === 0) {
        throw new Error(
          `[pumuki][sdd] sync-docs invalid target configuration for ${target.path}: expected sections or renderWholeFile`
        );
      }
      for (const section of target.sections) {
        const update = applyManagedSection({
          filePath: target.path,
          source: nextSource,
          beginMarker: section.beginMarker,
          endMarker: section.endMarker,
          renderedBody: section.renderBody(repoRoot),
          sectionId: section.id,
          createIfMissing: section.createIfMissing,
        });
        nextSource = update.nextSource;
        sectionUpdates.push(update.result);
      }
    }

    updates.push({
      relativePath: target.path,
      absolutePath,
      currentSource,
      nextSource,
      sections: sectionUpdates,
    });
  }

  if (!dryRun) {
    for (const update of updates) {
      if (update.currentSource === update.nextSource && existsSync(update.absolutePath)) {
        continue;
      }
      mkdirSync(dirname(update.absolutePath), { recursive: true });
      writeFileSync(update.absolutePath, update.nextSource, 'utf8');
    }
  }

  const files: ReadonlyArray<SddSyncDocsFileResult> = updates.map((update) => ({
    path: update.relativePath,
    updated: update.currentSource !== update.nextSource,
    beforeDigest: computeSyncDocsDigest(update.currentSource),
    afterDigest: computeSyncDocsDigest(update.nextSource),
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
    const scoring = toLearningScore({
      successfulPatterns: signals.successfulPatterns,
      failedPatterns: signals.failedPatterns,
      gateAnomalies: signals.gateAnomalies,
      ruleUpdates: signals.ruleUpdates,
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
      scoring,
      sync_docs: {
        updated,
        file_paths: files.map((file) => file.path),
      },
    };
    const relativePath = `openspec/changes/${change}/learning.json`;
    const absolutePath = resolve(repoRoot, relativePath);
    const serialized = `${JSON.stringify(artifact, null, 2)}\n`;
    const digest = computeSyncDocsDigest(serialized);
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
      fromEvidencePath,
    },
    updated,
    files,
    ...(learning ? { learning } : {}),
  };
};

export const runSddLearn = (params?: {
  repoRoot?: string;
  dryRun?: boolean;
  change?: string;
  stage?: SddStage;
  task?: string;
  fromEvidencePath?: string;
  now?: () => Date;
  evidenceReader?: (repoRoot: string) => EvidenceReadResult;
}): SddLearnResult => {
  const change = params?.change?.trim();
  if (!change) {
    throw new Error('[pumuki][sdd] learn requires --change=<change-id>.');
  }

  const result = runSddSyncDocs({
    repoRoot: params?.repoRoot,
    dryRun: params?.dryRun,
    change,
    stage: params?.stage,
    task: params?.task,
    fromEvidencePath: params?.fromEvidencePath,
    now: params?.now,
    evidenceReader: params?.evidenceReader,
    targets: [],
  });

  if (!result.learning) {
    throw new Error('[pumuki][sdd] learn could not generate learning artifact.');
  }

  return {
    command: 'pumuki sdd learn',
    dryRun: result.dryRun,
    repoRoot: result.repoRoot,
    context: {
      change,
      stage: result.context.stage,
      task: result.context.task,
      fromEvidencePath: result.context.fromEvidencePath,
    },
    learning: result.learning,
  };
};

export const runSddAutoSync = (params?: {
  repoRoot?: string;
  dryRun?: boolean;
  change?: string;
  stage?: SddStage;
  task?: string;
  fromEvidencePath?: string;
  now?: () => Date;
  evidenceReader?: (repoRoot: string) => EvidenceReadResult;
  targets?: ReadonlyArray<SddSyncDocsTarget>;
}): SddAutoSyncResult => {
  const change = params?.change?.trim();
  if (!change) {
    throw new Error('[pumuki][sdd] auto-sync requires --change=<change-id>.');
  }
  const repoRoot = resolve(params?.repoRoot ?? process.cwd());
  const now = params?.now ?? (() => new Date());
  const targets =
    params?.targets ??
    [
      ...resolveSyncDocsTargets(repoRoot),
      ...buildOpenSpecAutoSyncTargets({
        change,
        stage: params?.stage ?? null,
        task: params?.task?.trim() ? params.task.trim() : null,
        now,
      }),
    ];

  const syncResult = runSddSyncDocs({
    repoRoot,
    dryRun: params?.dryRun,
    change,
    stage: params?.stage,
    task: params?.task,
    fromEvidencePath: params?.fromEvidencePath,
    now,
    evidenceReader: params?.evidenceReader,
    targets,
  });

  if (!syncResult.learning) {
    throw new Error('[pumuki][sdd] auto-sync could not generate learning artifact.');
  }

  return {
    command: 'pumuki sdd auto-sync',
    dryRun: syncResult.dryRun,
    repoRoot: syncResult.repoRoot,
    context: {
      change,
      stage: syncResult.context.stage,
      task: syncResult.context.task,
      fromEvidencePath: syncResult.context.fromEvidencePath,
    },
    syncDocs: {
      updated: syncResult.updated,
      files: syncResult.files,
    },
    learning: syncResult.learning,
  };
};
