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
import {
  toPhase5ExecutionClosureCommandOptions,
  toPhase5ExecutionClosureRunReportOptions,
} from './phase5-execution-closure-runner-mappers-lib';
import { writePhase5ExecutionClosureRunReport } from './phase5-execution-closure-runner-report-writer-lib';

const main = (): number => {
  const options = parsePhase5ExecutionClosureArgs(process.argv.slice(2));

  const commands = buildPhase5ExecutionClosureCommands(
    toPhase5ExecutionClosureCommandOptions(options)
  );

  if (options.dryRun) {
    process.stdout.write(buildPhase5ExecutionClosureDryRunPlan(commands));
    return 0;
  }

  const executions = executePhase5ExecutionClosureCommands(commands);

  const outputs = resolvePhase5ExecutionClosureOutputs(options.outDir);
  const report = buildPhase5ExecutionClosureRunReportMarkdown({
    generatedAt: new Date().toISOString(),
    repo: options.repo,
    options: toPhase5ExecutionClosureRunReportOptions(options),
    commands,
    executions,
  });

  const reportPath = writePhase5ExecutionClosureRunReport({
    outputPath: outputs.closureRunReport,
    reportMarkdown: report,
  });
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
