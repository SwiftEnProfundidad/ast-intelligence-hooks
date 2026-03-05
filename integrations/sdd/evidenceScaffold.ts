import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
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
    version: '1.0';
    generated_at: string;
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

const computeDigest = (value: string): string =>
  `sha256:${createHash('sha256').update(value, 'utf8').digest('hex')}`;

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
    throw new Error(
      `[pumuki][sdd] ${params.flagName} must resolve inside repository root: ${params.candidatePath}`
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
    version: '1.0',
    generated_at: generatedAt,
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
  const serialized = `${JSON.stringify(artifact, null, 2)}\n`;
  const digest = computeDigest(serialized);

  if (!dryRun) {
    mkdirSync(dirname(outputAbsolutePath), { recursive: true });
    writeFileSync(outputAbsolutePath, serialized, 'utf8');
  }

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
    artifact,
  };
};
