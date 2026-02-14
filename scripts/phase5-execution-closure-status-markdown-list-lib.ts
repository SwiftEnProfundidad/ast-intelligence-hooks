export const appendPhase5ExecutionClosureStatusList = (
  lines: string[],
  title: string,
  values: ReadonlyArray<string>
): void => {
  lines.push(title);
  lines.push('');
  if (values.length === 0) {
    lines.push('- none');
  } else {
    for (const value of values) {
      lines.push(`- ${value}`);
    }
  }
  lines.push('');
};
