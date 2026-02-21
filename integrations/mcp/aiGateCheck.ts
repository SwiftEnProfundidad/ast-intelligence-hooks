import { evaluateAiGate, type AiGateStage } from '../gate/evaluateAiGate';

export type EnterpriseAiGateCheckResult = {
  tool: 'ai_gate_check';
  dryRun: true;
  executed: true;
  success: boolean;
  result: {
    status: ReturnType<typeof evaluateAiGate>['status'];
    stage: ReturnType<typeof evaluateAiGate>['stage'];
    policy: ReturnType<typeof evaluateAiGate>['policy'];
    violations: ReturnType<typeof evaluateAiGate>['violations'];
    evidence: ReturnType<typeof evaluateAiGate>['evidence'];
    repo_state: ReturnType<typeof evaluateAiGate>['repo_state'];
  };
};

export const runEnterpriseAiGateCheck = (params: {
  repoRoot: string;
  stage: AiGateStage;
}): EnterpriseAiGateCheckResult => {
  const evaluation = evaluateAiGate({
    repoRoot: params.repoRoot,
    stage: params.stage,
  });

  return {
    tool: 'ai_gate_check',
    dryRun: true,
    executed: true,
    success: evaluation.allowed,
    result: {
      status: evaluation.status,
      stage: evaluation.stage,
      policy: evaluation.policy,
      violations: evaluation.violations,
      evidence: evaluation.evidence,
      repo_state: evaluation.repo_state,
    },
  };
};
