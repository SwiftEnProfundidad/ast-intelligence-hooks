import { runPrePushFrontend } from './prePushFrontend';

void runPrePushFrontend().then((code) => {
  process.exit(code);
});
