const { BackendPatternDetector } = require('../BackendPatternDetector');

class LayeredArchitectureDetector extends BackendPatternDetector {
  detect(files) {
    let score = 0;

    const hasControllers = files.some(f => f.includes('/controllers/') || f.includes('.controller.ts'));
    const hasServices = files.some(f => f.includes('/services/') || f.includes('.service.ts'));
    const hasRepositories = files.some(f => f.includes('/repositories/') || f.includes('.repository.ts'));
    const hasDomain = files.some(f => f.includes('/domain/'));

    if (hasControllers && hasServices && hasRepositories) {
      if (!hasDomain) {
        score += 10;
      } else {
        score -= 5;
      }
    }

    return score;
  }
}

module.exports = { LayeredArchitectureDetector };

