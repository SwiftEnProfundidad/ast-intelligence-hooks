import { runPrePushBackend } from './prePushBackend';

void runPrePushBackend().then((code) => {
  process.exit(code);
});
