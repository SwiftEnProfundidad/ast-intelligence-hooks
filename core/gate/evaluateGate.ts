import type { Finding } from './Finding';
import type { GateOutcome } from './GateOutcome';
import type { GatePolicy } from './GatePolicy';
import { isSeverityAtLeast } from '../rules/Severity';

export function evaluateGate(
  findings: Finding[],
  policy: GatePolicy
): { outcome: GateOutcome; blocking: Finding[]; warnings: Finding[] } {
  const blocking = findings.filter((finding) =>
    isSeverityAtLeast(finding.severity, policy.blockOnOrAbove)
  );
  const warnings = findings.filter(
    (finding) =>
      !isSeverityAtLeast(finding.severity, policy.blockOnOrAbove) &&
      isSeverityAtLeast(finding.severity, policy.warnOnOrAbove)
  );

  const outcome: GateOutcome =
    blocking.length > 0 ? 'BLOCK' : warnings.length > 0 ? 'WARN' : 'PASS';

  return { outcome, blocking, warnings };
}
