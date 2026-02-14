export const parseVerdictFromMarkdown = (markdown: string): string | undefined => {
  const raw = markdown.match(/- verdict:\s*([A-Z_]+)/)?.[1]?.trim();
  return raw && raw.length > 0 ? raw : undefined;
};
