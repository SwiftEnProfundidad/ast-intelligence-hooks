import { runPreCommitAndroid } from './preCommitAndroid';

void runPreCommitAndroid().then((code) => {
  process.exit(code);
});
