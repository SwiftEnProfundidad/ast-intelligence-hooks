import type { AiGateStage } from '../gate/evaluateAiGate';
import { resolveGovernanceCatalogAction } from '../gate/governanceActionCatalog';
import type { GovernanceObservationSnapshot } from './governanceObservationSnapshot';
import { writeInfo } from './cliOutputs';

export type GovernanceNextActionSummary = {
  stage: AiGateStage;
  phase: 'GREEN' | 'RED';
  action: 'proceed' | 'ask';
  confidence_pct: number;
  reason_code: string;
  instruction: string;
  message: string;
  next_action: {
    kind: 'info' | 'run_command';
    message: string;
    command?: string;
  };
};

export type GovernanceNextActionReader = (params: {
  repoRoot: string;
  stage?: AiGateStage;
  governanceObservation: GovernanceObservationSnapshot;
}) => GovernanceNextActionSummary;

const resolveBlockedAction = (
  snapshot: GovernanceObservationSnapshot,
  stage: AiGateStage
): GovernanceNextActionSummary => {
  if (snapshot.attention_codes.includes('EVIDENCE_INVALID_OR_CHAIN')) {
    return {
      stage,
      phase: 'RED',
      action: 'ask',
      confidence_pct: 80,
      ...resolveGovernanceCatalogAction({ code: 'EVIDENCE_INVALID_OR_CHAIN', stage }),
      message: 'La evidencia actual no es fiable; detén la ejecución automática hasta regenerarla.',
    };
  }
  if (
    snapshot.attention_codes.includes('AI_GATE_BLOCKED')
    || snapshot.attention_codes.includes('EVIDENCE_SNAPSHOT_BLOCK')
  ) {
    return {
      stage,
      phase: 'RED',
      action: 'ask',
      confidence_pct: 75,
      ...resolveGovernanceCatalogAction({ code: 'AI_GATE_BLOCKED', stage }),
      message: 'El gate efectivo sigue bloqueado; Pumuki no debe marcar verde ni dejar continuar.',
    };
  }
  if (snapshot.attention_codes.includes('SDD_SESSION_INVALID_OR_EXPIRED')) {
    return {
      stage,
      phase: 'RED',
      action: 'ask',
      confidence_pct: 70,
      ...resolveGovernanceCatalogAction({ code: 'SDD_SESSION_INVALID_OR_EXPIRED', stage }),
      message: 'Hay una sesión SDD activa pero inválida; eso rompe el loop documental esperado.',
    };
  }
  if (snapshot.attention_codes.includes('GITFLOW_PROTECTED_BRANCH_CONTEXT')) {
    return {
      stage,
      phase: 'RED',
      action: 'ask',
      confidence_pct: 65,
      ...resolveGovernanceCatalogAction({ code: 'GITFLOW_PROTECTED_BRANCH_CONTEXT', stage }),
      message: 'El contexto actual cae sobre una rama protegida; el flujo enterprise no debe continuar ahí.',
    };
  }
  if (
    snapshot.attention_codes.some((code) => code.startsWith('POLICY_'))
    || snapshot.enterprise_warn_as_block_env
  ) {
    return {
      stage,
      phase: 'RED',
      action: 'ask',
      confidence_pct: 60,
      ...resolveGovernanceCatalogAction({ code: 'POLICY_STAGE_NOT_STRICT', stage }),
      message: 'La política efectiva todavía no es estricta en todos los stages requeridos.',
    };
  }
  if (!snapshot.contract_surface.skills_lock_json || !snapshot.contract_surface.skills_sources_json) {
    return {
      stage,
      phase: 'RED',
      action: 'ask',
      confidence_pct: 55,
      ...resolveGovernanceCatalogAction({ code: 'SKILLS_CONTRACT_SURFACE_INCOMPLETE', stage }),
      message: 'El contrato de skills todavía no está completamente materializado en el repo.',
    };
  }
  if (!snapshot.contract_surface.pumuki_adapter_json) {
    return {
      stage,
      phase: 'RED',
      action: 'ask',
      confidence_pct: 50,
      ...resolveGovernanceCatalogAction({ code: 'ADAPTER_WIRING_MISSING', stage }),
      message: 'La línea base Git puede operar, pero el wiring adaptador aún no está materializado.',
    };
  }
  if (snapshot.attention_codes.includes('EVIDENCE_SNAPSHOT_WARN')) {
    return {
      stage,
      phase: 'RED',
      action: 'ask',
      confidence_pct: 50,
      ...resolveGovernanceCatalogAction({ code: 'EVIDENCE_SNAPSHOT_WARN', stage }),
      message: 'La evidencia está en WARN; no conviene tratar el repo como completamente verde.',
    };
  }
  return {
    stage,
    phase: 'RED',
    action: 'ask',
    confidence_pct: 40,
    ...resolveGovernanceCatalogAction({ code: 'GOVERNANCE_ATTENTION', stage }),
    message: 'Todavía hay señales de governance no resueltas.',
  };
};

export const readGovernanceNextAction: GovernanceNextActionReader = (params) => {
  const stage = params.stage ?? 'PRE_WRITE';
  const snapshot = params.governanceObservation;
  if (snapshot.governance_effective === 'green') {
    return {
      stage,
      phase: 'GREEN',
      action: 'proceed',
      confidence_pct: 90,
      ...resolveGovernanceCatalogAction({ code: 'READY', stage }),
      message: 'Governance efectiva en verde: continúa con la implementación mínima.',
    };
  }
  return resolveBlockedAction(snapshot, stage);
};

export const buildGovernanceNextActionSummaryLines = (
  snapshot: GovernanceNextActionSummary
): string[] => {
  const lines = [
    `Next action: stage=${snapshot.stage} phase=${snapshot.phase} action=${snapshot.action} confidence=${snapshot.confidence_pct}% reason=${snapshot.reason_code}`,
    `Instruction: ${snapshot.instruction}`,
    `Action detail: ${snapshot.next_action.message}`,
  ];
  if (snapshot.next_action.command) {
    lines.push(`Command: ${snapshot.next_action.command}`);
  }
  return lines;
};

export const printGovernanceNextActionHuman = (
  snapshot: GovernanceNextActionSummary
): void => {
  writeInfo('[pumuki] governance next action (S1 / governance console baseline):');
  for (const line of buildGovernanceNextActionSummaryLines(snapshot)) {
    writeInfo(`[pumuki]   ${line}`);
  }
};
