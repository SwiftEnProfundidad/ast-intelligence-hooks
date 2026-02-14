import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export const writePhase5ExecutionClosureStatusReport = (params: {
  cwd: string;
  outFile: string;
  markdown: string;
}): string => {
  const outputPath = resolve(params.cwd, params.outFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, params.markdown, 'utf8');
  return outputPath;
};

export const printPhase5ExecutionClosureStatusGenerated = (params: {
  outputPath: string;
  verdict: string;
}): void => {
  process.stdout.write(
    `phase5 execution closure status generated at ${params.outputPath} (verdict=${params.verdict})\n`
  );
};
