import { parseConsumerStartupUnblockArgs } from './consumer-startup-unblock-cli-lib';
import {
  buildConsumerStartupUnblockReportFromOptions,
  writeConsumerStartupUnblockReport,
} from './consumer-startup-unblock-runner-lib';

const main = (): number => {
  const cwd = process.cwd();
  const options = parseConsumerStartupUnblockArgs(process.argv.slice(2));

  const report = buildConsumerStartupUnblockReportFromOptions({
    cwd,
    options,
  });

  const outputPath = writeConsumerStartupUnblockReport({
    cwd,
    outFile: options.outFile,
    markdown: report.markdown,
  });

  process.stdout.write(
    `consumer startup unblock status generated at ${outputPath} (verdict=${report.verdict})\n`
  );
  return 0;
};

try {
  process.exitCode = main();
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`consumer startup unblock status failed: ${message}\n`);
  process.exitCode = 1;
}
