import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parsePhase5ExternalHandoffArgs } from './build-phase5-external-handoff-args-lib';
import type { Phase5ExternalHandoffCliOptions } from './build-phase5-external-handoff-contract';
import {
  loadPhase5ExternalHandoffInputs,
  resolvePhase5ExternalHandoffVerdicts,
} from './build-phase5-external-handoff-inputs-lib';
import {
  buildPhase5ExternalHandoffMarkdown,
  summarizePhase5ExternalHandoff,
} from './phase5-external-handoff-lib';
const main = (): number => {
  const options: Phase5ExternalHandoffCliOptions = parsePhase5ExternalHandoffArgs(
    process.argv.slice(2)
  );
  const inputs = loadPhase5ExternalHandoffInputs(options);
  const verdicts = resolvePhase5ExternalHandoffVerdicts(inputs);

  const summary = summarizePhase5ExternalHandoff({
    hasPhase5StatusReport: inputs.phase5StatusReport.exists,
    hasPhase5BlockersReport: inputs.phase5BlockersReport.exists,
    hasConsumerUnblockReport: inputs.consumerUnblockReport.exists,
    hasMockAbReport: inputs.mockAbReport.exists,
    hasRunReport: inputs.runReport.exists,
    phase5StatusVerdict: verdicts.phase5StatusVerdict,
    phase5BlockersVerdict: verdicts.phase5BlockersVerdict,
    consumerUnblockVerdict: verdicts.consumerUnblockVerdict,
    mockAbVerdict: verdicts.mockAbVerdict,
    runReportVerdict: verdicts.runReportVerdict,
    artifactUrls: options.artifactUrls,
    requireArtifactUrls: options.requireArtifactUrls,
    requireMockAbReport: options.requireMockAbReport,
  });

  const markdown = buildPhase5ExternalHandoffMarkdown({
    generatedAt: new Date().toISOString(),
    repo: options.repo,
    phase5StatusReportPath: options.phase5StatusReportFile,
    phase5BlockersReportPath: options.phase5BlockersReportFile,
    consumerUnblockReportPath: options.consumerUnblockReportFile,
    mockAbReportPath: options.mockAbReportFile,
    runReportPath: options.runReportFile,
    hasPhase5StatusReport: inputs.phase5StatusReport.exists,
    hasPhase5BlockersReport: inputs.phase5BlockersReport.exists,
    hasConsumerUnblockReport: inputs.consumerUnblockReport.exists,
    hasMockAbReport: inputs.mockAbReport.exists,
    hasRunReport: inputs.runReport.exists,
    summary,
  });

  const outputPath = resolve(process.cwd(), options.outFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, markdown, 'utf8');

  process.stdout.write(
    `phase5 external handoff report generated at ${outputPath} (verdict=${summary.verdict})\n`
  );

  return summary.verdict === 'READY' ? 0 : 1;
};

try {
  process.exit(main());
} catch (error) {
  const message = error instanceof Error ? error.message : 'unknown error';
  process.stderr.write(`phase5 external handoff failed: ${message}\n`);
  process.exit(1);
}
