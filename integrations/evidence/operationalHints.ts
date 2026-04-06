import type { GateOutcome } from '../../core/gate/GateOutcome';
import type { GateStage } from '../../core/gate/GateStage';
import { resolveRemediationHintOrDefault } from '../gate/remediationCatalog';
import type {
  EvidenceOperationalHints,
  EvidenceRuleExecutionBreakdown,
  SnapshotEvaluationMetrics,
  SnapshotFinding,
  SnapshotRulesCoverage,
} from './schema';

const truncate = (value: string, max: number): string => {
  const t = value.trim();
  if (t.length <= max) {
    return t;
  }
  return `${t.slice(0, max - 1)}…`;
};

const buildRuleExecutionBreakdown = (params: {
  findings: ReadonlyArray<SnapshotFinding>;
  rulesCoverage?: SnapshotRulesCoverage;
  evaluationMetrics?: SnapshotEvaluationMetrics;
}): EvidenceRuleExecutionBreakdown => {
  const matched_blocking_count = params.findings.filter(
    (f) =>
      f.severity === 'ERROR' ||
      f.severity === 'CRITICAL' ||
      f.blocking === true
  ).length;
  const matched_warn_count = params.findings.filter((f) => f.severity === 'WARN').length;
  const matched_info_count = params.findings.filter((f) => f.severity === 'INFO').length;
  const evaluated_count =
    params.rulesCoverage?.counts?.evaluated ?? params.evaluationMetrics?.evaluated_rule_ids.length ?? 0;
  const active = params.rulesCoverage?.counts?.active ?? 0;
  const evaluatedFromCoverage = params.rulesCoverage?.counts?.evaluated;
  const skipped_out_of_scope_count =
    typeof params.rulesCoverage?.counts?.unevaluated === 'number'
      ? params.rulesCoverage.counts.unevaluated
      : active > 0 && typeof evaluatedFromCoverage === 'number'
        ? Math.max(0, active - evaluatedFromCoverage)
        : 0;

  return {
    evaluated_count: Math.max(0, evaluated_count),
    matched_blocking_count,
    matched_warn_count,
    matched_info_count,
    skipped_out_of_scope_count: Math.max(0, skipped_out_of_scope_count),
  };
};

const buildHumanSummaryLines = (params: {
  stage: GateStage;
  outcome: GateOutcome;
  findings: ReadonlyArray<SnapshotFinding>;
}): string[] => {
  const lines: string[] = [`${params.stage}: outcome=${params.outcome}.`];
  if (params.outcome === 'BLOCK') {
    const blocking =
      params.findings.find((f) => f.severity === 'CRITICAL' || f.severity === 'ERROR') ??
      params.findings.find((f) => f.blocking === true) ??
      params.findings[0];
    if (blocking) {
      lines.push(`${blocking.code}: ${truncate(blocking.message, 140)}`);
      lines.push(resolveRemediationHintOrDefault(blocking.code));
    }
    return lines.slice(0, 3);
  }
  const warn = params.findings.find((f) => f.severity === 'WARN');
  if (warn) {
    lines.push(`WARN ${warn.code}: ${truncate(warn.message, 120)}`);
  }
  return lines.slice(0, 3);
};

export const buildEvidenceOperationalHints = (params: {
  stage: GateStage;
  outcome: GateOutcome;
  findings: ReadonlyArray<SnapshotFinding>;
  rulesCoverage?: SnapshotRulesCoverage;
  evaluationMetrics?: SnapshotEvaluationMetrics;
  extra?: Partial<Pick<EvidenceOperationalHints, 'requires_second_pass' | 'second_pass_reason'>>;
}): EvidenceOperationalHints => {
  const breakdown = buildRuleExecutionBreakdown({
    findings: params.findings,
    rulesCoverage: params.rulesCoverage,
    evaluationMetrics: params.evaluationMetrics,
  });
  let human_summary_lines = buildHumanSummaryLines({
    stage: params.stage,
    outcome: params.outcome,
    findings: params.findings,
  });
  if (params.extra?.requires_second_pass === true) {
    human_summary_lines = [
      ...human_summary_lines,
      'La evidencia trackeada se actualizó en disco pero no entró en el índice; si debe ir en este commit: git add -- .ai_evidence.json',
    ];
  }
  return {
    requires_second_pass: params.extra?.requires_second_pass ?? false,
    second_pass_reason:
      params.extra?.requires_second_pass === true
        ? (params.extra.second_pass_reason ?? null)
        : null,
    human_summary_lines: human_summary_lines.slice(0, 4),
    rule_execution_breakdown: breakdown,
  };
};
