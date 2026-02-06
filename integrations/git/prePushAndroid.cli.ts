import { runPrePushAndroid } from './prePushAndroid';

void runPrePushAndroid().then((code) => {
  process.exit(code);
});
