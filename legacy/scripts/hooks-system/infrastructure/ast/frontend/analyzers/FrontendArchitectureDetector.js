const fs = require('fs');
const path = require('path');
const glob = require('glob');
const {
  detectFeatureFirstClean,
  detectComponentBased,
  detectAtomicDesign,
  detectStateManagement,
  detectMVC,
} = require('../detectors/frontend-architecture-strategies');

class FrontendArchitectureDetector {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.patterns = {
      featureFirstClean: 0,  // Feature-First + DDD + Clean Architecture
      componentBased: 0,     // Component-Based Architecture
      atomicDesign: 0,       // Atomic Design Pattern
      stateManagement: 0,    // State Management pattern
      mvc: 0
    };
    this.manualConfig = this.loadManualConfig();
  }

  loadManualConfig() {
    try {
      const configPath = path.join(this.projectRoot, '.ast-architecture.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        console.log('[Frontend Architecture] Manual configuration loaded from .ast-architecture.json');
        return config.frontend || null;
      }
    } catch (error) {
      console.warn('[Frontend Architecture] Error loading .ast-architecture.json:', error.message);
    }
    return null;
  }

  detect() {
    if (this.manualConfig && this.manualConfig.architecturePattern) {
      const manualPattern = this.manualConfig.architecturePattern;
      console.log(`[Frontend Architecture] Using manual configuration: ${manualPattern}`);
      return manualPattern;
    }

    const tsxFiles = glob.sync('**/*.{tsx,jsx}', {
      cwd: this.projectRoot,
      ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**', '**/*.test.{tsx,jsx}', '**/*.spec.{tsx,jsx}']
    });

    const tsFiles = glob.sync('**/*.ts', {
      cwd: this.projectRoot,
      ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**', '**/*.test.ts', '**/*.spec.ts']
    });

    const allFiles = [...tsxFiles, ...tsFiles];

    if (allFiles.length === 0) {
      return 'UNKNOWN';
    }

    this.detectFeatureFirstClean(allFiles);
    this.detectComponentBased(allFiles);
    this.detectAtomicDesign(allFiles);
    this.detectStateManagement(allFiles);
    this.detectMVC(allFiles);

    return this.getDominantPattern();
  }

  detectFeatureFirstClean(files) {
    detectFeatureFirstClean(this.projectRoot, files, this.patterns);
    console.log(`[Architecture Detection] Feature-First + Clean + DDD score: ${this.patterns.featureFirstClean}`);
  }

  detectComponentBased(files) {
    detectComponentBased(this.projectRoot, files, this.patterns);
  }

  detectAtomicDesign(files) {
    detectAtomicDesign(this.projectRoot, files, this.patterns);
  }

  detectStateManagement(files) {
    detectStateManagement(this.projectRoot, files, this.patterns);
  }

  detectMVC(files) {
    detectMVC(this.projectRoot, files, this.patterns);
  }

  readFile(relativePath) {
    try {
      const fullPath = path.join(this.projectRoot, relativePath);
      return fs.readFileSync(fullPath, 'utf-8');
    } catch (error) {
      if (process.env.DEBUG) {
        console.debug(`[FrontendArchitectureDetector] Failed to read file ${relativePath}: ${error.message}`);
      }
      return '';
    }
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
      componentBased: 'COMPONENT_BASED',
      atomicDesign: 'ATOMIC_DESIGN',
      stateManagement: 'STATE_MANAGEMENT',
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
        message: 'Could not detect a clear architectural pattern in the Frontend project.',
        recommendation: 'Define project architecture before continuing. Recommended: Feature-First + Clean + DDD, or Component-Based Architecture.'
      });
    }

    if (this.patterns.mvc > 0 && dominantPattern !== 'MVC') {
      warnings.push({
        severity: 'MEDIUM',
        message: 'MVC anti-pattern detected. Consider migrating to Feature-First or Component-Based Architecture.',
        recommendation: 'Refactor components to use hooks/services for business logic and API calls.'
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

module.exports = { FrontendArchitectureDetector };

