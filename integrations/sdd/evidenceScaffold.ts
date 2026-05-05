import { createHash, randomUUID } from 'node:crypto';
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path';
import { readEvidenceResult, type EvidenceReadResult } from '../evidence/readEvidence';

export type SddEvidenceScaffoldTestStatus = 'passed' | 'failed';

export type SddEvidenceScaffoldResult = {
  command: 'pumuki sdd evidence';
  dryRun: boolean;
  repoRoot: string;
  context: {
    scenarioId: string;
    testCommand: string;
    testStatus: SddEvidenceScaffoldTestStatus;
    testOutputPath: string | null;
    fromEvidencePath: string | null;
  };
  output: {
    path: string;
    written: boolean;
    digest: string;
  };
  artifact: {
    version: '1';
    generated_at: string;
    slices: Array<{
      id: string;
      scenario_ref: string;
      baseline: {
        status: 'passed';
        timestamp: string;
        test_ref: string;
      };
      red: {
        status: 'failed';
        timestamp: string;
      };
      green: {
        status: SddEvidenceScaffoldTestStatus;
        timestamp: string;
      };
      refactor: {
        status: SddEvidenceScaffoldTestStatus;
        timestamp: string;
      };
    }>;
    metadata: {
      source: 'pumuki-sdd-evidence';
      stack: 'sdd-evidence-scaffold';
    };
    // Legacy fields kept for state-sync compatibility in existing consumers.
    scenario_id: string;
    test_run: {
      command: string;
      status: SddEvidenceScaffoldTestStatus;
      output_path: string | null;
      executed_at: string;
    };
    ai_evidence: {
      source: 'local-file';
      path: string;
      digest: string;
      generated_at: string | null;
      status: 'valid';
    };
  };
};

type SddEvidenceArtifact = SddEvidenceScaffoldResult['artifact'];

const LOCK_WAIT_BUFFER_BYTES = 4;
const EVIDENCE_ARTIFACT_LOCK_TIMEOUT_MS = 5000;
const EVIDENCE_ARTIFACT_LOCK_RETRY_DELAY_MS = 25;

const computeDigest = (value: string): string =>
  `sha256:${createHash('sha256').update(value, 'utf8').digest('hex')}`;

const sleepSync = (milliseconds: number): void => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(LOCK_WAIT_BUFFER_BYTES)), 0, 0, milliseconds);
};

const acquireFileLock = (lockPath: string): (() => void) => {
  const startedAt = Date.now();
  mkdirSync(dirname(lockPath), { recursive: true });
  while (true) {
    try {
      const fd = openSync(lockPath, 'wx');
      writeFileSync(fd, `${process.pid}:${new Date().toISOString()}\n`, 'utf8');
      return () => {
        closeSync(fd);
        rmSync(lockPath, { force: true });
      };
    } catch (error) {
      const code = error instanceof Error && 'code' in error
        ? String((error as NodeJS.ErrnoException).code)
        : '';
      if (code !== 'EEXIST') {
        throw error;
      }
      if (Date.now() - startedAt > EVIDENCE_ARTIFACT_LOCK_TIMEOUT_MS) {
        throw new Error(
          `[pumuki][sdd] evidence artifact is locked by another process: ${lockPath}. Retry when the current evidence write finishes.`
        );
      }
      sleepSync(EVIDENCE_ARTIFACT_LOCK_RETRY_DELAY_MS);
    }
  }
};

const readExistingSddEvidenceArtifact = (path: string): SddEvidenceArtifact | null => {
  if (!existsSync(path)) {
    return null;
  }
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as Partial<SddEvidenceArtifact>;
  if (parsed.version !== '1' || !Array.isArray(parsed.slices)) {
    return null;
  }
  return parsed as SddEvidenceArtifact;
};

const mergeSddEvidenceArtifacts = (params: {
  existing: SddEvidenceArtifact | null;
  next: SddEvidenceArtifact;
}): SddEvidenceArtifact => {
  if (!params.existing) {
    return params.next;
  }
  const slices = params.existing.slices.filter(
    (slice) => !params.next.slices.some((nextSlice) => nextSlice.id === slice.id)
  );
  return {
    ...params.next,
    slices: [...slices, ...params.next.slices],
  };
};

const writeSddEvidenceArtifactAtomically = (params: {
  outputPath: string;
  artifact: SddEvidenceArtifact;
}): {
  artifact: SddEvidenceArtifact;
  serialized: string;
} => {
  const lockPath = `${params.outputPath}.lock`;
  const release = acquireFileLock(lockPath);
  const tempPath = `${params.outputPath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    const artifact = mergeSddEvidenceArtifacts({
      existing: readExistingSddEvidenceArtifact(params.outputPath),
      next: params.artifact,
    });
    const serialized = `${JSON.stringify(artifact, null, 2)}\n`;
    writeFileSync(tempPath, serialized, 'utf8');
    renameSync(tempPath, params.outputPath);
    return { artifact, serialized };
  } finally {
    rmSync(tempPath, { force: true });
    release();
  }
};

const resolveRepoBoundPath = (params: {
  repoRoot: string;
  candidatePath: string;
  flagName: '--from-evidence' | '--test-output';
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
    const remediation =
      params.flagName === '--test-output'
        ? ` Try "${params.flagName}=.pumuki/runtime/${basename(params.candidatePath) || 'test-output.log'}".`
        : '';
    throw new Error(
      `[pumuki][sdd] ${params.flagName} must resolve inside repository root: ${params.candidatePath}.${remediation}`
    );
  }
  return resolved;
};

const isPlaceholderToken = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();
  return (
    normalized === 'todo' ||
    normalized === 'tbd' ||
    normalized === 'unknown' ||
    normalized === 'undefined' ||
    normalized === 'none' ||
    normalized === 'n/a' ||
    normalized === 'na' ||
    normalized === 'placeholder'
  );
};

const normalizeRequired = (value: string | undefined, flagName: string): string => {
  const normalized = value?.trim() ?? '';
  if (normalized.length === 0) {
    throw new Error(`[pumuki][sdd] evidence requires ${flagName}.`);
  }
  if (isPlaceholderToken(normalized)) {
    throw new Error(`[pumuki][sdd] evidence ${flagName} must not be a placeholder value.`);
  }
  return normalized;
};

const ensureValidEvidence = (params: {
  evidenceResult: EvidenceReadResult;
  fromEvidencePath: string | null;
}): Extract<EvidenceReadResult, { kind: 'valid' }> => {
  if (params.evidenceResult.kind === 'valid') {
    return params.evidenceResult;
  }
  if (params.evidenceResult.kind === 'missing') {
    throw new Error(
      `[pumuki][sdd] evidence requires a valid .ai_evidence.json before scaffolding. Run "pumuki sdd validate --stage=PRE_WRITE --json" and retry${params.fromEvidencePath ? ` (--from-evidence=${params.fromEvidencePath})` : ''}.`
    );
  }
  throw new Error(
    `[pumuki][sdd] evidence source is invalid (${params.evidenceResult.reason}). Run "pumuki sdd validate --stage=PRE_WRITE --json" to regenerate a valid evidence baseline before scaffolding.`
  );
};

const resolveScenarioReference = (scenarioId: string): string => {
  const normalized = scenarioId.trim();
  if (normalized.includes('.feature')) {
    return normalized;
  }
  return `${normalized}.feature`;
};

export const runSddEvidenceScaffold = (params?: {
  repoRoot?: string;
  dryRun?: boolean;
  scenarioId?: string;
  testCommand?: string;
  testStatus?: SddEvidenceScaffoldTestStatus;
  testOutputPath?: string;
  fromEvidencePath?: string;
  outputPath?: string;
  now?: () => Date;
  evidenceReader?: (repoRoot: string) => EvidenceReadResult;
}): SddEvidenceScaffoldResult => {
  const repoRoot = resolve(params?.repoRoot ?? process.cwd());
  const dryRun = params?.dryRun === true;
  const scenarioId = normalizeRequired(params?.scenarioId, '--scenario-id=<id>');
  const testCommand = normalizeRequired(params?.testCommand, '--test-command=<command>');
  const testStatus = params?.testStatus;
  if (testStatus !== 'passed' && testStatus !== 'failed') {
    throw new Error('[pumuki][sdd] evidence requires --test-status=passed|failed.');
  }

  const testOutputPath = params?.testOutputPath?.trim()
    ? params.testOutputPath.trim()
    : null;
  const testOutputAbsolutePath = testOutputPath
    ? resolveRepoBoundPath({
      repoRoot,
      candidatePath: testOutputPath,
      flagName: '--test-output',
    })
    : null;

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

  const evidenceReader =
    params?.evidenceReader ??
    ((candidateRepoRoot: string) =>
      readEvidenceResult(
        candidateRepoRoot,
        fromEvidenceAbsolutePath ? { evidencePath: fromEvidenceAbsolutePath } : undefined
      ));
  const validEvidence = ensureValidEvidence({
    evidenceResult: evidenceReader(repoRoot),
    fromEvidencePath,
  });

  const now = params?.now ?? (() => new Date());
  const generatedAt = now().toISOString();
  const defaultOutputPath = '.pumuki/artifacts/pumuki-evidence-v1.json';
  const outputPath = params?.outputPath?.trim() ? params.outputPath.trim() : defaultOutputPath;
  const outputAbsolutePath = resolveRepoBoundPath({
    repoRoot,
    candidatePath: outputPath,
    flagName: '--test-output',
  });
  const outputRelativePath = relative(repoRoot, outputAbsolutePath).split('\\').join('/');

  const artifact: SddEvidenceScaffoldResult['artifact'] = {
    version: '1',
    generated_at: generatedAt,
    slices: [
      {
        id: scenarioId,
        scenario_ref: resolveScenarioReference(scenarioId),
        baseline: {
          status: 'passed',
          timestamp: validEvidence.source_descriptor.generated_at ?? generatedAt,
          test_ref: 'pumuki sdd validate --stage=PRE_WRITE --json',
        },
        red: {
          status: 'failed',
          timestamp: generatedAt,
        },
        green: {
          status: testStatus,
          timestamp: generatedAt,
        },
        refactor: {
          status: testStatus,
          timestamp: generatedAt,
        },
      },
    ],
    metadata: {
      source: 'pumuki-sdd-evidence',
      stack: 'sdd-evidence-scaffold',
    },
    scenario_id: scenarioId,
    test_run: {
      command: testCommand,
      status: testStatus,
      output_path: testOutputAbsolutePath
        ? relative(repoRoot, testOutputAbsolutePath).split('\\').join('/')
        : null,
      executed_at: generatedAt,
    },
    ai_evidence: {
      source: validEvidence.source_descriptor.source,
      path: validEvidence.source_descriptor.path,
      digest: validEvidence.source_descriptor.digest ?? '',
      generated_at: validEvidence.source_descriptor.generated_at,
      status: 'valid',
    },
  };
  let finalArtifact = artifact;
  let serialized = `${JSON.stringify(finalArtifact, null, 2)}\n`;

  if (!dryRun) {
    mkdirSync(dirname(outputAbsolutePath), { recursive: true });
    const writeResult = writeSddEvidenceArtifactAtomically({
      outputPath: outputAbsolutePath,
      artifact,
    });
    finalArtifact = writeResult.artifact;
    serialized = writeResult.serialized;
  }
  const digest = computeDigest(serialized);

  return {
    command: 'pumuki sdd evidence',
    dryRun,
    repoRoot,
    context: {
      scenarioId,
      testCommand,
      testStatus,
      testOutputPath,
      fromEvidencePath,
    },
    output: {
      path: outputRelativePath,
      written: !dryRun,
      digest,
    },
    artifact: finalArtifact,
  };
};
