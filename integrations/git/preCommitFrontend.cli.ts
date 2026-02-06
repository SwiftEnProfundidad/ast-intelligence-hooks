import { runPreCommitFrontend } from './preCommitFrontend';

void runPreCommitFrontend().then((code) => {
  process.exit(code);
});
