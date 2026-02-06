import { runPrePushIOS } from './prePushIOS';

void runPrePushIOS().then((code) => {
  process.exit(code);
});
