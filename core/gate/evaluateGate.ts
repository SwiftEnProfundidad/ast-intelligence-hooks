import type { Finding } from './Finding';
import type { GateOutcome } from './GateOutcome';
import type { GatePolicy } from './GatePolicy';
import { isSeverityAtLeast } from '../rules/Severity';

const isBlockingFinding = (finding: Finding): boolean => finding.blocking !== false;

export function evaluateGate(
  findings: Finding[],
  policy: GatePolicy
): { outcome: GateOutcome; blocking: Finding[]; warnings: Finding[] } {
  const blocking = findings.filter(isBlockingFinding);
  const warnings = findings.filter(
    (finding) =>
      !isBlockingFinding(finding) &&
      isSeverityAtLeast(finding.severity, policy.warnOnOrAbove)
  );

  const outcome: GateOutcome =
    blocking.length > 0 ? 'BLOCK' : warnings.length > 0 ? 'WARN' : 'PASS';

  return { outcome, blocking, warnings };
}
