const { BackendPatternDetector } = require('../BackendPatternDetector');

class OnionArchitectureDetector extends BackendPatternDetector {
  detect(files, cleanArchitectureScore) {
    let score = 0;

    const domainServices = files.filter(f =>
      f.includes('/domain/') && (f.includes('Service.ts') || this.readFile(f).includes('DomainService'))
    );

    if (domainServices.length > 0) {
      score += domainServices.length * 2;
    }

    const appServices = files.filter(f =>
      f.includes('/application/') && f.includes('Service.ts')
    );

    if (appServices.length > 0) {
      score += appServices.length;
    }

    if (cleanArchitectureScore > 5 && domainServices.length > 0) {
      score += 5;
    }

    return score;
  }
}

module.exports = { OnionArchitectureDetector };

