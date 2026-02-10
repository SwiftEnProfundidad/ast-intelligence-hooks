import { parseMockConsumerAbArgs } from './mock-consumer-ab-cli-lib';
import {
  buildMockConsumerAbReportFromOptions,
  persistMockConsumerAbReport,
} from './mock-consumer-ab-runner-lib';

const main = (): number => {
  try {
    const options = parseMockConsumerAbArgs(process.argv.slice(2));
    const report = buildMockConsumerAbReportFromOptions({
      options,
      generatedAt: new Date().toISOString(),
    });

    persistMockConsumerAbReport({
      outFile: options.outFile,
      markdown: report.markdown,
      dryRun: options.dryRun,
    });

    const mode = options.dryRun ? 'dry-run' : 'write';
    console.log(
      `[build-mock-consumer-ab-report] ${mode} verdict=${report.verdict} out=${options.outFile}`
    );

    return report.verdict === 'READY' ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[build-mock-consumer-ab-report] error: ${message}`);
    return 1;
  }
};

process.exit(main());
