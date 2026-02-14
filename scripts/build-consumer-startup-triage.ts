import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseBuildConsumerStartupTriageArgs } from './build-consumer-startup-triage-args-lib';
import {
  executeConsumerStartupTriageCommands,
  renderConsumerStartupTriageDryRunPlan,
} from './build-consumer-startup-triage-runner-lib';
import {
  buildConsumerStartupTriageCommands,
  buildConsumerStartupTriageReportMarkdown,
  resolveConsumerStartupTriageOutputs,
} from './consumer-startup-triage-lib';

const main = (): number => {
  const options = parseBuildConsumerStartupTriageArgs(process.argv.slice(2));
  const commands = buildConsumerStartupTriageCommands({
    repo: options.repo,
    limit: options.limit,
    outDir: options.outDir,
    runWorkflowLint: options.runWorkflowLint,
    includeAuthCheck: options.includeAuthCheck,
    repoPath: options.repoPath,
    actionlintBin: options.actionlintBin,
  });

  if (options.dryRun) {
    process.stdout.write(renderConsumerStartupTriageDryRunPlan(commands));
    return 0;
  }

  const executions = executeConsumerStartupTriageCommands(commands);
  const outputs = resolveConsumerStartupTriageOutputs(options.outDir);
  const report = buildConsumerStartupTriageReportMarkdown({
    generatedAt: new Date().toISOString(),
    repo: options.repo,
    outDir: options.outDir,
    commands,
    executions,
  });

  const reportPath = resolve(process.cwd(), outputs.triageReport);
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, report, 'utf8');
  process.stdout.write(`consumer startup triage report generated at ${reportPath}\n`);

  const requiredFailures = executions.filter(
    (execution) => execution.command.required && !execution.ok
  );
  return requiredFailures.length === 0 ? 0 : 1;
};

try {
  process.exit(main());
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`consumer startup triage failed: ${message}\n`);
  process.exit(1);
}
