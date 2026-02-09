export const appendPhase5ExternalHandoffListSection = (params: {
  lines: string[];
  title: string;
  values: ReadonlyArray<string>;
}): void => {
  params.lines.push(params.title);
  params.lines.push('');
  if (params.values.length === 0) {
    params.lines.push('- none');
  } else {
    for (const value of params.values) {
      params.lines.push(`- ${value}`);
    }
  }
  params.lines.push('');
};
