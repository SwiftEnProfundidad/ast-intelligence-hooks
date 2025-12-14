
const Finding = require('../../domain/entities/Finding');
const { createProject, listSourceFiles } = require('../ast/ast-core');

class LegacyAnalyzerAdapter {
  constructor(legacyAnalyzerFunction, platform) {
    this.legacyAnalyzerFunction = legacyAnalyzerFunction;
    this.platform = platform;
  }

  async analyze(targetPath, options = {}) {
    try {

      const legacyFindings = [];
      const allFiles = listSourceFiles(targetPath);
      const project = createProject(allFiles);

      await this.legacyAnalyzerFunction(project, legacyFindings, this.platform);

      const findings = this.convertToFindings(legacyFindings);

      return findings;

    } catch (error) {
      return [];
    }
  }

  async analyzeFiles(files, options = {}) {
    try {
      const legacyFindings = [];
      const project = createProject(files);

      await this.legacyAnalyzerFunction(project, legacyFindings, this.platform);

      return this.convertToFindings(legacyFindings);

    } catch (error) {
      return [];
    }
  }

  convertToFindings(legacyFindings) {
    return legacyFindings.map(legacy => {
      try {
        return new Finding(
          legacy.ruleId || 'unknown',
          legacy.severity || 'low',
          legacy.message || 'No message',
          legacy.filePath || 'unknown',
          legacy.line || 1,
          legacy.platform || this.platform
        );
      } catch (error) {
        return null;
      }
    }).filter(f => f !== null);
  }
}

module.exports = LegacyAnalyzerAdapter;
