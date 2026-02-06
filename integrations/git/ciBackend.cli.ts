import { runCiBackend } from './ciBackend';

void runCiBackend().then((code) => {
  process.exit(code);
});
