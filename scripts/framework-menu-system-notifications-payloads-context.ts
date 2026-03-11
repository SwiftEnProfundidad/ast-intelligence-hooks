import { resolveProjectLabel } from './framework-menu-system-notifications-text';

export { resolveProjectLabel } from './framework-menu-system-notifications-text';

export const resolveNotificationProjectPrefix = (context?: {
  repoRoot?: string;
  projectLabel?: string;
}): string => {
  const projectLabel = resolveProjectLabel({
    repoRoot: context?.repoRoot,
    projectLabel: context?.projectLabel,
  });
  return projectLabel ? `${projectLabel} · ` : '';
};
