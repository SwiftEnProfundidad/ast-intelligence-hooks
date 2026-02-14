import type { ParsedWorkflowLintReport } from './consumer-startup-unblock-contract';
import {
  dedupeConsumerStartupUnblockValues,
  parseConsumerStartupUnblockInteger,
} from './consumer-startup-unblock-contract';

export const parseWorkflowLintReport = (markdown: string): ParsedWorkflowLintReport => {
  const exitCode = parseConsumerStartupUnblockInteger(
    markdown.match(/- exit_code:\s*([0-9]+)/)?.[1]
  );

  const findings = dedupeConsumerStartupUnblockValues(
    markdown
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /\[[a-z-]+\]\s*$/.test(line))
  );

  return {
    exitCode,
    findingsCount: findings.length,
    findings,
  };
};
