import type { AiGateStage } from '../gate/evaluateAiGate';
import { resolveGovernanceCatalogAction } from '../gate/governanceActionCatalog';
import type { GovernanceObservationSnapshot } from './governanceObservationSnapshot';
import { writeInfo } from './cliOutputs';

export type GovernanceNextActionSummary = {
  stage: AiGateStage;
  phase: 'GREEN' | 'RED';
  action: 'proceed' | 'info' | 'run_command';
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

const POLICY_ATTENTION_CODE_BY_STAGE: Record<AiGateStage, string> = {
  PRE_WRITE: 'POLICY_PRE_WRITE_NOT_STRICT',
  PRE_COMMIT: 'POLICY_PRE_COMMIT_NOT_STRICT',
  PRE_PUSH: 'POLICY_PRE_PUSH_NOT_STRICT',
  CI: 'POLICY_CI_NOT_STRICT',
};

const resolveBlockedAction = (
  snapshot: GovernanceObservationSnapshot,
  stage: AiGateStage
): GovernanceNextActionSummary => {
  const buildAttentionAction = (params: {
    confidencePct: number;
    catalogCode: string;
    message: string;
  }): GovernanceNextActionSummary => {
    const catalogAction = resolveGovernanceCatalogAction({ code: params.catalogCode, stage });
    return {
      stage,
      phase: 'RED',
      action: catalogAction.next_action.kind,
      confidence_pct: params.confidencePct,
      ...catalogAction,
      message: params.message,
    };
  };
  if (snapshot.attention_codes.includes('EVIDENCE_INVALID_OR_CHAIN')) {
    return buildAttentionAction({
      confidencePct: 80,
      catalogCode: 'EVIDENCE_INVALID_OR_CHAIN',
      message: 'La evidencia actual no es fiable; detén la ejecución automática hasta regenerarla.',
    });
  }
  if (
    snapshot.attention_codes.includes('AI_GATE_BLOCKED')
    || snapshot.attention_codes.includes('EVIDENCE_SNAPSHOT_BLOCK')
  ) {
    return buildAttentionAction({
      confidencePct: 75,
      catalogCode: 'AI_GATE_BLOCKED',
      message: 'El gate efectivo sigue bloqueado; Pumuki no debe marcar verde ni dejar continuar.',
    });
  }
  if (snapshot.attention_codes.includes('SDD_SESSION_INVALID_OR_EXPIRED')) {
    return buildAttentionAction({
      confidencePct: 70,
      catalogCode: 'SDD_SESSION_INVALID_OR_EXPIRED',
      message: 'Hay una sesión SDD activa pero inválida; eso rompe el loop documental esperado.',
    });
  }
  if (snapshot.attention_codes.includes('GITFLOW_PROTECTED_BRANCH_CONTEXT')) {
    return buildAttentionAction({
      confidencePct: 65,
      catalogCode: 'GITFLOW_PROTECTED_BRANCH_CONTEXT',
      message: 'El contexto actual cae sobre una rama protegida; el flujo enterprise no debe continuar ahí.',
    });
  }
  if (
    snapshot.attention_codes.includes(POLICY_ATTENTION_CODE_BY_STAGE[stage])
    || snapshot.enterprise_warn_as_block_env
  ) {
    return buildAttentionAction({
      confidencePct: 60,
      catalogCode: 'POLICY_STAGE_NOT_STRICT',
      message: 'La política efectiva todavía no es estricta en todos los stages requeridos.',
    });
  }
  if (!snapshot.contract_surface.skills_lock_json || !snapshot.contract_surface.skills_sources_json) {
    return buildAttentionAction({
      confidencePct: 55,
      catalogCode: 'SKILLS_CONTRACT_SURFACE_INCOMPLETE',
      message: 'El contrato de skills todavía no está completamente materializado en el repo.',
    });
  }
  if (!snapshot.contract_surface.pumuki_adapter_json) {
    return buildAttentionAction({
      confidencePct: 50,
      catalogCode: 'ADAPTER_WIRING_MISSING',
      message: 'La línea base Git puede operar, pero el wiring adaptador aún no está materializado.',
    });
  }
  if (snapshot.attention_codes.includes('EVIDENCE_SNAPSHOT_WARN')) {
    return buildAttentionAction({
      confidencePct: 50,
      catalogCode: 'EVIDENCE_SNAPSHOT_WARN',
      message: 'La evidencia está en WARN; no conviene tratar el repo como completamente verde.',
    });
  }
  return buildAttentionAction({
    confidencePct: 40,
    catalogCode: 'GOVERNANCE_ATTENTION',
    message: 'Todavía hay señales de governance no resueltas.',
  });
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
