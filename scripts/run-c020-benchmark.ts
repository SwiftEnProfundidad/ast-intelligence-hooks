import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync as runSpawnSync } from 'node:child_process';
import {
  buildLegacyParityCommandArgs,
  buildDefaultC020BenchmarkOptions,
  parseC020BenchmarkArgs,
  type C020BenchmarkOptions,
} from './c020-benchmark-lib';

type EvidenceSnapshot = {
  stage?: unknown;
  audit_mode?: unknown;
  outcome?: unknown;
  files_scanned?: unknown;
  rules_coverage?: {
    coverage_ratio?: unknown;
    counts?: {
      active?: unknown;
      evaluated?: unknown;
      unevaluated?: unknown;
    };
  };
};

type EvidencePayload = {
  snapshot?: EvidenceSnapshot;
  severity_metrics?: {
    total_violations?: unknown;
    by_enterprise_severity?: unknown;
  };
};

const asNumberOrNull = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  return value;
};

const ensureParentDir = (path: string): void => {
  mkdirSync(dirname(path), { recursive: true });
};

const writeExecutionLog = (path: string, payload: { stdout?: string; stderr?: string }): void => {
  ensureParentDir(path);
  const chunks: string[] = [];
  if (payload.stdout && payload.stdout.length > 0) {
    chunks.push(payload.stdout);
  }
  if (payload.stderr && payload.stderr.length > 0) {
    chunks.push(payload.stderr);
  }
  writeFileSync(path, chunks.join('\n'), 'utf8');
};

const runMenuAudit = (options: C020BenchmarkOptions): void => {
  const env = {
    ...process.env,
    ...(options.sddBypass ? { PUMUKI_SDD_BYPASS: '1' } : {}),
  };
  const result = runSpawnSync('node', ['bin/pumuki-framework.js'], {
    encoding: 'utf8',
    env,
    input: '1\n10\n',
  });
  writeExecutionLog(options.menuLogPath, {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  });
  if (result.error) {
    throw result.error;
  }
};

const loadEvidenceSummary = (path: string): {
  stage: string;
  auditMode: string;
  outcome: string;
  filesScanned: number | null;
  totalViolations: number | null;
  coverageRatio: number | null;
  coverageCounts: { active: number | null; evaluated: number | null; unevaluated: number | null };
} => {
  const raw = readFileSync(path, 'utf8');
  const payload = JSON.parse(raw) as EvidencePayload;
  const snapshot = payload.snapshot ?? {};
  const coverage = snapshot.rules_coverage ?? {};
  return {
    stage: typeof snapshot.stage === 'string' ? snapshot.stage : 'UNKNOWN',
    auditMode: typeof snapshot.audit_mode === 'string' ? snapshot.audit_mode : 'UNKNOWN',
    outcome: typeof snapshot.outcome === 'string' ? snapshot.outcome : 'UNKNOWN',
    filesScanned: asNumberOrNull(snapshot.files_scanned),
    totalViolations: asNumberOrNull(payload.severity_metrics?.total_violations),
    coverageRatio: asNumberOrNull(coverage.coverage_ratio),
    coverageCounts: {
      active: asNumberOrNull(coverage.counts?.active),
      evaluated: asNumberOrNull(coverage.counts?.evaluated),
      unevaluated: asNumberOrNull(coverage.counts?.unevaluated),
    },
  };
};

const runLegacyParity = (options: C020BenchmarkOptions): number => {
  const args = buildLegacyParityCommandArgs(options);
  const result = runSpawnSync('node', args, { encoding: 'utf8' });
  writeExecutionLog(options.parityLogPath, {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  });
  if (result.error) {
    throw result.error;
  }
  return result.status ?? 1;
};

const main = (): void => {
  const options = parseC020BenchmarkArgs(process.argv.slice(2), buildDefaultC020BenchmarkOptions());
  options.legacyBaselinePath = resolve(options.legacyBaselinePath);
  options.enterpriseEvidencePath = resolve(options.enterpriseEvidencePath);
  options.menuLogPath = resolve(options.menuLogPath);
  options.parityReportPath = resolve(options.parityReportPath);
  options.parityLogPath = resolve(options.parityLogPath);
  options.outputDir = resolve(options.outputDir);

  mkdirSync(options.outputDir, { recursive: true });
  runMenuAudit(options);

  const aiEvidencePath = resolve('.ai_evidence.json');
  ensureParentDir(options.enterpriseEvidencePath);
  copyFileSync(aiEvidencePath, options.enterpriseEvidencePath);

  const summary = loadEvidenceSummary(options.enterpriseEvidencePath);
  process.stdout.write(
    `[c020][benchmark] enterprise stage=${summary.stage} mode=${summary.auditMode} outcome=${summary.outcome} files_scanned=${summary.filesScanned ?? 'n/a'} total_violations=${summary.totalViolations ?? 'n/a'} coverage_ratio=${summary.coverageRatio ?? 'n/a'}\n`
  );
  process.stdout.write(
    `[c020][benchmark] coverage active=${summary.coverageCounts.active ?? 'n/a'} evaluated=${summary.coverageCounts.evaluated ?? 'n/a'} unevaluated=${summary.coverageCounts.unevaluated ?? 'n/a'}\n`
  );

  const parityExit = runLegacyParity(options);
  process.stdout.write(
    `[c020][benchmark] parity_exit=${parityExit} legacy=${options.legacyBaselinePath} report=${options.parityReportPath}\n`
  );
  process.exitCode = parityExit;
};

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  process.stderr.write(`[c020][benchmark] error: ${message}\n`);
  process.exitCode = 1;
}
