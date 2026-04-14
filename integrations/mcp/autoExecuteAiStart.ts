import {
  buildGovernanceValidateCommand,
  resolveGovernanceCatalogAction,
} from '../gate/governanceActionCatalog';
import { evaluateAiGate, type AiGateStage, type AiGateViolation } from '../gate/evaluateAiGate';
import { collectWorktreeAtomicSlices } from '../git/worktreeAtomicSlices';
import { resolveLearningContextExperimentalFeature } from '../policy/experimentalFeatures';
import { readSddLearningContext, type SddLearningContext } from '../sdd/learningInsights';

type AutoExecuteAction = 'proceed' | 'ask';
type AutoExecutePhase = 'GREEN' | 'RED';

type AutoExecuteNextAction = {
  kind: 'info' | 'run_command';
  message: string;
  command?: string;
};

const toAutoExecutePhase = (action: AutoExecuteAction): AutoExecutePhase =>
  action === 'proceed' ? 'GREEN' : 'RED';

const toHumanMessage = (params: {
  action: AutoExecuteAction;
  confidencePct: number;
  reasonCode: string;
}): string => {
  if (params.action === 'proceed') {
    return `Confianza alta (${params.confidencePct}%). Gate en verde: continúa con la implementación.`;
  }
  if (params.confidencePct >= 60) {
    return `Confianza media (${params.confidencePct}%) por ${params.reasonCode}. Pide confirmación y aplica la remediación sugerida.`;
  }
  return `Confianza baja (${params.confidencePct}%) por ${params.reasonCode}. Detén ejecución automática y solicita intervención del usuario.`;
};

const isEvidenceCode = (code: string): boolean =>
  code === 'EVIDENCE_MISSING'
  || code === 'EVIDENCE_INVALID'
  || code === 'EVIDENCE_CHAIN_INVALID'
  || code === 'EVIDENCE_STALE'
  || code === 'EVIDENCE_ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES'
  || code === 'EVIDENCE_SKILLS_CONTRACT_INCOMPLETE'
  || code === 'EVIDENCE_PREWRITE_WORKTREE_OVER_LIMIT'
  || code === 'EVIDENCE_PREWRITE_WORKTREE_WARN'
  || code === 'EVIDENCE_PLATFORM_SKILLS_SCOPE_INCOMPLETE'
  || code === 'EVIDENCE_PLATFORM_SKILLS_BUNDLES_MISSING'
  || code === 'EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING'
  || code === 'EVIDENCE_CROSS_PLATFORM_CRITICAL_ENFORCEMENT_INCOMPLETE';

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

const normalizeGovernanceCatalogCode = (code: string): string => {
  switch (code) {
    case 'EVIDENCE_INVALID':
    case 'EVIDENCE_CHAIN_INVALID':
      return 'EVIDENCE_INVALID_OR_CHAIN';
    case 'GITFLOW_PROTECTED_BRANCH':
      return 'GITFLOW_PROTECTED_BRANCH_CONTEXT';
    default:
      return code;
  }
};

const resolveAutoExecuteRemediation = (params: {
  violation: AiGateViolation | undefined;
  repoRoot: string;
  stage: AiGateStage;
  allowed: boolean;
}): {
  instruction: string;
  nextAction: AutoExecuteNextAction;
} => {
  if (!params.violation) {
    const readyAction = resolveGovernanceCatalogAction({
      code: 'READY',
      stage: params.stage,
    });
    return {
      instruction: readyAction.instruction,
      nextAction: readyAction.next_action,
    };
  }

  if (
    params.violation.code === 'EVIDENCE_PREWRITE_WORKTREE_OVER_LIMIT'
    || params.violation.code === 'EVIDENCE_PREWRITE_WORKTREE_WARN'
  ) {
    const validateCommand = buildGovernanceValidateCommand(params.stage);
    const plan = collectWorktreeAtomicSlices({
      repoRoot: params.repoRoot,
      maxSlices: 3,
      maxFilesPerSlice: 4,
    });
    if (plan.slices.length > 0) {
      const firstSlice = plan.slices[0];
      return {
        instruction: 'Particiona el worktree en slices atómicos antes de continuar.',
        nextAction: {
          kind: params.allowed ? 'info' : 'run_command',
          message:
            `Particiona el worktree en slices atómicos por scope. Primer lote sugerido: ${firstSlice?.scope ?? 'scope-desconocido'}.`,
          command: params.allowed
            ? undefined
            : `${firstSlice?.staged_command ?? 'git add -p'} && ${validateCommand}`,
        },
      };
    }
    return {
      instruction: 'Particiona el worktree en slices atómicos antes de continuar.',
      nextAction: {
        kind: params.allowed ? 'info' : 'run_command',
        message: 'Particiona el worktree en slices atómicos y revalida PRE_WRITE para continuar sin fricción.',
        command: params.allowed
          ? undefined
          : `git status --short && git add -p && ${validateCommand}`,
      },
    };
  }

  const governanceAction = resolveGovernanceCatalogAction({
    code: normalizeGovernanceCatalogCode(params.violation.code),
    stage: params.stage,
  });
  return {
    instruction: governanceAction.instruction,
    nextAction: params.allowed
      ? {
        kind: 'info',
        message: governanceAction.next_action.message,
      }
      : governanceAction.next_action,
  };
};

export type EnterpriseAutoExecuteAiStartResult = {
  tool: 'auto_execute_ai_start';
  dryRun: true;
  executed: true;
  success: boolean;
  result: {
    action: AutoExecuteAction;
    phase: AutoExecutePhase;
    message: string;
    instruction: string;
    platforms: {
      force: boolean;
    };
    confidence_pct: number;
    reason_code: string;
    next_action: AutoExecuteNextAction;
    learning_context: SddLearningContext | null;
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
  const learningContextFeature = resolveLearningContextExperimentalFeature();
  const learningContext = learningContextFeature.mode === 'off'
    ? null
    : readSddLearningContext({
      repoRoot: params.repoRoot,
    });
  const firstViolation = evaluation.violations[0];
  const reasonCode = firstViolation?.code ?? 'READY';
  const action: AutoExecuteAction = evaluation.allowed ? 'proceed' : 'ask';
  const phase = toAutoExecutePhase(action);
  const confidencePct = confidenceFromViolation(firstViolation?.code ?? null);
  const remediation = resolveAutoExecuteRemediation({
    violation: firstViolation,
    repoRoot: params.repoRoot,
    stage,
    allowed: evaluation.allowed,
  });
  const nextAction = remediation.nextAction;

  let message = toHumanMessage({
    action,
    confidencePct,
    reasonCode,
  });
  let instruction = remediation.instruction;
  if (learningContext?.recommended_actions[0]) {
    message = `${message} Learning: ${learningContext.recommended_actions[0]}`;
    instruction = `${instruction} Learning: ${learningContext.recommended_actions[0]}`;
  }
  const force = action === 'ask' && confidencePct < 50;

  return {
    tool: 'auto_execute_ai_start',
    dryRun: true,
    executed: true,
    success: true,
    result: {
      action,
      phase,
      message,
      instruction,
      platforms: {
        force,
      },
      confidence_pct: confidencePct,
      reason_code: reasonCode,
      next_action: nextAction,
      learning_context: learningContext,
      gate: {
        stage: evaluation.stage,
        status: evaluation.status,
        allowed: evaluation.allowed,
        violations_count: evaluation.violations.length,
      },
    },
  };
};
