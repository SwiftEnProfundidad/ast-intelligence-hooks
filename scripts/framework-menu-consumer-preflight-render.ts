import { renderLegacyPanel, resolveLegacyPanelOuterWidth } from './framework-menu-legacy-audit-lib';
import { buildConsumerPreflightBlockingCauseLines } from './framework-menu-consumer-preflight-hints';
import { buildGovernanceNextActionSummaryLines } from '../integrations/lifecycle/governanceNextAction';
import { buildGovernanceObservationSummaryLines } from '../integrations/lifecycle/governanceObservationSnapshot';
import type {
  ConsumerPreflightRenderOptions,
  ConsumerPreflightResult,
} from './framework-menu-consumer-preflight-types';

const buildConsumerPreflightPanelLines = (
  preflight: ConsumerPreflightResult
): string[] => {
  const git = preflight.result.repo_state.git;
  const evidence = preflight.result.evidence;
  const lines = [
    'PRE-FLIGHT CHECK',
    `Stage: ${preflight.stage}`,
    `Branch: ${git.branch ?? 'unknown'} · Upstream: ${git.upstream ?? 'none'}`,
    `Worktree: dirty=${git.dirty ? 'yes' : 'no'} staged=${git.staged} unstaged=${git.unstaged} ahead=${git.ahead} behind=${git.behind}`,
    `Evidence: kind=${evidence.kind} age=${evidence.age_seconds ?? 'n/a'}s max=${evidence.max_age_seconds}s`,
    `Evidence source: source=${evidence.source.source} path=${evidence.source.path} digest=${evidence.source.digest ?? 'null'} generated_at=${evidence.source.generated_at ?? 'null'}`,
    `Gate: ${preflight.status} (${preflight.result.violations.length} violations)`,
  ];
  lines.push('', 'Governance truth:');
  lines.push(...buildGovernanceObservationSummaryLines(preflight.governanceObservation));
  lines.push('', 'Governance next action:');
  lines.push(...buildGovernanceNextActionSummaryLines(preflight.governanceNextAction));
  lines.push(...buildConsumerPreflightBlockingCauseLines(preflight));

  if (preflight.hints.length > 0) {
    lines.push('', 'Operational hints:');
    for (const hint of preflight.hints) {
      lines.push(`• ${hint}`);
    }
  }

  return lines;
};

export const formatConsumerPreflight = (
  preflight: ConsumerPreflightResult,
  options?: ConsumerPreflightRenderOptions
): string =>
  renderLegacyPanel(buildConsumerPreflightPanelLines(preflight), {
    width: options?.panelWidth ?? resolveLegacyPanelOuterWidth(),
    color: options?.color ?? (process.stdout.isTTY === true && process.env.NO_COLOR !== '1'),
  });
