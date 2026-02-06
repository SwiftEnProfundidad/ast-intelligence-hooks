import { runPreCommitBackend } from './preCommitBackend';

void runPreCommitBackend().then((code) => {
  process.exit(code);
});
