import { basename } from 'node:path';

export const normalizeNotificationText = (value: string): string =>
  value.replace(/\s+/g, ' ').trim();

export const truncateNotificationText = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }
  const limit = Math.max(1, maxLength - 1);
  const trimmed = value.slice(0, limit).trimEnd();
  const boundary = trimmed.lastIndexOf(' ');
  const shortened = boundary >= Math.floor(limit * 0.6)
    ? trimmed.slice(0, boundary).trimEnd()
    : trimmed;
  return `${shortened}…`;
};

export const resolveProjectLabel = (params: {
  repoRoot?: string;
  projectLabel?: string;
}): string | null => {
  const explicit = params.projectLabel
    ? normalizeNotificationText(params.projectLabel)
    : '';
  if (explicit.length > 0) {
    return truncateNotificationText(explicit, 28);
  }
  if (!params.repoRoot) {
    return null;
  }
  const inferred = normalizeNotificationText(basename(params.repoRoot));
  if (inferred.length === 0) {
    return null;
  }
  return truncateNotificationText(inferred, 28);
};
