const { BackendPatternDetector } = require('../BackendPatternDetector');

class CleanArchitectureDetector extends BackendPatternDetector {
  detect(files) {
    let score = 0;

    const hasDomain = files.some(f => f.includes('/domain/'));
    const hasApplication = files.some(f => f.includes('/application/'));
    const hasInfrastructure = files.some(f => f.includes('/infrastructure/'));

    if (hasDomain && hasApplication && hasInfrastructure) {
      score += 10;
    }

    const domainRepos = files.filter(f => {
      if (!f.includes('/domain/') || !f.includes('Repository')) return false;
      const content = this.readFile(f);
      return content.includes('interface ') || content.includes('abstract class ');
    });

    const infraRepos = files.filter(f => {
      if (!f.includes('/infrastructure/') || !f.includes('Repository')) return false;
      const content = this.readFile(f);
      return content.includes('class ') && content.includes('implements ');
    });

    if (domainRepos.length > 0 && infraRepos.length > 0) {
      score += (domainRepos.length + infraRepos.length) * 2;
    }

    const useCases = files.filter(f =>
      f.includes('/use-cases/') || f.includes('UseCase.ts') || (f.includes('/application/') && this.readFile(f).includes('UseCase'))
    );

    if (useCases.length > 0) {
      score += useCases.length * 2;
    }

    const interfaces = files.filter(f => 
      f.includes('/domain/') && (this.readFile(f).includes('interface ') || this.readFile(f).includes('abstract '))
    );

    if (interfaces.length > 0) {
      score += interfaces.length;
    }

    return score;
  }
}

module.exports = { CleanArchitectureDetector };

