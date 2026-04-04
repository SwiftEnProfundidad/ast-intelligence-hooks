import { evaluateAiGate, type AiGateStage, type AiGateViolation } from '../gate/evaluateAiGate';
import { collectWorktreeAtomicSlices } from '../git/worktreeAtomicSlices';
import { resolveLearningContextExperimentalFeature } from '../policy/experimentalFeatures';
import { readSddLearningContext, type SddLearningContext } from '../sdd/learningInsights';

const ACTIONABLE_HINTS_BY_CODE: Readonly<Record<string, string>> = {
  EVIDENCE_MISSING: 'Ejecuta una auditoría (1/2/3/4) para regenerar .ai_evidence.json.',
  EVIDENCE_INVALID: 'Regenera .ai_evidence.json desde una opción de auditoría.',
  EVIDENCE_INTEGRITY_MISSING: 'Refresca evidencia para regenerar metadatos de integridad.',
  EVIDENCE_ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES:
    'No hay active_rule_ids para plataforma de código detectada. Ejecuta reconcile --strict y revalida PRE_WRITE.',
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
  EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING:
    'Ejecuta `pumuki policy reconcile --strict --json`, materializa reglas críticas (p.ej. skills.ios.critical-test-quality) y revalida PRE_WRITE.',
  EVIDENCE_CROSS_PLATFORM_CRITICAL_ENFORCEMENT_INCOMPLETE:
    'Reconcilia policy/skills en modo estricto para enforcement crítico transversal y vuelve a validar PRE_WRITE.',
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
  repoRoot: string;
  stage: AiGateStage;
  status: ReturnType<typeof evaluateAiGate>['status'];
  violations: ReadonlyArray<AiGateViolation>;
  upstream: string | null;
  learningContext: SddLearningContext | null;
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
  const hasWorktreeViolation = params.violations.some(
    (violation) =>
      violation.code === 'EVIDENCE_PREWRITE_WORKTREE_OVER_LIMIT'
      || violation.code === 'EVIDENCE_PREWRITE_WORKTREE_WARN'
  );
  if (params.stage === 'PRE_WRITE' && hasWorktreeViolation) {
    const plan = collectWorktreeAtomicSlices({
      repoRoot: params.repoRoot,
      maxSlices: 3,
      maxFilesPerSlice: 4,
    });
    if (plan.slices.length > 0) {
      hints.push('ATOMIC_SLICES: staging sugerido por scope.');
      for (const slice of plan.slices) {
        hints.push(`ATOMIC_SLICES[${slice.scope}]: ${slice.staged_command}`);
      }
      hints.push(
        'ATOMIC_SLICES[next]: revalida con npx --yes --package pumuki@latest pumuki sdd validate --stage=PRE_WRITE --json'
      );
    }
  }
  if (hints.length === 0) {
    if (params.status === 'ALLOWED') {
      hints.push('Pre-flight operativo: sin bloqueos previos detectados.');
    } else {
      hints.push('Corrige la causa bloqueante y vuelve a ejecutar el pre-flight.');
    }
  }
  if (params.learningContext) {
    hints.push(
      `LEARNING_CONTEXT: change=${params.learningContext.change} file=${params.learningContext.path}`
    );
    if (params.learningContext.recommended_actions[0]) {
      hints.push(`LEARNING_NEXT_ACTION: ${params.learningContext.recommended_actions[0]}`);
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
    phase: 'GREEN' | 'RED';
    message: string;
    instruction: string;
    stage: ReturnType<typeof evaluateAiGate>['stage'];
    policy: ReturnType<typeof evaluateAiGate>['policy'];
    violations: ReturnType<typeof evaluateAiGate>['violations'];
    evidence: ReturnType<typeof evaluateAiGate>['evidence'];
    mcp_receipt: ReturnType<typeof evaluateAiGate>['mcp_receipt'];
    skills_contract: ReturnType<typeof evaluateAiGate>['skills_contract'];
    repo_state: ReturnType<typeof evaluateAiGate>['repo_state'];
    hints: ReadonlyArray<string>;
    learning_context: SddLearningContext | null;
    ast_analysis: null;
    tdd_status: null;
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
  const learningContextFeature = resolveLearningContextExperimentalFeature();
  const learningContext = learningContextFeature.mode === 'off'
    ? null
    : readSddLearningContext({
      repoRoot: params.repoRoot,
    });

  const hints = buildPreFlightHints({
    repoRoot: params.repoRoot,
    stage: evaluation.stage,
    status: evaluation.status,
    violations: evaluation.violations,
    upstream: evaluation.repo_state.git.upstream,
    learningContext,
  });
  const phase: 'GREEN' | 'RED' = evaluation.allowed ? 'GREEN' : 'RED';
  const message = evaluation.allowed
    ? '✅ Pre-flight aprobado: puedes continuar con la implementación.'
    : `🔴 Pre-flight bloqueado: corrige ${evaluation.violations[0]?.code ?? 'la causa'} y vuelve a ejecutar.`;
  const instruction = evaluation.allowed
    ? 'Implementa el cambio mínimo para pasar en verde y vuelve a validar.'
    : hints[0] ?? 'Corrige la causa bloqueante y vuelve a ejecutar el pre-flight.';

  return {
    tool: 'pre_flight_check',
    dryRun: true,
    executed: true,
    success: evaluation.allowed,
    result: {
      allowed: evaluation.allowed,
      status: evaluation.status,
      phase,
      message,
      instruction,
      stage: evaluation.stage,
      policy: evaluation.policy,
      violations: evaluation.violations,
      evidence: evaluation.evidence,
      mcp_receipt: evaluation.mcp_receipt,
      skills_contract: evaluation.skills_contract,
      repo_state: evaluation.repo_state,
      hints,
      learning_context: learningContext,
      ast_analysis: null,
      tdd_status: null,
    },
  };
};
