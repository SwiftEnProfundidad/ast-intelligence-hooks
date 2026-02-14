import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseConsumerWorkflowLintArgs } from './consumer-workflow-lint-args-lib';
import { buildConsumerWorkflowLintMarkdown } from './consumer-workflow-lint-markdown-lib';
import {
  assertConsumerWorkflowLintBinary,
  runConsumerWorkflowLint,
} from './consumer-workflow-lint-runner-lib';

const main = (): number => {
  const options = parseConsumerWorkflowLintArgs(process.argv.slice(2));
  assertConsumerWorkflowLintBinary(options.actionlintBin, process.cwd());

  const lintResult = runConsumerWorkflowLint(options);
  const report = buildConsumerWorkflowLintMarkdown({
    options,
    lintResult,
  });

  const outPath = resolve(process.cwd(), options.outFile);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, report, 'utf8');

  process.stdout.write(`consumer workflow lint report generated at ${outPath}\n`);

  return lintResult.exitCode === 0 ? 0 : 1;
};

process.exitCode = main();
