const { BackendPatternDetector } = require('../BackendPatternDetector');

class FeatureFirstCleanDetector extends BackendPatternDetector {
  detect(files) {
    let score = 0;

    const hasFeaturesFolders = files.some(f =>
      /\/features?\/\w+\/(domain|application|infrastructure|presentation)\//.test(f)
    );

    const cleanArchFolders = ['domain', 'application', 'infrastructure', 'presentation'];
    const foundCleanFolders = cleanArchFolders.filter(folder => {
      return files.some(f => f.includes(`/${folder}/`));
    });

    const dddConcepts = files.filter(f =>
      f.includes('/entities/') ||
      f.includes('/value-objects/') ||
      f.includes('/use-cases/') ||
      f.includes('/repositories/') ||
      f.includes('Entity.ts') ||
      f.includes('UseCase.ts') ||
      f.includes('Repository.ts') ||
      f.includes('ValueObject.ts')
    );

    if (hasFeaturesFolders) {
      score += 10;
    }

    if (foundCleanFolders.length >= 3) {
      score += foundCleanFolders.length * 3;
    }

    if (dddConcepts.length > 0) {
      score += dddConcepts.length * 2;
    }

    const featureNames = new Set();
    files.forEach(f => {
      const match = f.match(/\/features?\/(\w+)\
      if (match) {
        featureNames.add(match[1]);
      }
    });

    if (featureNames.size >= 2) {
      score += featureNames.size * 4;
    }

    files.forEach(file => {
      const content = this.readFile(file);

      if (file.includes('/domain/') && content.includes('interface ') && content.includes('Repository')) {
        score += 3;
      }

      if (file.includes('/application/') || file.includes('/use-cases/')) {
        if (content.includes('UseCase') || content.includes('execute(')) {
          score += 2;
        }
      }

      if (content.includes('Event') && (file.includes('/domain/') || file.includes('/application/'))) {
        score += 2;
      }
    });

    return score;
  }
}

module.exports = { FeatureFirstCleanDetector };

