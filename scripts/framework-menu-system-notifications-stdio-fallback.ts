import type {
  SystemNotificationEmitResult,
  SystemNotificationPayload,
} from './framework-menu-system-notifications-types';
import { isTruthyEnvValue } from './framework-menu-system-notifications-env';

export const isStderrNotificationFallbackDisabled = (env: NodeJS.ProcessEnv): boolean =>
  isTruthyEnvValue(env.PUMUKI_DISABLE_STDERR_NOTIFICATIONS);

export const deliverStderrNotificationBanner = (params: {
  payload: SystemNotificationPayload;
  stderr?: NodeJS.WriteStream;
}): SystemNotificationEmitResult => {
  const stderr = params.stderr ?? process.stderr;
  const lines = [
    '[pumuki]',
    `title: ${params.payload.title}`,
    ...(params.payload.subtitle ? [`subtitle: ${params.payload.subtitle}`] : []),
    `message: ${params.payload.message}`,
  ];
  stderr.write(`${lines.join('\n')}\n`);
  return { delivered: true, reason: 'stderr-fallback' };
};
