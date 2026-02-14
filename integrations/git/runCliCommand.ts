export const runCliCommand = (runner: () => Promise<number>): void => {
  void runner()
    .then((code) => {
      process.exit(code);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unexpected CLI runner error.';
      console.error(message);
      process.exit(1);
    });
};
