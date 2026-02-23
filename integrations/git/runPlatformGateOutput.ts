import type { Finding } from '../../core/gate/Finding';

const normalizeAnchorLine = (lines: Finding['lines']): number => {
  if (Array.isArray(lines)) {
    const candidates = lines
      .map((line) => Number(line))
      .filter((line) => Number.isFinite(line))
      .map((line) => Math.trunc(line))
      .filter((line) => line > 0);
    return candidates.length > 0 ? Math.min(...candidates) : 1;
  }
  if (typeof lines === 'number' && Number.isFinite(lines)) {
    const normalized = Math.trunc(lines);
    return normalized > 0 ? normalized : 1;
  }
  if (typeof lines === 'string') {
    const candidates = lines
      .match(/\d+/g)
      ?.map((token) => Number.parseInt(token, 10))
      .filter((line) => Number.isFinite(line) && line > 0);
    if (candidates && candidates.length > 0) {
      return Math.min(...candidates);
    }
  }
  return 1;
};

const formatLocation = (finding: Finding): string | null => {
  if (!finding.filePath || finding.filePath.trim().length === 0) {
    return null;
  }
  const anchorLine = normalizeAnchorLine(finding.lines);
  return `${finding.filePath.replace(/\\/g, '/')}:${anchorLine}`;
};

const formatFinding = (finding: Finding): string => {
  const location = formatLocation(finding);
  const severity = finding.severity.toUpperCase();
  if (!location) {
    return `[${severity}] ${finding.ruleId}: ${finding.message}`;
  }
  return `[${severity}] ${finding.ruleId}: ${finding.message} -> ${location}`;
};

export const printGateFindings = (findings: ReadonlyArray<Finding>): void => {
  for (const finding of findings) {
    process.stdout.write(`${formatFinding(finding)}\n`);
  }
};
