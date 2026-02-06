import { runCiFrontend } from './ciFrontend';

void runCiFrontend().then((code) => {
  process.exit(code);
});
