export type SystemNotificationPayload = {
  title: string;
  message: string;
  subtitle?: string;
  soundName?: string;
};

export type SystemNotificationEmitResult =
  | { delivered: true; reason: 'delivered' }
  | { delivered: false; reason: 'disabled' | 'muted' | 'unsupported-platform' | 'command-failed' };
