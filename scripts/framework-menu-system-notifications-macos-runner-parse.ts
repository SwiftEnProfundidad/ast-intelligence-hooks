export const extractDialogButton = (stdout: string): string | null => {
  const match = stdout.match(/button returned:(.+)/i);
  if (!match || !match[1]) {
    return null;
  }
  return match[1].trim();
};
