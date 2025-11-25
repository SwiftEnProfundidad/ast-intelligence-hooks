// ===== LEGACY ANALYZER ADAPTER =====
// Infrastructure Layer - Adapter Pattern
// Adapts legacy AST analyzers to work with new Domain entities

const Finding = require('../../domain/entities/Finding');
const { createProject, listSourceFiles } = require('../ast/ast-core');

class LegacyAnalyzerAdapter {
  constructor(legacyAnalyzerFunction, platform) {
    this.legacyAnalyzerFunction = legacyAnalyzerFunction;
    this.platform = platform;
  }

  async analyze(targetPath, options = {}) {
    try {
      // Legacy analyzers expect (project, findings, platform)
      // We need to create project and findings array

      const legacyFindings = [];
      const allFiles = listSourceFiles(targetPath);
      const project = createProject(allFiles);

      // Call legacy analyzer with correct signature
      await this.legacyAnalyzerFunction(project, legacyFindings, this.platform);

      // Convert legacy findings to Domain entities
      const findings = this.convertToFindings(legacyFindings);

      return findings;

    } catch (error) {
      console.error(`[LegacyAnalyzerAdapter] Error for ${this.platform}:`, error.message);
      return [];
    }
  }

  async analyzeFiles(files, options = {}) {
    // For staged files analysis - need to create project with only these files
    try {
      const legacyFindings = [];
      const project = createProject(files);

      // Call legacy analyzer
      await this.legacyAnalyzerFunction(project, legacyFindings, this.platform);

      return this.convertToFindings(legacyFindings);

    } catch (error) {
      console.error(`[LegacyAnalyzerAdapter] Error analyzing files for ${this.platform}:`, error.message);
      return [];
    }
  }

  convertToFindings(legacyFindings) {
    return legacyFindings.map(legacy => {
      try {
        // Legacy format: { ruleId, severity, message, filePath, line, platform }
        return new Finding(
          legacy.ruleId || 'unknown',
          legacy.severity || 'low',
          legacy.message || 'No message',
          legacy.filePath || 'unknown',
          legacy.line || 1,
          legacy.platform || this.platform
        );
      } catch (error) {
        console.error('[LegacyAnalyzerAdapter] Error converting finding:', error.message);
        return null;
      }
    }).filter(f => f !== null);
  }
}

module.exports = LegacyAnalyzerAdapter;

