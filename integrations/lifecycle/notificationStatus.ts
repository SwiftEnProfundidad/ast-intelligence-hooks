import { resolveEffectiveSystemNotificationsConfig } from '../../scripts/framework-menu-system-notifications-effective-config';
import { resolveSystemNotificationGate } from '../../scripts/framework-menu-system-notifications-gate';

export type LifecycleNotificationStatus = {
  enabled: boolean;
  blockedDialogEnabled: boolean;
  channel: string;
  muteUntil: string | null;
  deliverable: boolean;
  disabledReason: string | null;
  remediation: string | null;
};

const remediationForReason = (reason: string | null): string | null => {
  if (reason === null) {
    return null;
  }
  if (reason === 'disabled') {
    return 'Activa notificaciones con la configuracion repo-local de Pumuki y elimina env vars PUMUKI_*NOTIFICATIONS que las deshabiliten.';
  }
  if (reason === 'muted') {
    return 'Quita el silencio temporal desde la notificacion o elimina muteUntil en .pumuki/system-notifications.json.';
  }
  if (reason === 'unsupported-platform') {
    return 'Usa el fallback stderr o configura un canal compatible para este sistema.';
  }
  return 'Revisa la configuracion de notificaciones y reejecuta pumuki status/doctor.';
};

export const readLifecycleNotificationStatus = (params: {
  repoRoot: string;
  env?: NodeJS.ProcessEnv;
  now?: () => number;
}): LifecycleNotificationStatus => {
  const env = params.env ?? process.env;
  const config = resolveEffectiveSystemNotificationsConfig({
    repoRoot: params.repoRoot,
  });
  const gate = resolveSystemNotificationGate({
    config,
    nowMs: (params.now ?? Date.now)(),
    env,
  });
  const disabledReason = gate?.reason ?? null;
  return {
    enabled: config.enabled,
    blockedDialogEnabled: config.blockedDialogEnabled === true,
    channel: config.channel,
    muteUntil: config.muteUntil ?? null,
    deliverable: gate === null,
    disabledReason,
    remediation: remediationForReason(disabledReason),
  };
};
