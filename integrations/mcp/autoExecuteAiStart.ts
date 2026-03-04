import { evaluateAiGate, type AiGateStage, type AiGateViolation } from '../gate/evaluateAiGate';

type AutoExecuteAction = 'proceed' | 'ask';

type AutoExecuteNextAction = {
  kind: 'info' | 'run_command';
  message: string;
  command?: string;
};

const isEvidenceCode = (code: string): boolean =>
  code === 'EVIDENCE_MISSING' || code === 'EVIDENCE_INVALID' || code === 'EVIDENCE_STALE';

const confidenceFromViolation = (violationCode: string | null): number => {
  if (!violationCode) {
    return 90;
  }
  if (isEvidenceCode(violationCode)) {
    return 65;
  }
  if (violationCode === 'GITFLOW_PROTECTED_BRANCH') {
    return 40;
  }
  return 50;
};

const nextActionFromViolation = (violation: AiGateViolation | undefined): AutoExecuteNextAction => {
  if (!violation) {
    return {
      kind: 'info',
      message: 'Gate listo. Puedes continuar con implementación.',
    };
  }
  switch (violation.code) {
    case 'EVIDENCE_MISSING':
    case 'EVIDENCE_INVALID':
    case 'EVIDENCE_STALE':
      return {
        kind: 'run_command',
        message: 'Refresca evidencia y vuelve a evaluar PRE_WRITE.',
        command: 'npx --yes --package pumuki@latest pumuki sdd validate --stage=PRE_WRITE --json',
      };
    case 'GITFLOW_PROTECTED_BRANCH':
      return {
        kind: 'run_command',
        message: 'Cambia a una rama feature/* antes de continuar.',
        command: 'git checkout -b feature/<descripcion-kebab-case>',
      };
    default:
      return {
        kind: 'info',
        message: 'Corrige la violación bloqueante y vuelve a ejecutar auto_execute_ai_start.',
      };
  }
};

export type EnterpriseAutoExecuteAiStartResult = {
  tool: 'auto_execute_ai_start';
  dryRun: true;
  executed: true;
  success: boolean;
  result: {
    action: AutoExecuteAction;
    confidence_pct: number;
    reason_code: string;
    next_action: AutoExecuteNextAction;
    gate: {
      stage: ReturnType<typeof evaluateAiGate>['stage'];
      status: ReturnType<typeof evaluateAiGate>['status'];
      allowed: ReturnType<typeof evaluateAiGate>['allowed'];
      violations_count: number;
    };
  };
};

export const runEnterpriseAutoExecuteAiStart = (params: {
  repoRoot: string;
  stage?: AiGateStage;
  requireMcpReceipt?: boolean;
}): EnterpriseAutoExecuteAiStartResult => {
  const stage = params.stage ?? 'PRE_WRITE';
  const evaluation = evaluateAiGate({
    repoRoot: params.repoRoot,
    stage,
    requireMcpReceipt: params.requireMcpReceipt ?? false,
  });
  const firstViolation = evaluation.violations[0];
  const reasonCode = firstViolation?.code ?? 'READY';
  const action: AutoExecuteAction = evaluation.allowed ? 'proceed' : 'ask';
  const confidencePct = confidenceFromViolation(firstViolation?.code ?? null);
  const nextAction = evaluation.allowed
    ? {
      kind: 'info' as const,
      message: 'Gate en verde. Continúa con la implementación.',
    }
    : nextActionFromViolation(firstViolation);

  return {
    tool: 'auto_execute_ai_start',
    dryRun: true,
    executed: true,
    success: true,
    result: {
      action,
      confidence_pct: confidencePct,
      reason_code: reasonCode,
      next_action: nextAction,
      gate: {
        stage: evaluation.stage,
        status: evaluation.status,
        allowed: evaluation.allowed,
        violations_count: evaluation.violations.length,
      },
    },
  };
};
