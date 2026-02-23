import type { Fact } from '../core/facts/Fact';
import type { GateStage } from '../core/gate/GateStage';
import type { Severity } from '../core/rules/Severity';
import { resolvePolicyForStage } from '../integrations/gate/stagePolicies';
import { evaluatePlatformGateFindings as evaluatePlatformGateFindingsBase } from '../integrations/git/runPlatformGateEvaluation';
import { resolveFactsForGateScope } from '../integrations/git/runPlatformGateFacts';
import { GitService } from '../integrations/git/GitService';
import { evaluateSddPolicy } from '../integrations/sdd/policy';
import type { SddDecisionCode } from '../integrations/sdd/types';

type RuleCoverageStage = 'PRE_WRITE' | 'PRE_COMMIT' | 'PRE_PUSH' | 'CI';

type RuleCoverageStageDiagnostics = {
  stage: RuleCoverageStage;
  policyTraceBundle: string;
  evaluationStage: GateStage;
  factsTotal: number;
  filesScanned: number;
  rulesTotal: number;
  baselineRules: number;
  heuristicRules: number;
  skillsRules: number;
  projectRules: number;
  matchedRules: number;
  unmatchedRules: number;
  findingsTotal: number;
  findingsBySeverity: Record<Severity, number>;
  findingsByEnterpriseSeverity: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  evaluatedRuleIds: ReadonlyArray<string>;
  matchedRuleIds: ReadonlyArray<string>;
  unmatchedRuleIds: ReadonlyArray<string>;
  sdd: {
    allowed: boolean;
    code: SddDecisionCode;
  };
};

export type RuleCoverageDiagnosticsReport = {
  repoRoot: string;
  generatedAt: string;
  stages: ReadonlyArray<RuleCoverageStageDiagnostics>;
};

type RuleCoverageDiagnosticsDependencies = {
  resolvePolicyForStage: typeof resolvePolicyForStage;
  resolveFactsForGateScope: typeof resolveFactsForGateScope;
  evaluatePlatformGateFindings: typeof evaluatePlatformGateFindingsBase;
  evaluateSddPolicy: typeof evaluateSddPolicy;
  createGitService: () => Pick<GitService, 'resolveRepoRoot'>;
};

const defaultDependencies: RuleCoverageDiagnosticsDependencies = {
  resolvePolicyForStage,
  resolveFactsForGateScope,
  evaluatePlatformGateFindings: (params) =>
    evaluatePlatformGateFindingsBase(params, {
      loadHeuristicsConfig: () => ({
        astSemanticEnabled: true,
        typeScriptScope: 'all',
      }),
    }),
  evaluateSddPolicy,
  createGitService: () => new GitService(),
};

const emptySeverity = (): Record<Severity, number> => ({
  CRITICAL: 0,
  ERROR: 0,
  WARN: 0,
  INFO: 0,
});

const bySeverity = (findings: ReadonlyArray<{ severity: Severity }>): Record<Severity, number> => {
  const output = emptySeverity();
  for (const finding of findings) {
    output[finding.severity] += 1;
  }
  return output;
};

const toEnterpriseBySeverity = (
  severity: Readonly<Record<Severity, number>>
): { CRITICAL: number; HIGH: number; MEDIUM: number; LOW: number } => {
  return {
    CRITICAL: severity.CRITICAL,
    HIGH: severity.ERROR,
    MEDIUM: severity.WARN,
    LOW: severity.INFO,
  };
};

export const buildRuleCoverageDiagnostics = async (params?: {
  repoRoot?: string;
  stages?: ReadonlyArray<RuleCoverageStage>;
  dependencies?: Partial<RuleCoverageDiagnosticsDependencies>;
}): Promise<RuleCoverageDiagnosticsReport> => {
  const dependencies: RuleCoverageDiagnosticsDependencies = {
    ...defaultDependencies,
    ...params?.dependencies,
  };
  const stages = params?.stages ?? ['PRE_WRITE', 'PRE_COMMIT', 'PRE_PUSH', 'CI'];
  const git = dependencies.createGitService();
  const repoRoot = params?.repoRoot ?? git.resolveRepoRoot();
  const diagnostics: RuleCoverageStageDiagnostics[] = [];

  for (const stage of stages) {
    const evaluationStage: GateStage = stage === 'PRE_WRITE' ? 'PRE_COMMIT' : stage;
    const policy = dependencies.resolvePolicyForStage(evaluationStage, repoRoot);
    const sdd = dependencies.evaluateSddPolicy({
      stage,
      repoRoot,
    }).decision;
    const facts = await dependencies.resolveFactsForGateScope({
      scope: { kind: 'repo' },
      git: git as never,
    });
    const evaluation = dependencies.evaluatePlatformGateFindings({
      facts: facts as ReadonlyArray<Fact>,
      stage: evaluationStage,
      repoRoot,
    });
    const findingsBySeverity = bySeverity(evaluation.findings);

    diagnostics.push({
      stage,
      policyTraceBundle:
        stage === 'PRE_WRITE'
          ? `gate-policy.synthetic.PRE_WRITE->${policy.trace.bundle}`
          : policy.trace.bundle,
      evaluationStage,
      factsTotal: evaluation.coverage.factsTotal,
      filesScanned: evaluation.coverage.filesScanned,
      rulesTotal: evaluation.coverage.rulesTotal,
      baselineRules: evaluation.coverage.baselineRules,
      heuristicRules: evaluation.coverage.heuristicRules,
      skillsRules: evaluation.coverage.skillsRules,
      projectRules: evaluation.coverage.projectRules,
      matchedRules: evaluation.coverage.matchedRules,
      unmatchedRules: evaluation.coverage.unmatchedRules,
      findingsTotal: evaluation.findings.length,
      findingsBySeverity,
      findingsByEnterpriseSeverity: toEnterpriseBySeverity(findingsBySeverity),
      evaluatedRuleIds: evaluation.coverage.evaluatedRuleIds,
      matchedRuleIds: evaluation.coverage.matchedRuleIds,
      unmatchedRuleIds: evaluation.coverage.unmatchedRuleIds,
      sdd: {
        allowed: sdd.allowed,
        code: sdd.code,
      },
    });
  }

  return {
    repoRoot,
    generatedAt: new Date().toISOString(),
    stages: diagnostics,
  };
};

export const formatRuleCoverageDiagnostics = (
  report: RuleCoverageDiagnosticsReport
): string => {
  const lines: string[] = [
    'RULE COVERAGE DIAGNOSTICS',
    `repo_root=${report.repoRoot}`,
    `generated_at=${report.generatedAt}`,
    '',
  ];

  for (const stage of report.stages) {
    lines.push(`[${stage.stage}] policy=${stage.policyTraceBundle}`);
    lines.push(
      `evaluation_stage=${stage.evaluationStage} sdd_allowed=${stage.sdd.allowed} sdd_code=${stage.sdd.code}`
    );
    lines.push(
      `facts_total=${stage.factsTotal} files_scanned=${stage.filesScanned} rules_total=${stage.rulesTotal}`
    );
    lines.push(
      `rules_baseline=${stage.baselineRules} rules_heuristics=${stage.heuristicRules} rules_skills=${stage.skillsRules} rules_project=${stage.projectRules}`
    );
    lines.push(
      `matched_rules=${stage.matchedRules} unmatched_rules=${stage.unmatchedRules} findings_total=${stage.findingsTotal}`
    );
    lines.push(
      `findings_by_severity_enterprise=CRITICAL:${stage.findingsByEnterpriseSeverity.CRITICAL}|HIGH:${stage.findingsByEnterpriseSeverity.HIGH}|MEDIUM:${stage.findingsByEnterpriseSeverity.MEDIUM}|LOW:${stage.findingsByEnterpriseSeverity.LOW}`
    );
    lines.push(
      `findings_by_severity_legacy=CRITICAL:${stage.findingsBySeverity.CRITICAL}|ERROR:${stage.findingsBySeverity.ERROR}|WARN:${stage.findingsBySeverity.WARN}|INFO:${stage.findingsBySeverity.INFO}`
    );
    lines.push(
      `evaluated_rule_ids=${stage.evaluatedRuleIds.length > 0 ? stage.evaluatedRuleIds.join(',') : 'none'}`
    );
    lines.push(
      `matched_rule_ids=${stage.matchedRuleIds.length > 0 ? stage.matchedRuleIds.join(',') : 'none'}`
    );
    lines.push(
      `unmatched_rule_ids=${stage.unmatchedRuleIds.length > 0 ? stage.unmatchedRuleIds.join(',') : 'none'}`
    );
    lines.push('');
  }

  return lines.join('\n').trimEnd();
};

export default {
  buildRuleCoverageDiagnostics,
  formatRuleCoverageDiagnostics,
};
