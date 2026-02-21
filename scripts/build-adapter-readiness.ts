import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  parseAdapterReadinessArgs,
  readAdapterReadinessInput,
} from './adapter-readiness-cli-lib';
import {
  buildAdapterReadinessMarkdown,
  parseAdapterReport,
  summarizeAdapterReadiness,
} from './adapter-readiness-lib';

const main = (): number => {
  const cwd = process.cwd();
  const options = parseAdapterReadinessArgs(process.argv.slice(2));
  const adapterReport = readAdapterReadinessInput(cwd, options.adapterReportFile);

  const parsedAdapter = adapterReport.content
    ? parseAdapterReport(adapterReport.content)
    : undefined;

  const summary = summarizeAdapterReadiness({
    hasAdapterReport: adapterReport.exists,
    adapter: parsedAdapter,
  });

  const markdown = buildAdapterReadinessMarkdown({
    generatedAt: new Date().toISOString(),
    adapterReportPath: options.adapterReportFile,
    hasAdapterReport: adapterReport.exists,
    summary,
  });

  const outputPath = resolve(cwd, options.outFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, markdown, 'utf8');

  process.stdout.write(
    `adapter readiness report generated at ${outputPath} (verdict=${summary.verdict})\n`
  );

  return summary.verdict === 'READY' ? 0 : 1;
};

try {
  process.exitCode = main();
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`adapter readiness generation failed: ${message}\n`);
  process.exitCode = 1;
}
