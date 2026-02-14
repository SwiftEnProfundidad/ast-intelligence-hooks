import type { ParsedAdapterReport } from './adapter-readiness-contract';

export const parseAdapterReport = (markdown: string): ParsedAdapterReport => {
  const validationRaw = markdown
    .match(/- Validation result:\s*([^\n]+)/)?.[1]
    ?.trim()
    .toUpperCase();

  const validationResult =
    validationRaw === 'PASS' || validationRaw === 'FAIL'
      ? (validationRaw as 'PASS' | 'FAIL')
      : undefined;

  const runtimeNodeRaw = markdown
    .match(/- Any `bash: node: command not found`:\s*([^\n]+)/)?.[1]
    ?.trim()
    .toUpperCase();

  const nodeCommandNotFound =
    runtimeNodeRaw === 'YES'
      ? true
      : runtimeNodeRaw === 'NO'
        ? false
        : /node:\s*command not found/i.test(markdown);

  return {
    validationResult,
    nodeCommandNotFound,
  };
};
