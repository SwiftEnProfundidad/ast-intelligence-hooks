import { evaluateAiGate, type AiGateStage, type AiGateViolation } from '../gate/evaluateAiGate';
import { collectWorktreeAtomicSlices } from '../git/worktreeAtomicSlices';
import { getCurrentPumukiVersion } from '../lifecycle/packageInfo';
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

const buildPinnedPumukiNpxCommand = (params: {
  repoRoot: string;
  executableAndArgs: string;
}): string =>
  `npx --yes --package pumuki@${getCurrentPumukiVersion({ repoRoot: params.repoRoot })} ${params.executableAndArgs}`;

const nextActionFromViolation = (
  violation: AiGateViolation | undefined,
  repoRoot: string
): AutoExecuteNextAction => {
  if (!violation) {
    return {
      kind: 'info',
      message: 'Gate listo. Puedes continuar con implementación.',
    };
  }
  switch (violation.code) {
    case 'EVIDENCE_MISSING':
    case 'EVIDENCE_INVALID':
    case 'EVIDENCE_CHAIN_INVALID':
    case 'EVIDENCE_STALE':
      return {
        kind: 'run_command',
        message: 'Regenera o refresca evidencia y vuelve a evaluar PRE_WRITE.',
        command: buildPinnedPumukiNpxCommand({
          repoRoot,
          executableAndArgs: 'pumuki sdd validate --stage=PRE_WRITE --json',
        }),
      };
    case 'EVIDENCE_ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES':
      return {
        kind: 'run_command',
        message:
          'No hay active_rule_ids para plataforma de código detectada. Reconciliación strict de policy/skills y revalidación PRE_WRITE.',
        command:
          `${buildPinnedPumukiNpxCommand({
            repoRoot,
            executableAndArgs: 'pumuki policy reconcile --strict --json',
          })} && ${buildPinnedPumukiNpxCommand({
            repoRoot,
            executableAndArgs: 'pumuki sdd validate --stage=PRE_WRITE --json',
          })}`,
      };
    case 'EVIDENCE_PLATFORM_SKILLS_SCOPE_INCOMPLETE':
    case 'EVIDENCE_PLATFORM_SKILLS_BUNDLES_MISSING':
    case 'EVIDENCE_SKILLS_CONTRACT_INCOMPLETE':
      return {
        kind: 'run_command',
        message:
          'Completa cobertura de skills por plataforma (prefijos + bundles) y revalida PRE_WRITE.',
        command: buildPinnedPumukiNpxCommand({
          repoRoot,
          executableAndArgs: 'pumuki sdd validate --stage=PRE_WRITE --json',
        }),
      };
    case 'EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING':
    case 'EVIDENCE_CROSS_PLATFORM_CRITICAL_ENFORCEMENT_INCOMPLETE':
      return {
        kind: 'run_command',
        message:
          'Reconcilia policy/skills en modo estricto (incluida skills.ios.critical-test-quality cuando aplique) y revalida PRE_WRITE.',
        command:
          `${buildPinnedPumukiNpxCommand({
            repoRoot,
            executableAndArgs: 'pumuki policy reconcile --strict --json',
          })} && ${buildPinnedPumukiNpxCommand({
            repoRoot,
            executableAndArgs: 'pumuki sdd validate --stage=PRE_WRITE --json',
          })}`,
      };
    case 'EVIDENCE_PREWRITE_WORKTREE_OVER_LIMIT':
    case 'EVIDENCE_PREWRITE_WORKTREE_WARN':
      {
        const plan = collectWorktreeAtomicSlices({
          repoRoot,
          maxSlices: 3,
          maxFilesPerSlice: 4,
        });
        if (plan.slices.length > 0) {
          const firstSlice = plan.slices[0];
          return {
            kind: 'run_command',
            message:
              `Particiona el worktree en slices atómicos por scope. Primer lote sugerido: ${firstSlice?.scope ?? 'scope-desconocido'}.`,
            command:
              `${firstSlice?.staged_command ?? 'git add -p'} && ${buildPinnedPumukiNpxCommand({
                repoRoot,
                executableAndArgs: 'pumuki sdd validate --stage=PRE_WRITE --json',
              })}`,
          };
        }
      }
      return {
        kind: 'run_command',
        message:
          'Particiona el worktree en slices atómicos y revalida PRE_WRITE para continuar sin fricción.',
        command:
          `git status --short && git add -p && ${buildPinnedPumukiNpxCommand({
            repoRoot,
            executableAndArgs: 'pumuki sdd validate --stage=PRE_WRITE --json',
          })}`,
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
  const nextAction = evaluation.allowed
    ? {
      kind: 'info' as const,
      message: 'Gate en verde. Continúa con la implementación.',
    }
    : nextActionFromViolation(firstViolation, params.repoRoot);

  let message = toHumanMessage({
    action,
    confidencePct,
    reasonCode,
  });
  let instruction = nextAction.message;
  if (learningContext?.recommended_actions[0]) {
    message = `${message} Learning: ${learningContext.recommended_actions[0]}`;
    instruction = `${instruction} Learning: ${learningContext.recommended_actions[0]}`;
  }
  const force = action === 'ask';

  return {
    tool: 'auto_execute_ai_start',
    dryRun: true,
    executed: true,
    success: evaluation.allowed,
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
