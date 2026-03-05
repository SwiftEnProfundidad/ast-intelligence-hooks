import { evaluateAiGate, type AiGateStage } from '../gate/evaluateAiGate';

export type EnterpriseAiGateCheckResult = {
  tool: 'ai_gate_check';
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

  return {
    tool: 'ai_gate_check',
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
      consistency_hint: buildConsistencyHint(evaluation),
    },
  };
};
