import type { ParsedAdapterRealSessionReport } from './phase5-blockers-contract';

const parseAdapterValidationResult = (markdown: string): 'PASS' | 'FAIL' | undefined => {
  const validationRaw = markdown
    .match(/- Validation result:\s*([^\n]+)/)?.[1]
    ?.trim()
    .toUpperCase();

  return validationRaw === 'PASS' || validationRaw === 'FAIL'
    ? (validationRaw as 'PASS' | 'FAIL')
    : undefined;
};

const parseAdapterRetestRequired = (markdown: string): boolean | undefined => {
  const reTestRaw = markdown
    .match(/- Re-test required:\s*([^\n]+)/)?.[1]
    ?.trim()
    .toUpperCase();

  return reTestRaw === 'YES' ? true : reTestRaw === 'NO' ? false : undefined;
};

const parseNodeCommandNotFound = (markdown: string): boolean => {
  const runtimeNodeRaw = markdown
    .match(/- Any `bash: node: command not found`:\s*([^\n]+)/)?.[1]
    ?.trim()
    .toUpperCase();

  return runtimeNodeRaw === 'YES'
    ? true
    : runtimeNodeRaw === 'NO'
      ? false
      : /node:\s*command not found/i.test(markdown);
};

export const parseAdapterRealSessionReport = (
  markdown: string
): ParsedAdapterRealSessionReport => {
  return {
    validationResult: parseAdapterValidationResult(markdown),
    reTestRequired: parseAdapterRetestRequired(markdown),
    nodeCommandNotFound: parseNodeCommandNotFound(markdown),
  };
};
