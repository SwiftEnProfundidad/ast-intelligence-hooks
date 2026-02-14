import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseConsumerCiArtifactsArgs } from './collect-consumer-ci-artifacts-args-lib';
import {
  assertConsumerCiArtifactsAuth,
  loadConsumerCiRunArtifactsResults,
  loadConsumerCiWorkflowRuns,
} from './collect-consumer-ci-artifacts-gh-lib';
import { buildConsumerCiArtifactsReportMarkdown } from './collect-consumer-ci-artifacts-markdown-lib';

const main = (): number => {
  const options = parseConsumerCiArtifactsArgs(process.argv.slice(2));
  assertConsumerCiArtifactsAuth();

  const runs = loadConsumerCiWorkflowRuns(options);
  const runArtifactsResults = loadConsumerCiRunArtifactsResults(options, runs);
  const report = buildConsumerCiArtifactsReportMarkdown({
    options,
    runArtifactsResults,
    generatedAt: new Date().toISOString(),
  });

  const outputPath = resolve(process.cwd(), options.outFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, report, 'utf8');
  process.stdout.write(`consumer CI artifact report generated at ${outputPath}\n`);
  return 0;
};

process.exitCode = main();
