const fs = require('fs');
const path = require('path');
const glob = require('glob');

const { FeatureFirstCleanDetector } = require('./detectors/FeatureFirstCleanDetector');
const { CleanArchitectureDetector } = require('./detectors/CleanArchitectureDetector');
const { OnionArchitectureDetector } = require('./detectors/OnionArchitectureDetector');
const { LayeredArchitectureDetector } = require('./detectors/LayeredArchitectureDetector');
const { CQRSDetector } = require('./detectors/CQRSDetector');
const { MVCDetector } = require('./detectors/MVCDetector');

class BackendArchitectureDetector {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.patterns = {
      featureFirstClean: 0,
      cleanArchitecture: 0,
      onionArchitecture: 0,
      layeredArchitecture: 0,
      cqrs: 0,
      mvc: 0
    };
    this.manualConfig = this.loadManualConfig();
  }

  loadManualConfig() {
    try {
      const configPath = path.join(this.projectRoot, '.ast-architecture.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        console.log('[Backend Architecture] Manual configuration loaded from .ast-architecture.json');
        return config.backend || null;
      }
    } catch (error) {
      console.warn('[Backend Architecture] Error loading .ast-architecture.json:', error.message);
    }
    return null;
  }

  detect() {
    if (this.manualConfig && this.manualConfig.architecturePattern) {
      const manualPattern = this.manualConfig.architecturePattern;
      console.log(`[Backend Architecture] Using manual configuration: ${manualPattern}`);
      return manualPattern;
    }

    const tsFiles = glob.sync('**/*.ts', {
      cwd: this.projectRoot,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.spec.ts', '**/*.test.ts']
    });

    if (tsFiles.length === 0) {
      return 'UNKNOWN';
    }

    const featureFirstDetector = new FeatureFirstCleanDetector(this.projectRoot);
    this.patterns.featureFirstClean = featureFirstDetector.detect(tsFiles);
    console.log(`[Architecture Detection] Feature-First + Clean + DDD score: ${this.patterns.featureFirstClean}`);

    const cleanDetector = new CleanArchitectureDetector(this.projectRoot);
    this.patterns.cleanArchitecture = cleanDetector.detect(tsFiles);

    const onionDetector = new OnionArchitectureDetector(this.projectRoot);
    this.patterns.onionArchitecture = onionDetector.detect(tsFiles, this.patterns.cleanArchitecture);

    const layeredDetector = new LayeredArchitectureDetector(this.projectRoot);
    this.patterns.layeredArchitecture = layeredDetector.detect(tsFiles);

    const cqrsDetector = new CQRSDetector(this.projectRoot);
    this.patterns.cqrs = cqrsDetector.detect(tsFiles);

    const mvcDetector = new MVCDetector(this.projectRoot);
    this.patterns.mvc = mvcDetector.detect(tsFiles);

    return this.getDominantPattern();
  }

  getDominantPattern() {
    const scores = Object.entries(this.patterns);
    scores.sort((a, b) => b[1] - a[1]);

    const [dominantName, dominantScore] = scores[0];

    if (dominantScore <= 0) {
      return 'UNKNOWN';
    }

    const patternMap = {
      featureFirstClean: 'FEATURE_FIRST_CLEAN_DDD',
      cleanArchitecture: 'CLEAN_ARCHITECTURE',
      onionArchitecture: 'ONION_ARCHITECTURE',
      layeredArchitecture: 'LAYERED_ARCHITECTURE',
      cqrs: 'CQRS',
      mvc: 'MVC'
    };

    return patternMap[dominantName] || 'UNKNOWN';
  }

  getDetectionSummary() {
    const totalScore = Object.values(this.patterns).reduce((a, b) => a + b, 0);
    const dominantPattern = this.getDominantPattern();
    const dominantScore = Math.max(...Object.values(this.patterns));

    const confidence = totalScore > 0 ? Math.round((dominantScore / totalScore) * 100) : 0;
    const warnings = [];

    if (dominantPattern === 'UNKNOWN') {
      warnings.push({
        severity: 'HIGH',
        message: 'Could not detect a clear architectural pattern in the Backend project.',
        recommendation: 'Define project architecture before continuing. Recommended: Feature-First + Clean + DDD, or Clean Architecture.'
      });
    }

    if (this.patterns.mvc > 0 && dominantPattern !== 'MVC') {
      warnings.push({
        severity: 'MEDIUM',
        message: 'MVC anti-pattern detected. Consider migrating to Clean Architecture.',
        recommendation: 'Refactor controllers to use services/use cases and separate business logic.'
      });
    }

    if (dominantPattern === 'LAYERED_ARCHITECTURE') {
      warnings.push({
        severity: 'LOW',
        message: 'Layered Architecture detected. Consider migrating to Clean Architecture for better testability and maintainability.',
        recommendation: 'Introduce domain layer and use dependency inversion.'
      });
    }

    return {
      pattern: dominantPattern,
      confidence,
      scores: { ...this.patterns },
      warnings
    };
  }
}

module.exports = { BackendArchitectureDetector };
