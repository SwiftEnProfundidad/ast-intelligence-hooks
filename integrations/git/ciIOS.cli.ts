import { runCiIOS } from './ciIOS';

void runCiIOS().then((code) => {
  process.exit(code);
});
