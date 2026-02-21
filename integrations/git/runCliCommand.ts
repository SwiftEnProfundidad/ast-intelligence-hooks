export const runCliCommand = (runner: () => Promise<number>): void => {
  void runner()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unexpected CLI runner error.';
      process.stderr.write(`${message}\n`);
      process.exitCode = 1;
    });
};
