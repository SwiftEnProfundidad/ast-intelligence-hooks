export const extractDialogButton = (stdout: string): string | null => {
  const matches = [...stdout.matchAll(/button returned:\s*(.+)/gi)];
  if (matches.length === 0) {
    return null;
  }
  const raw = matches[matches.length - 1][1]?.trim() ?? '';
  const cleaned = raw
    .replace(/[,}]\s*$/g, '')
    .replace(/^["'\u201c]|[\u201d"']$/g, '')
    .trim();
  return cleaned.length > 0 ? cleaned : null;
};
