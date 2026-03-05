import { evaluateAiGate, type AiGateStage, type AiGateViolation } from '../gate/evaluateAiGate';

const ACTIONABLE_HINTS_BY_CODE: Readonly<Record<string, string>> = {
  EVIDENCE_MISSING: 'Ejecuta una auditoría (1/2/3/4) para regenerar .ai_evidence.json.',
  EVIDENCE_INVALID: 'Regenera .ai_evidence.json desde una opción de auditoría.',
  EVIDENCE_INTEGRITY_MISSING: 'Refresca evidencia para regenerar metadatos de integridad.',
  EVIDENCE_STALE: 'Refresca evidencia antes de continuar con commit/push.',
  EVIDENCE_TIMESTAMP_INVALID: 'Regenera evidencia para obtener un timestamp válido.',
  EVIDENCE_GATE_BLOCKED: 'Corrige primero las violaciones bloqueantes y vuelve a auditar.',
  EVIDENCE_REPO_ROOT_MISMATCH: 'Regenera evidencia desde este mismo repositorio.',
  EVIDENCE_BRANCH_MISMATCH: 'Regenera evidencia en la rama actual antes de continuar.',
  EVIDENCE_GATE_STATUS_INCOHERENT: 'Regenera evidencia para alinear ai_gate y severity_metrics.',
  EVIDENCE_OUTCOME_INCOHERENT: 'Regenera evidencia para alinear ai_gate y snapshot.outcome.',
  EVIDENCE_RULES_COVERAGE_MISSING: 'Ejecuta auditoría completa para recalcular rules_coverage.',
  EVIDENCE_RULES_COVERAGE_STAGE_MISMATCH: 'Reanuda auditoría en el stage correcto.',
  EVIDENCE_RULES_COVERAGE_INCOMPLETE:
    'Asegura unevaluated=0 y coverage_ratio=1 antes de continuar.',
  EVIDENCE_PLATFORM_SKILLS_SCOPE_INCOMPLETE:
    'Activa/evalúa reglas skills.<plataforma>. en la evidencia PRE_WRITE y vuelve a validar.',
  EVIDENCE_PLATFORM_SKILLS_BUNDLES_MISSING:
    'Carga los bundles de skills requeridos por plataforma detectada y regenera evidencia.',
  EVIDENCE_SKILLS_CONTRACT_INCOMPLETE:
    'Completa el contrato skills/policy para el stage solicitado y vuelve a validar.',
  EVIDENCE_PREWRITE_WORKTREE_OVER_LIMIT:
    'Reduce el worktree pendiente en slices atómicos y vuelve a ejecutar PRE_WRITE.',
  EVIDENCE_PREWRITE_WORKTREE_WARN:
    'Conviene particionar cambios ahora para evitar bloqueo tardío en commit/push.',
  EVIDENCE_UNSUPPORTED_AUTO_RULES:
    'Mapea todas las reglas AUTO a detectores AST antes de continuar.',
  EVIDENCE_TIMESTAMP_FUTURE: 'Corrige la hora del sistema y regenera evidencia.',
  GITFLOW_PROTECTED_BRANCH: 'Evita trabajo directo en ramas protegidas (usa feature/*).',
};

const buildPreFlightHints = (params: {
  stage: AiGateStage;
  status: ReturnType<typeof evaluateAiGate>['status'];
  violations: ReadonlyArray<AiGateViolation>;
  upstream: string | null;
}): ReadonlyArray<string> => {
  const hints: string[] = [];
  const emittedCodes = new Set<string>();
  for (const violation of params.violations) {
    if (emittedCodes.has(violation.code)) {
      continue;
    }
    const action = ACTIONABLE_HINTS_BY_CODE[violation.code];
    if (!action) {
      continue;
    }
    hints.push(`${violation.code}: ${action}`);
    emittedCodes.add(violation.code);
  }
  if (params.stage === 'PRE_PUSH' && !params.upstream) {
    hints.push('PRE_PUSH sin upstream: configura tracking (git push --set-upstream origin <branch>).');
  }
  if (hints.length === 0) {
    if (params.status === 'ALLOWED') {
      hints.push('Pre-flight operativo: sin bloqueos previos detectados.');
    } else {
      hints.push('Corrige la causa bloqueante y vuelve a ejecutar el pre-flight.');
    }
  }
  return hints;
};

export type EnterprisePreFlightCheckResult = {
  tool: 'pre_flight_check';
  dryRun: true;
  executed: true;
  success: boolean;
  result: {
    allowed: ReturnType<typeof evaluateAiGate>['allowed'];
    status: ReturnType<typeof evaluateAiGate>['status'];
    stage: ReturnType<typeof evaluateAiGate>['stage'];
    policy: ReturnType<typeof evaluateAiGate>['policy'];
    violations: ReturnType<typeof evaluateAiGate>['violations'];
    evidence: ReturnType<typeof evaluateAiGate>['evidence'];
    mcp_receipt: ReturnType<typeof evaluateAiGate>['mcp_receipt'];
    skills_contract: ReturnType<typeof evaluateAiGate>['skills_contract'];
    repo_state: ReturnType<typeof evaluateAiGate>['repo_state'];
    hints: ReadonlyArray<string>;
  };
};

export const runEnterprisePreFlightCheck = (params: {
  repoRoot: string;
  stage: AiGateStage;
  requireMcpReceipt?: boolean;
}): EnterprisePreFlightCheckResult => {
  const evaluation = evaluateAiGate({
    repoRoot: params.repoRoot,
    stage: params.stage,
    requireMcpReceipt: params.requireMcpReceipt ?? false,
  });

  const hints = buildPreFlightHints({
    stage: evaluation.stage,
    status: evaluation.status,
    violations: evaluation.violations,
    upstream: evaluation.repo_state.git.upstream,
  });

  return {
    tool: 'pre_flight_check',
    dryRun: true,
    executed: true,
    success: evaluation.allowed,
    result: {
      allowed: evaluation.allowed,
      status: evaluation.status,
      stage: evaluation.stage,
      policy: evaluation.policy,
      violations: evaluation.violations,
      evidence: evaluation.evidence,
      mcp_receipt: evaluation.mcp_receipt,
      skills_contract: evaluation.skills_contract,
      repo_state: evaluation.repo_state,
      hints,
    },
  };
};
