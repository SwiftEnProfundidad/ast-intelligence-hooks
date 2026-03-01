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
    repo_state: ReturnType<typeof evaluateAiGate>['repo_state'];
  };
};

export const runEnterpriseAiGateCheck = (params: {
  repoRoot: string;
  stage: AiGateStage;
  requireMcpReceipt?: boolean;
}): EnterpriseAiGateCheckResult => {
  const evaluation = evaluateAiGate({
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
      repo_state: evaluation.repo_state,
    },
  };
};
