import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

export type SddStateSyncStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type SddStateSyncTestStatus = 'passed' | 'failed';

type ScenarioEvidenceArtifact = {
  version: '1.0' | '1';
  generated_at?: string;
  scenario_id: string;
  test_run: {
    status: SddStateSyncTestStatus;
  };
};

type ScenarioBoardEntry = {
  scenario_id: string;
  status: SddStateSyncStatus;
  evidence_digest: string;
  source_test_status: SddStateSyncTestStatus;
  updated_at: string;
};

type ScenarioBoardArtifact = {
  version: '1.0';
  generated_at: string;
  recent_sync: {
    scenario_id: string;
    status: SddStateSyncStatus;
    evidence_digest: string;
    source_test_status: SddStateSyncTestStatus;
    source_evidence_path: string;
  };
  summary: {
    total: number;
    todo: number;
    in_progress: number;
    blocked: number;
    done: number;
  };
  scenarios: ScenarioBoardEntry[];
};

export type SddStateSyncResult = {
  command: 'pumuki sdd state-sync';
  dryRun: boolean;
  repoRoot: string;
  context: {
    scenarioId: string;
    desiredStatus: SddStateSyncStatus;
    force: boolean;
    fromEvidencePath: string | null;
    boardPath: string;
  };
  sourceEvidence: {
    path: string;
    digest: string;
    generatedAt: string | null;
    scenarioId: string;
    testStatus: SddStateSyncTestStatus;
  };
  board: {
    path: string;
    exists: boolean;
    updated: boolean;
    conflict: boolean;
    written: boolean;
    previousStatus: SddStateSyncStatus | null;
    nextStatus: SddStateSyncStatus;
    entries: number;
  };
  decision: {
    allowed: boolean;
    code: 'STATE_SYNC_APPLIED' | 'STATE_SYNC_DRY_RUN' | 'STATE_SYNC_CONFLICT';
    message: string;
    nextAction: string | null;
  };
  artifact: ScenarioBoardArtifact;
};

const computeDigest = (value: string): string =>
  `sha256:${createHash('sha256').update(value, 'utf8').digest('hex')}`;

const normalizeRequired = (value: string, field: string): string => {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new Error(`[pumuki][sdd] state-sync requires valid ${field}.`);
  }
  return normalized;
};

const resolveRepoBoundPath = (params: {
  repoRoot: string;
  candidatePath: string;
  flagName: '--from-evidence' | '--board-path';
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

const readScenarioEvidenceArtifact = (path: string): {
  raw: string;
  digest: string;
  generatedAt: string | null;
  scenarioId: string;
  testStatus: SddStateSyncTestStatus;
} => {
  if (!existsSync(path)) {
    throw new Error(
      `[pumuki][sdd] state-sync missing source evidence: ${path}. Run "pumuki sdd evidence --scenario-id=<id> --test-command=<command> --test-status=passed|failed" first.`
    );
  }
  const raw = readFileSync(path, 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`[pumuki][sdd] state-sync source evidence is not valid JSON: ${path}`);
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(`[pumuki][sdd] state-sync source evidence has invalid structure: ${path}`);
  }
  const candidate = parsed as Partial<ScenarioEvidenceArtifact>;
  if (candidate.version !== '1.0' && candidate.version !== '1') {
    throw new Error(
      `[pumuki][sdd] state-sync source evidence version must be 1 or 1.0. Found: ${String(candidate.version ?? 'unknown')}`
    );
  }
  const scenarioId = normalizeRequired(String(candidate.scenario_id ?? ''), 'scenario_id');
  const testStatus = candidate.test_run?.status;
  if (testStatus !== 'passed' && testStatus !== 'failed') {
    throw new Error('[pumuki][sdd] state-sync source evidence requires test_run.status=passed|failed.');
  }
  return {
    raw,
    digest: computeDigest(raw),
    generatedAt: typeof candidate.generated_at === 'string' ? candidate.generated_at : null,
    scenarioId,
    testStatus,
  };
};

const normalizeBoardArtifact = (raw: string, boardPath: string): ScenarioBoardArtifact => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`[pumuki][sdd] state-sync board file is not valid JSON: ${boardPath}`);
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error(`[pumuki][sdd] state-sync board file has invalid structure: ${boardPath}`);
  }
  const candidate = parsed as Partial<ScenarioBoardArtifact>;
  if (candidate.version !== '1.0' || !Array.isArray(candidate.scenarios)) {
    throw new Error(`[pumuki][sdd] state-sync board file must follow version 1.0 schema: ${boardPath}`);
  }
  for (const entry of candidate.scenarios) {
    if (
      typeof entry !== 'object' ||
      entry === null ||
      typeof entry.scenario_id !== 'string' ||
      typeof entry.evidence_digest !== 'string' ||
      typeof entry.updated_at !== 'string' ||
      (entry.status !== 'todo' &&
        entry.status !== 'in_progress' &&
        entry.status !== 'blocked' &&
        entry.status !== 'done') ||
      (entry.source_test_status !== 'passed' && entry.source_test_status !== 'failed')
    ) {
      throw new Error(
        `[pumuki][sdd] state-sync board scenarios entry is invalid in ${boardPath}`
      );
    }
  }
  return {
    version: '1.0',
    generated_at:
      typeof candidate.generated_at === 'string' ? candidate.generated_at : new Date(0).toISOString(),
    recent_sync:
      candidate.recent_sync && typeof candidate.recent_sync === 'object'
        ? (candidate.recent_sync as ScenarioBoardArtifact['recent_sync'])
        : {
            scenario_id: '',
            status: 'todo',
            evidence_digest: '',
            source_test_status: 'passed',
            source_evidence_path: '',
          },
    summary:
      candidate.summary && typeof candidate.summary === 'object'
        ? (candidate.summary as ScenarioBoardArtifact['summary'])
        : { total: 0, todo: 0, in_progress: 0, blocked: 0, done: 0 },
    scenarios: candidate.scenarios as ScenarioBoardEntry[],
  };
};

const deriveStatusFromTest = (status: SddStateSyncTestStatus): SddStateSyncStatus =>
  status === 'passed' ? 'done' : 'blocked';

const buildSummary = (entries: ReadonlyArray<ScenarioBoardEntry>): ScenarioBoardArtifact['summary'] => {
  const summary = { total: entries.length, todo: 0, in_progress: 0, blocked: 0, done: 0 };
  for (const entry of entries) {
    if (entry.status === 'todo') {
      summary.todo += 1;
    } else if (entry.status === 'in_progress') {
      summary.in_progress += 1;
    } else if (entry.status === 'blocked') {
      summary.blocked += 1;
    } else if (entry.status === 'done') {
      summary.done += 1;
    }
  }
  return summary;
};

export const runSddStateSync = (params?: {
  repoRoot?: string;
  dryRun?: boolean;
  scenarioId?: string;
  status?: SddStateSyncStatus;
  force?: boolean;
  fromEvidencePath?: string;
  boardPath?: string;
  now?: () => Date;
}): SddStateSyncResult => {
  const repoRoot = resolve(params?.repoRoot ?? process.cwd());
  const dryRun = params?.dryRun === true;
  const force = params?.force === true;
  const fromEvidencePathInput = params?.fromEvidencePath?.trim()
    ? params.fromEvidencePath.trim()
    : '.pumuki/artifacts/pumuki-evidence-v1.json';
  const boardPathInput = params?.boardPath?.trim()
    ? params.boardPath.trim()
    : '.pumuki/artifacts/scenario-state-sync-v1.json';
  const fromEvidenceAbsolutePath = resolveRepoBoundPath({
    repoRoot,
    candidatePath: fromEvidencePathInput,
    flagName: '--from-evidence',
  });
  const boardAbsolutePath = resolveRepoBoundPath({
    repoRoot,
    candidatePath: boardPathInput,
    flagName: '--board-path',
  });
  const fromEvidenceRelativePath = relative(repoRoot, fromEvidenceAbsolutePath).split('\\').join('/');
  const boardRelativePath = relative(repoRoot, boardAbsolutePath).split('\\').join('/');
  const sourceEvidence = readScenarioEvidenceArtifact(fromEvidenceAbsolutePath);
  const scenarioId = normalizeRequired(
    params?.scenarioId?.trim() ? params.scenarioId : sourceEvidence.scenarioId,
    'scenario_id'
  );
  const desiredStatus = params?.status ?? deriveStatusFromTest(sourceEvidence.testStatus);

  const boardExists = existsSync(boardAbsolutePath);
  const currentBoard = boardExists
    ? normalizeBoardArtifact(readFileSync(boardAbsolutePath, 'utf8'), boardRelativePath)
    : {
        version: '1.0' as const,
        generated_at: new Date(0).toISOString(),
        recent_sync: {
          scenario_id: '',
          status: 'todo' as const,
          evidence_digest: '',
          source_test_status: 'passed' as const,
          source_evidence_path: '',
        },
        summary: {
          total: 0,
          todo: 0,
          in_progress: 0,
          blocked: 0,
          done: 0,
        },
        scenarios: [] as ScenarioBoardEntry[],
      };

  const now = params?.now ?? (() => new Date());
  const nextEntries = [...currentBoard.scenarios];
  const entryIndex = nextEntries.findIndex((entry) => entry.scenario_id === scenarioId);
  const previousEntry = entryIndex >= 0 ? nextEntries[entryIndex] : null;
  const conflict =
    previousEntry !== null &&
    previousEntry.status !== desiredStatus &&
    previousEntry.evidence_digest !== sourceEvidence.digest &&
    !force;

  if (!conflict) {
    const nextEntry: ScenarioBoardEntry = {
      scenario_id: scenarioId,
      status: desiredStatus,
      evidence_digest: sourceEvidence.digest,
      source_test_status: sourceEvidence.testStatus,
      updated_at: now().toISOString(),
    };
    if (entryIndex >= 0) {
      nextEntries[entryIndex] = nextEntry;
    } else {
      nextEntries.push(nextEntry);
    }
  }

  const sortedEntries = nextEntries.sort((left, right) =>
    left.scenario_id.localeCompare(right.scenario_id)
  );
  const artifact: ScenarioBoardArtifact = {
    version: '1.0',
    generated_at: now().toISOString(),
    recent_sync: {
      scenario_id: scenarioId,
      status: desiredStatus,
      evidence_digest: sourceEvidence.digest,
      source_test_status: sourceEvidence.testStatus,
      source_evidence_path: fromEvidenceRelativePath,
    },
    summary: buildSummary(sortedEntries),
    scenarios: sortedEntries,
  };
  const serialized = `${JSON.stringify(artifact, null, 2)}\n`;
  const beforeSerialized = boardExists ? `${JSON.stringify(currentBoard, null, 2)}\n` : '';
  const updated = !conflict && (!boardExists || beforeSerialized !== serialized);

  if (!dryRun && updated) {
    mkdirSync(dirname(boardAbsolutePath), { recursive: true });
    writeFileSync(boardAbsolutePath, serialized, 'utf8');
  }

  const nextAction = conflict
    ? `npx --yes pumuki sdd state-sync --scenario-id=${scenarioId} --status=${desiredStatus} --from-evidence=${fromEvidenceRelativePath} --board-path=${boardRelativePath} --force --json`
    : null;
  const decision = conflict
    ? {
        allowed: false,
        code: 'STATE_SYNC_CONFLICT' as const,
        message: `Scenario "${scenarioId}" has conflicting state in board artifact (${previousEntry?.status} -> ${desiredStatus}).`,
        nextAction,
      }
    : dryRun
      ? {
          allowed: true,
          code: 'STATE_SYNC_DRY_RUN' as const,
          message: updated
            ? `Dry-run ready: scenario "${scenarioId}" would sync to "${desiredStatus}".`
            : `Dry-run: scenario "${scenarioId}" already synchronized.`,
          nextAction: null,
        }
      : {
          allowed: true,
          code: 'STATE_SYNC_APPLIED' as const,
          message: updated
            ? `Scenario "${scenarioId}" synchronized as "${desiredStatus}".`
            : `Scenario "${scenarioId}" already synchronized.`,
          nextAction: null,
        };

  return {
    command: 'pumuki sdd state-sync',
    dryRun,
    repoRoot,
    context: {
      scenarioId,
      desiredStatus,
      force,
      fromEvidencePath: fromEvidenceRelativePath,
      boardPath: boardRelativePath,
    },
    sourceEvidence: {
      path: fromEvidenceAbsolutePath,
      digest: sourceEvidence.digest,
      generatedAt: sourceEvidence.generatedAt,
      scenarioId: sourceEvidence.scenarioId,
      testStatus: sourceEvidence.testStatus,
    },
    board: {
      path: boardRelativePath,
      exists: boardExists,
      updated,
      conflict,
      written: !dryRun && updated,
      previousStatus: previousEntry?.status ?? null,
      nextStatus: desiredStatus,
      entries: artifact.scenarios.length,
    },
    decision,
    artifact,
  };
};
