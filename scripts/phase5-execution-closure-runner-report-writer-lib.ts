import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export const writePhase5ExecutionClosureRunReport = (params: {
  outputPath: string;
  reportMarkdown: string;
}): string => {
  const reportPath = resolve(process.cwd(), params.outputPath);
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, params.reportMarkdown, 'utf8');
  return reportPath;
};
