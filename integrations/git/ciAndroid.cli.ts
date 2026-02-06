import { runCiAndroid } from './ciAndroid';

void runCiAndroid().then((code) => {
  process.exit(code);
});
