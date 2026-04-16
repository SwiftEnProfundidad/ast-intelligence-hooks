import type { Finding } from '../../core/gate/Finding';
import type { GateStage } from '../../core/gate/GateStage';
import { evaluateAiGate, type AiGateStage } from '../gate/evaluateAiGate';

const AI_GATE_STAGES = new Set<AiGateStage>(['PRE_WRITE', 'PRE_COMMIT', 'PRE_PUSH', 'CI']);

const REPO_POLICY_CODES = new Set<string>([
  'GITFLOW_PROTECTED_BRANCH',
  'GITFLOW_BRANCH_NAMING_INVALID',
  'TRACKING_CANONICAL_SOURCE_CONFLICT',
  'TRACKING_CANONICAL_FILE_MISSING',
  'TRACKING_CANONICAL_IN_PROGRESS_INVALID',
  'EVIDENCE_PREWRITE_WORKTREE_OVER_LIMIT',
  'EVIDENCE_PREWRITE_WORKTREE_WARN',
]);

const toRepoPolicyFinding = (params: {
  code: string;
  message: string;
  severity: 'ERROR' | 'WARN';
}): Finding => ({
  ruleId: `ai_gate.repo_policy.${params.code}`,
  severity: params.severity,
  code: params.code,
  message: params.message,
  matchedBy: 'RepoPolicy',
  source: 'ai_gate:repo_policy',
});

export const collectAiGateRepoPolicyFindings = (params: {
  repoRoot: string;
  stage: GateStage;
}): Finding[] => {
  if (!AI_GATE_STAGES.has(params.stage as AiGateStage)) {
    return [];
  }
  const evaluation = evaluateAiGate({
    repoRoot: params.repoRoot,
    stage: params.stage as AiGateStage,
  });
  return evaluation.violations
    .filter((v) => REPO_POLICY_CODES.has(v.code))
    .map((v) =>
      toRepoPolicyFinding({
        code: v.code,
        message: v.message,
        severity: v.severity === 'ERROR' ? 'ERROR' : 'WARN',
      })
    );
};
