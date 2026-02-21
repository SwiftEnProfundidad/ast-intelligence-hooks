import { parsePhase5ExecutionClosureStatusArgs } from './phase5-execution-closure-status-cli-lib';
import { buildPhase5ExecutionClosureStatusResult } from './build-phase5-execution-closure-status-runner-lib';
import {
  printPhase5ExecutionClosureStatusGenerated,
  writePhase5ExecutionClosureStatusReport,
} from './build-phase5-execution-closure-status-output-lib';

const main = (): number => {
  const cwd = process.cwd();
  const options = parsePhase5ExecutionClosureStatusArgs(process.argv.slice(2));
  const result = buildPhase5ExecutionClosureStatusResult({
    cwd,
    options,
    generatedAt: new Date().toISOString(),
  });
  const outputPath = writePhase5ExecutionClosureStatusReport({
    cwd,
    outFile: options.outFile,
    markdown: result.markdown,
  });
  printPhase5ExecutionClosureStatusGenerated({
    outputPath,
    verdict: result.summary.verdict,
  });

  return result.summary.verdict === 'READY' ? 0 : 1;
};

try {
  process.exitCode = main();
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`phase5 execution closure status failed: ${message}\n`);
  process.exitCode = 1;
}
