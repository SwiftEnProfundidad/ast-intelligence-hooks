import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  parseConsumerMenuMatrixBaselineArgs,
  resolveConsumerMenuMatrixBaselineOutputPaths,
} from './consumer-menu-matrix-baseline-cli-lib';
import {
  buildConsumerMenuMatrixBaselineSnapshot,
  renderConsumerMenuMatrixBaselineSummary,
} from './consumer-menu-matrix-baseline-report-lib';
import { runLifecycleDoctor, type LifecycleDoctorReport } from '../integrations/lifecycle/doctor';
import { readLifecycleStatus, type LifecycleStatus } from '../integrations/lifecycle/status';
import {
  runConsumerMenuMatrixBaseline,
  type ConsumerMenuMatrixBaselineReport,
} from './framework-menu-matrix-baseline-lib';

type ConsumerMenuMatrixBaselineBuildDeps = {
  cwd: string;
  runBaseline: (params: {
    repoRoot?: string;
    rounds?: number;
  }) => Promise<ConsumerMenuMatrixBaselineReport>;
  readStatus: (params: { cwd?: string }) => LifecycleStatus;
  runDoctor: (params: { cwd?: string; deep?: boolean }) => LifecycleDoctorReport;
  writeFile: (path: string, content: string) => void;
  ensureDir: (path: string) => void;
  writeStdout: (message: string) => void;
  writeStderr: (message: string) => void;
  now: () => string;
};

const createDefaultDeps = (): ConsumerMenuMatrixBaselineBuildDeps => {
  return {
    cwd: process.cwd(),
    runBaseline: runConsumerMenuMatrixBaseline,
    readStatus: readLifecycleStatus,
    runDoctor: runLifecycleDoctor,
    writeFile: (path, content) => {
      writeFileSync(path, content, 'utf8');
    },
    ensureDir: (path) => {
      mkdirSync(path, { recursive: true });
    },
    writeStdout: (message) => {
      process.stdout.write(message);
    },
    writeStderr: (message) => {
      process.stderr.write(message);
    },
    now: () => new Date().toISOString(),
  };
};

export const runConsumerMenuMatrixBaselineBuild = async (
  argv: ReadonlyArray<string>,
  partialDeps?: Partial<ConsumerMenuMatrixBaselineBuildDeps>
): Promise<number> => {
  const deps = {
    ...createDefaultDeps(),
    ...partialDeps,
  } as ConsumerMenuMatrixBaselineBuildDeps;
  const options = parseConsumerMenuMatrixBaselineArgs(argv, deps.cwd);
  const baseline = await deps.runBaseline({
    repoRoot: options.repoRoot,
    rounds: options.rounds,
  });
  const status = deps.readStatus({ cwd: options.repoRoot });
  const doctor = deps.runDoctor({ cwd: options.repoRoot, deep: true });
  const snapshot = buildConsumerMenuMatrixBaselineSnapshot({
    generatedAt: deps.now(),
    fixture: options.fixture,
    repoRoot: options.repoRoot,
    baseline,
    status,
    doctor,
  });
  const outputPaths = resolveConsumerMenuMatrixBaselineOutputPaths(options.outDir);
  const reportJson = `${JSON.stringify(snapshot, null, 2)}\n`;
  const summaryMarkdown = renderConsumerMenuMatrixBaselineSummary(snapshot);

  deps.ensureDir(dirname(outputPaths.reportPath));
  deps.ensureDir(dirname(outputPaths.summaryPath));
  deps.writeFile(outputPaths.reportPath, reportJson);
  deps.writeFile(outputPaths.summaryPath, summaryMarkdown);

  deps.writeStdout(
    `consumer matrix baseline generated at ${outputPaths.reportPath} and ${outputPaths.summaryPath} (fixture=${snapshot.fixture}, stable=${snapshot.stable ? 'YES' : 'NO'}, rounds=${snapshot.rounds})\n`
  );

  if (options.printJson) {
    deps.writeStdout(reportJson);
  }

  return snapshot.stable ? 0 : 1;
};

export const runConsumerMenuMatrixBaselineBuildSafe = async (
  argv: ReadonlyArray<string>,
  partialDeps?: Partial<ConsumerMenuMatrixBaselineBuildDeps>
): Promise<number> => {
  const deps = {
    ...createDefaultDeps(),
    ...partialDeps,
  } as ConsumerMenuMatrixBaselineBuildDeps;

  try {
    return await runConsumerMenuMatrixBaselineBuild(argv, deps);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    deps.writeStderr(`consumer matrix baseline generation failed: ${message}\n`);
    return 1;
  }
};
