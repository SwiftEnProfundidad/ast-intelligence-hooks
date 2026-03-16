export const writeInfo = (message: string): void => {
  process.stdout.write(`${message}\n`);
};

export const writeError = (message: string): void => {
  process.stderr.write(`${message}\n`);
};

export const withOptionalLocation = (message: string, location?: string): string => {
  if (!location || location.trim().length === 0) {
    return message;
  }
  return `${message} -> ${location}`;
};
