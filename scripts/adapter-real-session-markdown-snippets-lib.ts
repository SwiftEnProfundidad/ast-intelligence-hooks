const markdownFence = (value: string): string => {
  return value.length > 0 ? value : '(empty)';
};

export const renderMarkdownFence = (value: string): string => {
  return markdownFence(value);
};

export const tailFromContent = (
  content: string | undefined,
  lines: number
): string => {
  if (!content) {
    return '(missing)';
  }

  const rows = content.split(/\r?\n/);
  return rows.slice(Math.max(rows.length - lines, 0)).join('\n').trimEnd() || '(empty)';
};
