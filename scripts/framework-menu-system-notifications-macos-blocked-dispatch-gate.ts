import type {
  PumukiCriticalNotificationEvent,
} from './framework-menu-system-notifications-types';

export const shouldDispatchBlockedMacOsDialog = (params: {
  event: PumukiCriticalNotificationEvent;
  repoRoot?: string;
}): params is {
  event: Extract<PumukiCriticalNotificationEvent, { kind: 'gate.blocked' }>;
  repoRoot: string;
} => params.event.kind === 'gate.blocked' && typeof params.repoRoot === 'string';
