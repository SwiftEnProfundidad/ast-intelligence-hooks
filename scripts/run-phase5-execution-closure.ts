import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  buildPhase5ExecutionClosureCommands,
  buildPhase5ExecutionClosureRunReportMarkdown,
  resolvePhase5ExecutionClosureOutputs,
} from './phase5-execution-closure-lib';
import {
  buildPhase5ExecutionClosureDryRunPlan,
  executePhase5ExecutionClosureCommands,
  parsePhase5ExecutionClosureArgs,
} from './phase5-execution-closure-runner-lib';

const main = (): number => {
  const options = parsePhase5ExecutionClosureArgs(process.argv.slice(2));

  const commands = buildPhase5ExecutionClosureCommands({
    repo: options.repo,
    limit: options.limit,
    outDir: options.outDir,
    runWorkflowLint: options.runWorkflowLint,
    includeAuthPreflight: options.includeAuthPreflight,
    repoPath: options.repoPath,
    actionlintBin: options.actionlintBin,
    includeAdapter: options.includeAdapter,
    requireAdapterReadiness: options.requireAdapterReadiness,
    useMockConsumerTriage: options.useMockConsumerTriage,
  });

  if (options.dryRun) {
    process.stdout.write(buildPhase5ExecutionClosureDryRunPlan(commands));
    return 0;
  }

  const executions = executePhase5ExecutionClosureCommands(commands);

  const outputs = resolvePhase5ExecutionClosureOutputs(options.outDir);
  const report = buildPhase5ExecutionClosureRunReportMarkdown({
    generatedAt: new Date().toISOString(),
    repo: options.repo,
    options: {
      outDir: options.outDir,
      limit: options.limit,
      runWorkflowLint: options.runWorkflowLint,
      includeAuthPreflight: options.includeAuthPreflight,
      includeAdapter: options.includeAdapter,
      requireAdapterReadiness: options.requireAdapterReadiness,
      useMockConsumerTriage: options.useMockConsumerTriage,
      repoPathProvided: Boolean(options.repoPath?.trim()),
      actionlintBinProvided: Boolean(options.actionlintBin?.trim()),
    },
    commands,
    executions,
  });

  const reportPath = resolve(process.cwd(), outputs.closureRunReport);
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, report, 'utf8');
  process.stdout.write(`phase5 execution closure run report generated at ${reportPath}\n`);

  const requiredFailures = executions.filter(
    (entry) => entry.command.required && !entry.ok
  );
  return requiredFailures.length === 0 ? 0 : 1;
};

try {
  process.exit(main());
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`phase5 execution closure run failed: ${message}\n`);
  process.exit(1);
}
