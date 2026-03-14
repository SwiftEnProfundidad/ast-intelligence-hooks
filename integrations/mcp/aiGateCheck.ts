import { evaluateAiGate, type AiGateStage } from '../gate/evaluateAiGate';
import { resolveLearningContextExperimentalFeature } from '../policy/experimentalFeatures';
import { readSddLearningContext, type SddLearningContext } from '../sdd/learningInsights';

const AUTO_FIX_BY_CODE: Readonly<Record<string, string>> = {
  EVIDENCE_MISSING: 'Ejecuta una auditoría para generar .ai_evidence.json.',
  EVIDENCE_INVALID: 'Regenera .ai_evidence.json y vuelve a evaluar.',
  EVIDENCE_STALE: 'Refresca evidencia antes de continuar.',
  EVIDENCE_BRANCH_MISMATCH: 'Regenera evidencia en la rama actual.',
  EVIDENCE_REPO_ROOT_MISMATCH: 'Regenera evidencia desde este repositorio.',
  PRE_PUSH_UPSTREAM_MISSING: 'Ejecuta git push --set-upstream origin <branch>.',
  GITFLOW_PROTECTED_BRANCH: 'Crea una rama feature/* y mueve el trabajo allí.',
};

const PROTECTED_BRANCHES = new Set(['main', 'master', 'develop', 'dev']);

export type EnterpriseAiGateCheckResult = {
  tool: 'ai_gate_check';
  dryRun: true;
  executed: true;
  success: boolean;
  result: {
    allowed: ReturnType<typeof evaluateAiGate>['allowed'];
    status: ReturnType<typeof evaluateAiGate>['status'];
    timestamp: string | null;
    branch: string | null;
    message: string;
    stage: ReturnType<typeof evaluateAiGate>['stage'];
    policy: ReturnType<typeof evaluateAiGate>['policy'];
    violations: ReturnType<typeof evaluateAiGate>['violations'];
    warnings: ReadonlyArray<string>;
    auto_fixes: ReadonlyArray<string>;
    learning_context: SddLearningContext | null;
    evidence: ReturnType<typeof evaluateAiGate>['evidence'];
    mcp_receipt: ReturnType<typeof evaluateAiGate>['mcp_receipt'];
    skills_contract: ReturnType<typeof evaluateAiGate>['skills_contract'];
    repo_state: ReturnType<typeof evaluateAiGate>['repo_state'];
    consistency_hint?: {
      comparable_with_hook_runner: boolean;
      reason_code: 'HOOK_RUNNER_CAN_REFRESH_EVIDENCE' | null;
      message: string;
    };
  };
};

const HOOK_STAGE_SET = new Set<AiGateStage>(['PRE_COMMIT', 'PRE_PUSH', 'CI']);

const isHookRefreshableEvidenceCode = (code: string): boolean =>
  code.startsWith('EVIDENCE_');

type AiGateCheckDependencies = {
  evaluateAiGate: typeof evaluateAiGate;
};

const defaultDependencies: AiGateCheckDependencies = {
  evaluateAiGate,
};

const buildConsistencyHint = (
  evaluation: ReturnType<typeof evaluateAiGate>
): EnterpriseAiGateCheckResult['result']['consistency_hint'] => {
  if (!HOOK_STAGE_SET.has(evaluation.stage)) {
    return {
      comparable_with_hook_runner: true,
      reason_code: null,
      message: 'Stage is directly comparable with ai_gate_check semantics.',
    };
  }

  const hasRefreshableEvidenceViolation = evaluation.violations.some((violation) =>
    isHookRefreshableEvidenceCode(violation.code)
  );

  if (!evaluation.allowed && hasRefreshableEvidenceViolation) {
    return {
      comparable_with_hook_runner: false,
      reason_code: 'HOOK_RUNNER_CAN_REFRESH_EVIDENCE',
      message:
        'ai_gate_check is blocking on evidence integrity/freshness. ' +
        'Hook stage runners may regenerate evidence before final verdict.',
    };
  }

  return {
    comparable_with_hook_runner: true,
    reason_code: null,
    message: 'ai_gate_check verdict is directly comparable with hook stage runner output.',
  };
};

const buildWarnings = (evaluation: ReturnType<typeof evaluateAiGate>): ReadonlyArray<string> => {
  const warnings: string[] = [];
  const currentBranch = evaluation.repo_state.git.branch;
  if (typeof currentBranch === 'string' && PROTECTED_BRANCHES.has(currentBranch.toLowerCase())) {
    warnings.push(
      `ON_PROTECTED_BRANCH: Estás en '${currentBranch}'. Crea una rama feature/* antes de continuar.`
    );
  }
  if (evaluation.stage === 'PRE_PUSH' && !evaluation.repo_state.git.upstream) {
    warnings.push('NO_UPSTREAM: Configura upstream con git push --set-upstream origin <branch>.');
  }
  return warnings;
};

const buildAutoFixes = (
  evaluation: ReturnType<typeof evaluateAiGate>,
  learningContext: SddLearningContext | null
): ReadonlyArray<string> => {
  const fixes: string[] = [];
  const emittedCodes = new Set<string>();
  for (const violation of evaluation.violations) {
    if (emittedCodes.has(violation.code)) {
      continue;
    }
    const fix = AUTO_FIX_BY_CODE[violation.code];
    if (!fix) {
      continue;
    }
    fixes.push(fix);
    emittedCodes.add(violation.code);
  }
  for (const recommendation of learningContext?.recommended_actions ?? []) {
    if (!fixes.includes(recommendation)) {
      fixes.push(recommendation);
    }
  }
  return fixes;
};

const buildMessage = (evaluation: ReturnType<typeof evaluateAiGate>): string => {
  if (evaluation.allowed) {
    return `✅ Gate ${evaluation.stage} ALLOWED.`;
  }
  const firstViolation = evaluation.violations[0];
  if (!firstViolation) {
    return `🔴 Gate ${evaluation.stage} BLOCKED.`;
  }
  return `🔴 ${firstViolation.code}: ${firstViolation.message}`;
};

export const runEnterpriseAiGateCheck = (params: {
  repoRoot: string;
  stage: AiGateStage;
  requireMcpReceipt?: boolean;
}, dependencies: Partial<AiGateCheckDependencies> = {}): EnterpriseAiGateCheckResult => {
  const activeDependencies: AiGateCheckDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };
  const evaluation = activeDependencies.evaluateAiGate({
    repoRoot: params.repoRoot,
    stage: params.stage,
    requireMcpReceipt: params.requireMcpReceipt ?? false,
  });
  const branch = evaluation.repo_state.git.branch;
  const timestamp = evaluation.evidence.source.generated_at;
  const learningContextFeature = resolveLearningContextExperimentalFeature();
  const learningContext = learningContextFeature.mode === 'off'
    ? null
    : readSddLearningContext({
      repoRoot: params.repoRoot,
    });
  const warnings = buildWarnings(evaluation);
  const autoFixes = buildAutoFixes(evaluation, learningContext);
  const message = buildMessage(evaluation);

  return {
    tool: 'ai_gate_check',
    dryRun: true,
    executed: true,
    success: evaluation.allowed,
    result: {
      allowed: evaluation.allowed,
      status: evaluation.status,
      timestamp,
      branch,
      message,
      stage: evaluation.stage,
      policy: evaluation.policy,
      violations: evaluation.violations,
      warnings,
      auto_fixes: autoFixes,
      learning_context: learningContext,
      evidence: evaluation.evidence,
      mcp_receipt: evaluation.mcp_receipt,
      skills_contract: evaluation.skills_contract,
      repo_state: evaluation.repo_state,
      consistency_hint: buildConsistencyHint(evaluation),
    },
  };
};
