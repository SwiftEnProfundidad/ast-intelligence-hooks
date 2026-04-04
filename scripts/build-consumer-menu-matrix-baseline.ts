import { runConsumerMenuMatrixBaselineBuildSafe } from './consumer-menu-matrix-baseline-builder-lib';

void runConsumerMenuMatrixBaselineBuildSafe(process.argv.slice(2)).then((exitCode) => {
  process.exitCode = exitCode;
});
