export const readMcpPrePushStdin = (): string => {
  const envInput = process.env.PUMUKI_PRE_PUSH_STDIN;
  if (typeof envInput === 'string' && envInput.trim().length > 0) {
    return envInput;
  }
  return '';
};
