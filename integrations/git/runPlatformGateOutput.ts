import type { Finding } from '../../core/gate/Finding';

const formatFinding = (finding: Finding): string => {
  return `${finding.ruleId}: ${finding.message}`;
};

export const printGateFindings = (findings: ReadonlyArray<Finding>): void => {
  for (const finding of findings) {
    process.stdout.write(`${formatFinding(finding)}\n`);
  }
};
