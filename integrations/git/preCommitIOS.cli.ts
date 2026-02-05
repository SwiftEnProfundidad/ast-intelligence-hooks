import { runPreCommitIOS } from './preCommitIOS';

void runPreCommitIOS().then((code) => {
  process.exit(code);
});
