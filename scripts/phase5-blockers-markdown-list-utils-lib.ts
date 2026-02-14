export const appendPhase5BlockersListValues = (params: {
  lines: string[];
  values: ReadonlyArray<string>;
}): void => {
  if (params.values.length === 0) {
    params.lines.push('- none');
    return;
  }

  for (const value of params.values) {
    params.lines.push(`- ${value}`);
  }
};
