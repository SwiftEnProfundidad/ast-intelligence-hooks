export type Severity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export const severityRank: Record<Severity, number> = {
  INFO: 10,
  WARN: 20,
  ERROR: 30,
  CRITICAL: 40,
};

export function isSeverityAtLeast(a: Severity, b: Severity): boolean {
  return severityRank[a] >= severityRank[b];
}
