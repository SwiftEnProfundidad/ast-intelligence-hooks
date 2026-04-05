export type SystemNotificationPayload = {
  title: string;
  message: string;
  subtitle?: string;
  soundName?: string;
};

export type SystemNotificationEmitResult =
  | { delivered: true; reason: 'delivered' | 'stderr-fallback' }
  | { delivered: false; reason: 'disabled' | 'muted' | 'unsupported-platform' | 'command-failed' };
