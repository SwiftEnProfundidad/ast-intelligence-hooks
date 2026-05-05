import type {
  PumukiCriticalNotificationEvent,
  SystemNotificationPayload,
} from './framework-menu-system-notifications-types';
import { getCurrentPumukiVersion } from '../integrations/lifecycle/packageInfo';
import { resolveBlockedCauseSummary } from './framework-menu-system-notifications-cause';
import { resolveBlockedRemediation } from './framework-menu-system-notifications-remediation';
import { truncateNotificationText } from './framework-menu-system-notifications-text';

export {
  resolveBlockedCauseSummary,
} from './framework-menu-system-notifications-cause';
export {
  resolveBlockedRemediation,
} from './framework-menu-system-notifications-remediation';

export const resolveBlockedImpactSummary = (
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>,
  causeCode: string
): string => {
  if (causeCode === 'EVIDENCE_GATE_BLOCKED') {
    return 'El gate no deja avanzar hasta revalidar la evidencia y la gobernanza del repo.';
  }
  if (causeCode === 'TRACKING_CANONICAL_IN_PROGRESS_INVALID') {
    return 'El tracking canónico bloquea el avance hasta dejar una única tarea activa real.';
  }
  if (causeCode === 'TRACKING_CANONICAL_SOURCE_CONFLICT') {
    return 'Las fuentes de tracking no coinciden y el loop enterprise no puede decidir autoridad.';
  }
  if (causeCode === 'PRE_PUSH_UPSTREAM_MISSING') {
    return 'No puedes publicar el cambio hasta fijar upstream en la rama actual.';
  }
  if (causeCode === 'EVIDENCE_STALE') {
    return `La evidencia de ${event.stage} ya no describe el estado real del repo.`;
  }
  return `No se puede continuar en ${event.stage} hasta resolver el bloqueo detectado.`;
};

const buildPinnedPumukiCommand = (params: {
  repoRoot: string;
  executableAndArgs: string;
}): string =>
  `npx --yes --package pumuki@${getCurrentPumukiVersion({ repoRoot: params.repoRoot })} ${params.executableAndArgs}`;

export const resolveBlockedCommand = (params: {
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>;
  repoRoot: string;
  causeCode: string;
}): string => {
  switch (params.causeCode) {
    case 'EVIDENCE_MISSING':
    case 'EVIDENCE_INVALID':
    case 'EVIDENCE_CHAIN_INVALID':
    case 'EVIDENCE_STALE':
      return buildPinnedPumukiCommand({
        repoRoot: params.repoRoot,
        executableAndArgs: `pumuki sdd validate --stage=${params.event.stage} --json`,
      });
    case 'EVIDENCE_ACTIVE_RULE_IDS_EMPTY_FOR_CODE_CHANGES':
    case 'EVIDENCE_SKILLS_CONTRACT_INCOMPLETE':
    case 'EVIDENCE_PLATFORM_SKILLS_SCOPE_INCOMPLETE':
    case 'EVIDENCE_PLATFORM_SKILLS_BUNDLES_MISSING':
    case 'EVIDENCE_PLATFORM_CRITICAL_SKILLS_RULES_MISSING':
    case 'EVIDENCE_CROSS_PLATFORM_CRITICAL_ENFORCEMENT_INCOMPLETE':
      return `${buildPinnedPumukiCommand({
        repoRoot: params.repoRoot,
        executableAndArgs: 'pumuki policy reconcile --strict --apply --json',
      })} && ${buildPinnedPumukiCommand({
        repoRoot: params.repoRoot,
        executableAndArgs: `pumuki sdd validate --stage=${params.event.stage} --json`,
      })}`;
    case 'TRACKING_CANONICAL_IN_PROGRESS_INVALID':
    case 'TRACKING_CANONICAL_SOURCE_CONFLICT':
      return 'Editar PUMUKI-RESET-MASTER-PLAN.md y dejar una sola tarea activa válida.';
    case 'PRE_PUSH_UPSTREAM_MISSING':
      return 'git push --set-upstream origin <branch>';
    case 'GITFLOW_PROTECTED_BRANCH':
      return 'git checkout -b feature/<descripcion-kebab-case>';
    case 'EVIDENCE_GATE_BLOCKED':
      return `${buildPinnedPumukiCommand({
        repoRoot: params.repoRoot,
        executableAndArgs: 'pumuki policy reconcile --strict --apply --json',
      })} && ${buildPinnedPumukiCommand({
        repoRoot: params.repoRoot,
        executableAndArgs: `pumuki sdd validate --stage=${params.event.stage} --json`,
      })}`;
    default:
      return resolveBlockedRemediation(params.event, params.causeCode);
  }
};

export const buildBlockedActionableMessage = (params: {
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>;
  repoRoot: string;
  causeCode: string;
}): string => {
  const cause = resolveBlockedCauseSummary(params.event, params.causeCode);
  const impact = resolveBlockedImpactSummary(params.event, params.causeCode);
  const command = resolveBlockedCommand(params);
  const nextAction = resolveBlockedRemediation(params.event, params.causeCode);
  return [
    `Causa: ${cause}`,
    `Impacto: ${impact}`,
    `Comando: ${command}`,
    `Siguiente acción: ${nextAction}`,
  ].join('\n');
};

type BlockedPayloadContext =
  | string
  | {
      projectPrefix: string;
      repoRoot: string;
    };

const normalizeBlockedPayloadContext = (
  context: BlockedPayloadContext
): {
  projectPrefix: string;
  repoRoot: string;
} => {
  if (typeof context === 'string') {
    return {
      projectPrefix: context,
      repoRoot: '',
    };
  }

  return {
    projectPrefix: context.projectPrefix,
    repoRoot: context.repoRoot,
  };
};

export const buildGateBlockedPayload = (
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>,
  context: BlockedPayloadContext
): SystemNotificationPayload => {
  const params = normalizeBlockedPayloadContext(context);
  const causeCode = event.causeCode ?? 'GATE_BLOCKED';
  const causeSummary = truncateNotificationText(
    resolveBlockedCauseSummary(event, causeCode),
    72
  );
  const actionableMessage = buildBlockedActionableMessage({
    event,
    repoRoot: params.repoRoot,
    causeCode,
  });
  return {
    title: '🔴 Pumuki bloqueado',
    subtitle: `${params.projectPrefix}${event.stage} · ${causeSummary}`,
    message: actionableMessage,
    soundName: 'Basso',
  };
};
