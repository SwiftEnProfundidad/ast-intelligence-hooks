import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import type { Fact } from '../../core/facts/Fact';
import type { Finding } from '../../core/gate/Finding';
import { readTddBddEvidence } from './contract';
import { classifyTddBddScope } from './scope';
import type { TddBddSnapshot } from './types';
import { resolveActiveTddBddWaiver } from './waiver';

export type TddBddEnforcementResult = {
  findings: ReadonlyArray<Finding>;
  snapshot: TddBddSnapshot;
};

const buildFinding = (params: {
  ruleId: string;
  code: string;
  message: string;
  severity?: Finding['severity'];
  filePath?: string;
  source?: string;
}): Finding => {
  return {
    ruleId: params.ruleId,
    severity: params.severity ?? 'ERROR',
    code: params.code,
    message: params.message,
    filePath: params.filePath,
    matchedBy: 'TddBddEnforcer',
    source: params.source ?? 'tdd-bdd-contract',
  };
};

const parseScenarioFeaturePath = (scenarioRef: string): string => {
  const withoutAnchor = scenarioRef.split('#')[0] ?? scenarioRef;
  const colonIndex = withoutAnchor.lastIndexOf(':');
  if (colonIndex <= 0) {
    return withoutAnchor.trim();
  }
  const suffix = withoutAnchor.slice(colonIndex + 1).trim();
  if (!/^\d+$/.test(suffix)) {
    return withoutAnchor.trim();
  }
  return withoutAnchor.slice(0, colonIndex).trim();
};

const resolveScenarioPath = (repoRoot: string, scenarioRef: string): string => {
  const rawPath = parseScenarioFeaturePath(scenarioRef);
  if (isAbsolute(rawPath)) {
    return rawPath;
  }
  return resolve(repoRoot, rawPath);
};

const isTimelineOrdered = (timestamps: ReadonlyArray<string | undefined>): boolean => {
  const parsed: number[] = [];
  for (const timestamp of timestamps) {
    if (!timestamp) {
      return true;
    }
    const date = new Date(timestamp);
    const time = date.getTime();
    if (Number.isNaN(time)) {
      return false;
    }
    parsed.push(time);
  }
  if (parsed.length < 2) {
    return true;
  }
  for (let index = 1; index < parsed.length; index += 1) {
    if (parsed[index] < parsed[index - 1]) {
      return false;
    }
  }
  return true;
};

const DEFAULT_EVIDENCE_MAX_AGE_SECONDS = 900;

const resolveEvidenceMaxAgeSeconds = (): number => {
  const raw = process.env.PUMUKI_TDD_BDD_EVIDENCE_MAX_AGE_SECONDS?.trim();
  if (!raw) {
    return DEFAULT_EVIDENCE_MAX_AGE_SECONDS;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_EVIDENCE_MAX_AGE_SECONDS;
  }
  return parsed;
};

const resolveEvidenceAgeSeconds = (generatedAt: string, nowMs: number): number | null => {
  const generatedAtMs = new Date(generatedAt).getTime();
  if (Number.isNaN(generatedAtMs)) {
    return null;
  }
  return Math.max(0, Math.floor((nowMs - generatedAtMs) / 1000));
};

export const enforceTddBddPolicy = (params: {
  facts: ReadonlyArray<Fact>;
  repoRoot: string;
  branch: string | null;
  now?: () => number;
}): TddBddEnforcementResult => {
  const scope = classifyTddBddScope(params.facts);
  const baseSnapshot: TddBddSnapshot = {
    status: 'skipped',
    scope: {
      in_scope: scope.inScope,
      is_new_feature: scope.isNewFeature,
      is_complex_change: scope.isComplexChange,
      reasons: [...scope.reasons],
      metrics: {
        changed_files: scope.metrics.changedFiles,
        estimated_loc: scope.metrics.estimatedLoc,
        critical_path_files: scope.metrics.criticalPathFiles,
        public_interface_files: scope.metrics.publicInterfaceFiles,
      },
    },
    evidence: {
      path: '',
      state: 'not_required',
      slices_total: 0,
      slices_valid: 0,
      slices_invalid: 0,
      integrity_ok: true,
      errors: [],
      baseline: {
        required: scope.inScope,
        passed: 0,
        missing: 0,
        failed: 0,
      },
    },
    waiver: {
      applied: false,
    },
  };

  if (!scope.inScope) {
    return {
      findings: [],
      snapshot: baseSnapshot,
    };
  }

  const waiver = resolveActiveTddBddWaiver({
    repoRoot: params.repoRoot,
    branch: params.branch,
  });

  if (waiver.kind === 'invalid') {
    baseSnapshot.waiver = {
      applied: false,
      path: waiver.path,
      invalid_reason: waiver.reason,
    };
  }

  if (waiver.kind === 'applied') {
    const finding = buildFinding({
      ruleId: 'generic_tdd_vertical_required',
      severity: 'INFO',
      code: 'TDD_BDD_WAIVER_APPLIED',
      message: `TDD/BDD waiver applied by ${waiver.waiver.approved_by} until ${waiver.waiver.expires_at}.`,
      filePath: waiver.path,
      source: 'tdd-bdd-waiver',
    });
    return {
      findings: [finding],
      snapshot: {
        ...baseSnapshot,
        status: 'waived',
        waiver: {
          applied: true,
          path: waiver.path,
          approver: waiver.waiver.approved_by,
          reason: waiver.waiver.reason,
          expires_at: waiver.waiver.expires_at,
        },
      },
    };
  }

  const evidenceRead = readTddBddEvidence(params.repoRoot);
  baseSnapshot.evidence.path = evidenceRead.path;

  if (evidenceRead.kind === 'missing') {
    const finding = buildFinding({
      ruleId: 'generic_evidence_integrity_required',
      code: 'TDD_BDD_EVIDENCE_MISSING',
      message:
        'TDD/BDD evidence contract is required for new/complex changes and was not found.',
      filePath: evidenceRead.path,
    });
    return {
      findings: [finding],
      snapshot: {
        ...baseSnapshot,
        status: 'blocked',
        evidence: {
          ...baseSnapshot.evidence,
          state: 'missing',
          integrity_ok: false,
          errors: ['missing_contract'],
        },
      },
    };
  }

  if (evidenceRead.kind === 'invalid') {
    const finding = buildFinding({
      ruleId: 'generic_evidence_integrity_required',
      code: 'TDD_BDD_EVIDENCE_INVALID',
      message: `TDD/BDD evidence contract is invalid: ${evidenceRead.reason}.`,
      filePath: evidenceRead.path,
    });
    return {
      findings: [finding],
      snapshot: {
        ...baseSnapshot,
        status: 'blocked',
        evidence: {
          ...baseSnapshot.evidence,
          state: 'invalid',
          version: evidenceRead.version,
          integrity_ok: false,
          errors: [evidenceRead.reason],
        },
      },
    };
  }

  const maxAgeSeconds = resolveEvidenceMaxAgeSeconds();
  const ageSeconds = resolveEvidenceAgeSeconds(
    evidenceRead.evidence.generated_at,
    params.now?.() ?? Date.now()
  );
  if (ageSeconds === null || ageSeconds > maxAgeSeconds) {
    const messageAge =
      ageSeconds === null ? 'unknown' : `${ageSeconds}s`;
    const finding = buildFinding({
      ruleId: 'generic_tdd_baseline_required',
      code: 'TDD_BDD_EVIDENCE_STALE',
      message:
        `TDD/BDD evidence is stale for this PRE_WRITE baseline: age=${messageAge}, max=${maxAgeSeconds}s. Re-run the baseline tests for the touched component and refresh evidence before editing related code.`,
      filePath: evidenceRead.path,
    });
    return {
      findings: [finding],
      snapshot: {
        ...baseSnapshot,
        status: 'blocked',
        evidence: {
          ...baseSnapshot.evidence,
          state: 'valid',
          version: evidenceRead.evidence.version,
          slices_total: evidenceRead.evidence.slices.length,
          slices_valid: 0,
          slices_invalid: evidenceRead.evidence.slices.length,
          integrity_ok: evidenceRead.integrity.valid,
          errors: ['TDD_BDD_EVIDENCE_STALE'],
          baseline: {
            required: true,
            passed: 0,
            missing: 0,
            failed: 0,
          },
        },
      },
    };
  }

  const sliceFindings: Finding[] = [];
  const seenSliceIds = new Set<string>();
  let validSlices = 0;
  let baselinePassed = 0;
  let baselineMissing = 0;
  let baselineFailed = 0;

  if (evidenceRead.evidence.slices.length === 0) {
    sliceFindings.push(
      buildFinding({
        ruleId: 'generic_tdd_vertical_required',
        code: 'TDD_BDD_EMPTY_SLICES',
        message: 'Evidence contract must contain at least one vertical slice.',
        filePath: evidenceRead.path,
      })
    );
  }

  for (const slice of evidenceRead.evidence.slices) {
    const sliceErrorsBefore = sliceFindings.length;

    if (seenSliceIds.has(slice.id)) {
      sliceFindings.push(
        buildFinding({
          ruleId: 'generic_tdd_vertical_required',
          code: 'TDD_BDD_DUPLICATE_SLICE_ID',
          message: `Duplicate slice id detected: ${slice.id}.`,
          filePath: evidenceRead.path,
        })
      );
    } else {
      seenSliceIds.add(slice.id);
    }

    const scenarioPath = parseScenarioFeaturePath(slice.scenario_ref);
    const resolvedScenarioPath = resolveScenarioPath(params.repoRoot, slice.scenario_ref);
    if (!scenarioPath.toLowerCase().endsWith('.feature')) {
      sliceFindings.push(
        buildFinding({
          ruleId: 'generic_bdd_feature_required',
          code: 'TDD_BDD_SCENARIO_NOT_FEATURE',
          message: `Slice ${slice.id} must reference a .feature scenario.`,
          filePath: evidenceRead.path,
        })
      );
    } else if (!existsSync(resolvedScenarioPath)) {
      sliceFindings.push(
        buildFinding({
          ruleId: 'generic_bdd_feature_required',
          code: 'TDD_BDD_SCENARIO_FILE_MISSING',
          message: `Slice ${slice.id} references missing feature file ${scenarioPath}.`,
          filePath: resolvedScenarioPath,
        })
      );
    }

    if (!slice.baseline) {
      baselineMissing += 1;
      sliceFindings.push(
        buildFinding({
          ruleId: 'generic_tdd_baseline_required',
          code: 'TDD_BASELINE_TEST_REQUIRED',
          message: `Slice ${slice.id} must include passing baseline test evidence before RED.`,
          filePath: evidenceRead.path,
        })
      );
    } else if (slice.baseline.status !== 'passed') {
      baselineFailed += 1;
      sliceFindings.push(
        buildFinding({
          ruleId: 'generic_tdd_baseline_required',
          code: 'TDD_BASELINE_TEST_MUST_PASS',
          message: `Slice ${slice.id} baseline test evidence must pass before editing related code.`,
          filePath: evidenceRead.path,
        })
      );
    } else {
      baselinePassed += 1;
    }

    if (slice.red.status !== 'failed') {
      sliceFindings.push(
        buildFinding({
          ruleId: 'generic_tdd_vertical_required',
          code: 'TDD_RED_MUST_FAIL',
          message: `Slice ${slice.id} must start with RED failing test evidence.`,
          filePath: evidenceRead.path,
        })
      );
    }

    if (slice.green.status !== 'passed' || slice.refactor.status !== 'passed') {
      sliceFindings.push(
        buildFinding({
          ruleId: 'generic_red_green_refactor_enforced',
          code: 'TDD_GREEN_REFACTOR_MUST_PASS',
          message: `Slice ${slice.id} must include GREEN and REFACTOR passing evidence.`,
          filePath: evidenceRead.path,
        })
      );
    }

    if (
      !isTimelineOrdered([
        slice.baseline?.timestamp,
        slice.red.timestamp,
        slice.green.timestamp,
        slice.refactor.timestamp,
      ])
    ) {
      sliceFindings.push(
        buildFinding({
          ruleId: 'generic_red_green_refactor_enforced',
          code: 'TDD_PHASE_TIMELINE_INVALID',
          message: `Slice ${slice.id} has invalid RED->GREEN->REFACTOR timestamp ordering.`,
          filePath: evidenceRead.path,
        })
      );
    }

    if (sliceFindings.length === sliceErrorsBefore) {
      validSlices += 1;
    }
  }

  const invalidSlices = Math.max(0, evidenceRead.evidence.slices.length - validSlices);
  const hasBlockingFindings = sliceFindings.some(
    (finding) => finding.severity === 'ERROR' || finding.severity === 'CRITICAL'
  );

  return {
    findings: sliceFindings,
    snapshot: {
      ...baseSnapshot,
      status: hasBlockingFindings ? 'blocked' : 'passed',
      evidence: {
        ...baseSnapshot.evidence,
        state: 'valid',
        version: evidenceRead.evidence.version,
        slices_total: evidenceRead.evidence.slices.length,
        slices_valid: validSlices,
        slices_invalid: invalidSlices,
        integrity_ok: evidenceRead.integrity.valid,
        errors: sliceFindings.map((finding) => finding.code),
        baseline: {
          required: true,
          passed: baselinePassed,
          missing: baselineMissing,
          failed: baselineFailed,
        },
      },
      waiver: {
        applied: false,
        ...(waiver.kind === 'invalid'
          ? {
              path: waiver.path,
              invalid_reason: waiver.reason,
            }
          : {}),
      },
    },
  };
};
