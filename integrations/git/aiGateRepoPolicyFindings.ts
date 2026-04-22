import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Finding } from '../../core/gate/Finding';
import type { GateStage } from '../../core/gate/GateStage';
import { evaluateAiGate, type AiGateStage } from '../gate/evaluateAiGate';

const AI_GATE_STAGES = new Set<AiGateStage>(['PRE_WRITE', 'PRE_COMMIT', 'PRE_PUSH', 'CI']);

const REPO_POLICY_CODES = new Set<string>([
  'GITFLOW_PROTECTED_BRANCH',
  'TRACKING_CANONICAL_IN_PROGRESS_INVALID',
  'EVIDENCE_PREWRITE_WORKTREE_OVER_LIMIT',
  'EVIDENCE_PREWRITE_WORKTREE_WARN',
]);

const TRACKING_CANDIDATE_FILES = [
  'docs/technical/08-validation/refactor/pumuki-integration-feedback.md',
  'docs/RURALGO_SEGUIMIENTO.md',
  'docs/pumuki/PUMUKI_BUGS_MEJORAS.md',
  'docs/BUGS_Y_MEJORAS_PUMUKI.md',
  'PUMUKI-RESET-MASTER-PLAN.md',
  'RURALGO_SEGUIMIENTO.md',
] as const;

type TrackingActiveEntry = {
  taskId: string | null;
  lineNumber: number;
};

export const collectTrackingActiveEntriesFromMarkdown = (
  markdown: string
): ReadonlyArray<TrackingActiveEntry> => {
  const entries: TrackingActiveEntry[] = [];
  const lines = markdown.split(/\r?\n/u);
  for (const [index, line] of lines.entries()) {
    const boardRowMatch = line.match(/^\|\s*🚧\s*\|\s*([A-Z0-9-]+)\s*\|/u);
    if (boardRowMatch) {
      entries.push({
        taskId: boardRowMatch[1]!.trim(),
        lineNumber: index + 1,
      });
      continue;
    }
    const tableMatch = line.match(
      /^\|\s*\d+\s*\|\s*`([^`]+)`\s*\|.*\|\s*🚧(?:\s+reported\s+activo|\s+En construcción|\s+En construccion)?\s*\|/u
    );
    if (tableMatch) {
      entries.push({
        taskId: tableMatch[1]!.trim(),
        lineNumber: index + 1,
      });
      continue;
    }
    const bulletMatch = line.match(/^- 🚧 (`?P[0-9A-Za-z.-]+`?)/u);
    if (bulletMatch) {
      entries.push({
        taskId: bulletMatch[1]!.replaceAll('`', '').trim(),
        lineNumber: index + 1,
      });
      continue;
    }
    if (/^- Estado:\s*🚧/u.test(line)) {
      entries.push({
        taskId: null,
        lineNumber: index + 1,
      });
    }
  }
  return entries;
};

const formatTrackingEntry = (entry: TrackingActiveEntry): string =>
  entry.taskId ? `${entry.taskId}@L${entry.lineNumber}` : `line_${entry.lineNumber}`;

export const appendTrackingActionableContext = (params: {
  repoRoot: string;
  message: string;
}): string => {
  for (const candidate of TRACKING_CANDIDATE_FILES) {
    const candidatePath = resolve(params.repoRoot, candidate);
    if (!existsSync(candidatePath)) {
      continue;
    }
    const source = readFileSync(candidatePath, 'utf8');
    const entries = collectTrackingActiveEntriesFromMarkdown(source);
    if (entries.length === 0) {
      continue;
    }
    const preview = entries.slice(0, 3).map(formatTrackingEntry).join(', ');
    const overflow = entries.length > 3 ? ` (+${entries.length - 3} more)` : '';
    return `${params.message} active_entries=${preview}${overflow} tracking_source=${candidate}`;
  }
  return params.message;
};

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
        message:
          v.code === 'TRACKING_CANONICAL_IN_PROGRESS_INVALID'
            ? appendTrackingActionableContext({
              repoRoot: params.repoRoot,
              message: v.message,
            })
            : v.message,
        severity: v.severity === 'ERROR' ? 'ERROR' : 'WARN',
      })
    );
};
