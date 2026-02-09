import {
  parsePackageInstallSmokeMode,
  runPackageInstallSmoke,
} from './package-install-smoke-lib';

const mode = parsePackageInstallSmokeMode(process.argv.slice(2));
runPackageInstallSmoke(mode);
