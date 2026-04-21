import { evaluateAiGate, type AiGateStage } from '../gate/evaluateAiGate';
import { resolveRemediationHintForViolationCode } from '../gate/remediationCatalog';
import { resolveLearningContextExperimentalFeature } from '../policy/experimentalFeatures';
import { readSddLearningContext, type SddLearningContext } from '../sdd/learningInsights';
import { runMcpAlignedPlatformGate } from './alignedPlatformGate';

const PROTECTED_BRANCHES = new Set(['main', 'master', 'develop', 'dev']);

type PlatformGateAlignment = {
  mode: 'full' | 'policy';
  exit_code: number;
  aligned: boolean;
  skip_reason: string | null;
};

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
    reason_code: string;
    instruction: string;
    next_action: {
      kind: 'info';
      reason: string;
      message: string;
    };
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
    platform_gate_alignment?: PlatformGateAlignment;
  };
};

const HOOK_STAGE_SET = new Set<AiGateStage>(['PRE_COMMIT', 'PRE_PUSH', 'CI']);

const isHookRefreshableEvidenceCode = (code: string): boolean =>
  code.startsWith('EVIDENCE_');

type AiGateCheckDependencies = {
  evaluateAiGate: typeof evaluateAiGate;
  runMcpAlignedPlatformGate: typeof runMcpAlignedPlatformGate;
};

const defaultDependencies: AiGateCheckDependencies = {
  evaluateAiGate,
  runMcpAlignedPlatformGate,
};

const buildConsistencyHint = (
  evaluation: ReturnType<typeof evaluateAiGate>,
  platform?: { exitCode: number; aligned: boolean; skipReason: string | null }
): EnterpriseAiGateCheckResult['result']['consistency_hint'] => {
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

  if (platform?.aligned) {
    return {
      comparable_with_hook_runner: true,
      reason_code: null,
      message:
        `ai_gate_check ejecutó runPlatformGate después de leer la evidencia actual (exit_code=${platform.exitCode}); ` +
        'alineación hook-like habilitada explícitamente para este stage.',
    };
  }

  if (!HOOK_STAGE_SET.has(evaluation.stage)) {
    return {
      comparable_with_hook_runner: true,
      reason_code: null,
      message: 'Stage is directly comparable with ai_gate_check semantics.',
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
    const fix = resolveRemediationHintForViolationCode(violation.code);
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

const buildReasonCode = (evaluation: ReturnType<typeof evaluateAiGate>): string =>
  evaluation.violations[0]?.code ?? 'AI_GATE_ALLOWED';

const buildInstruction = (evaluation: ReturnType<typeof evaluateAiGate>): string =>
  evaluation.allowed
    ? 'Continúa con el stage actual manteniendo el vocabulario canónico de governance.'
    : 'Corrige el bloqueante primario y vuelve a ejecutar ai_gate_check en el mismo stage.';

const buildNextAction = (
  evaluation: ReturnType<typeof evaluateAiGate>,
  autoFixes: ReadonlyArray<string>
): EnterpriseAiGateCheckResult['result']['next_action'] => ({
  kind: 'info',
  reason: buildReasonCode(evaluation),
  message: autoFixes[0] ?? buildInstruction(evaluation),
});

const buildMessage = (
  evaluation: ReturnType<typeof evaluateAiGate>,
  platform?: { exitCode: number; skipReason: string | null }
): string => {
  if (platform && platform.exitCode !== 0) {
    const suffix = platform.skipReason ? ` (${platform.skipReason})` : '';
    return `🔴 runPlatformGate exit_code=${platform.exitCode}${suffix}.`;
  }
  if (evaluation.allowed) {
    return `✅ Gate ${evaluation.stage} ALLOWED.`;
  }
  const firstViolation = evaluation.violations[0];
  if (!firstViolation) {
    return `🔴 Gate ${evaluation.stage} BLOCKED.`;
  }
  return `🔴 ${firstViolation.code}: ${firstViolation.message}`;
};

const resolveAiGateCheckMode = (): PlatformGateAlignment['mode'] => {
  const raw = process.env.PUMUKI_MCP_AI_GATE_CHECK_MODE?.trim().toLowerCase();
  return raw === 'full' || raw === 'aligned' ? 'full' : 'policy';
};

const toPlatformGateAlignment = (
  mode: PlatformGateAlignment['mode'],
  platform?: { exitCode: number; aligned: boolean; skipReason: string | null }
): PlatformGateAlignment | undefined => {
  if (mode !== 'full' || !platform) {
    return undefined;
  }
  return {
    mode,
    exit_code: platform.exitCode,
    aligned: platform.aligned,
    skip_reason: platform.skipReason,
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
      reason_code: buildReasonCode(evaluation),
      instruction: buildInstruction(evaluation),
      next_action: buildNextAction(evaluation, autoFixes),
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

export const runEnterpriseAiGateCheckAsync = async (params: {
  repoRoot: string;
  stage: AiGateStage;
  requireMcpReceipt?: boolean;
}, dependencies: Partial<AiGateCheckDependencies> = {}): Promise<EnterpriseAiGateCheckResult> => {
  const mode = resolveAiGateCheckMode();
  const activeDependencies: AiGateCheckDependencies = {
    ...defaultDependencies,
    ...dependencies,
  };
  const evaluation = activeDependencies.evaluateAiGate({
    repoRoot: params.repoRoot,
    stage: params.stage,
    requireMcpReceipt: params.requireMcpReceipt ?? false,
  });

  let platform:
    | { exitCode: number; aligned: boolean; skipReason: string | null }
    | undefined;
  if (mode === 'full') {
    platform = await activeDependencies.runMcpAlignedPlatformGate({
      repoRoot: params.repoRoot,
      stage: params.stage,
    });
  }

  const platformBlocks = Boolean(platform && platform.exitCode !== 0);
  const allowed = evaluation.allowed && !platformBlocks;
  const status: 'ALLOWED' | 'BLOCKED' = allowed ? 'ALLOWED' : 'BLOCKED';
  const violations = platformBlocks && platform
    ? [
      ...evaluation.violations,
      {
        code: 'PLATFORM_GATE_EXIT_NON_ZERO',
        message:
          `runPlatformGate devolvió exit_code=${platform.exitCode}` +
          (platform.skipReason ? ` (${platform.skipReason})` : ''),
        severity: 'ERROR' as const,
      },
    ]
    : evaluation.violations;
  const branch = evaluation.repo_state.git.branch;
  const timestamp = evaluation.evidence.source.generated_at;
  const learningContextFeature = resolveLearningContextExperimentalFeature();
  const learningContext = learningContextFeature.mode === 'off'
    ? null
    : readSddLearningContext({
      repoRoot: params.repoRoot,
    });
  const evaluationForHints = { ...evaluation, allowed, status, violations };
  const warnings = buildWarnings(evaluationForHints);
  const autoFixes = buildAutoFixes(evaluationForHints, learningContext);
  const message = buildMessage(evaluationForHints, platform);

  return {
    tool: 'ai_gate_check',
    dryRun: true,
    executed: true,
    success: allowed,
    result: {
      allowed,
      status,
      timestamp,
      branch,
      message,
      reason_code: buildReasonCode(evaluationForHints),
      instruction: buildInstruction(evaluationForHints),
      next_action: buildNextAction(evaluationForHints, autoFixes),
      stage: evaluation.stage,
      policy: evaluation.policy,
      violations,
      warnings,
      auto_fixes: autoFixes,
      learning_context: learningContext,
      evidence: evaluation.evidence,
      mcp_receipt: evaluation.mcp_receipt,
      skills_contract: evaluation.skills_contract,
      repo_state: evaluation.repo_state,
      consistency_hint: buildConsistencyHint(evaluationForHints, platform),
      platform_gate_alignment: toPlatformGateAlignment(mode, platform),
    },
  };
};
