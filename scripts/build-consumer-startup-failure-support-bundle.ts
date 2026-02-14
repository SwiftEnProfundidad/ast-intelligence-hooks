import {
  parseConsumerSupportBundleArgs,
} from './consumer-startup-failure-support-bundle-lib';
import {
  buildConsumerSupportBundleReport,
  writeConsumerSupportBundleReport,
} from './consumer-support-bundle-runner-lib';

const main = (): number => {
  const options = parseConsumerSupportBundleArgs(process.argv.slice(2));
  const markdown = buildConsumerSupportBundleReport(options);
  const outputPath = writeConsumerSupportBundleReport({
    markdown,
    outFile: options.outFile,
  });
  process.stdout.write(
    `consumer startup-failure support bundle generated at ${outputPath}\n`
  );
  return 0;
};

process.exitCode = main();
