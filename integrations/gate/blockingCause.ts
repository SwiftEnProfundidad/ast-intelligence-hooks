type BlockingCauseCandidate = {
  code?: string;
  message?: string;
  remediation?: string;
  severity?: string;
};

const UMBRELLA_EVIDENCE_CODES = new Set([
  'EVIDENCE_GATE_BLOCKED',
  'AI_GATE_BLOCKED',
  'GATE_BLOCKED',
]);

export const isTddBddBlockingCause = (candidate?: {
  code?: string;
  message?: string;
}): boolean => {
  const code = candidate?.code ?? '';
  const message = candidate?.message ?? '';
  return code.startsWith('TDD_BDD_') || /\bTDD_BDD_[A-Z0-9_]+\b/u.test(message);
};

export const resolvePrimaryBlockingCause = <T extends BlockingCauseCandidate>(
  candidates: ReadonlyArray<T>
): T | undefined => {
  const tddBddCause = candidates.find(isTddBddBlockingCause);
  if (tddBddCause) {
    return tddBddCause;
  }

  const specificCause = candidates.find((candidate) => {
    const code = candidate.code ?? '';
    return code.length > 0 && !UMBRELLA_EVIDENCE_CODES.has(code);
  });
  if (specificCause) {
    return specificCause;
  }

  return candidates[0];
};
