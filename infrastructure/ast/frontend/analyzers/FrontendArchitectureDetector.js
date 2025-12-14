
const fs = require('fs');
const path = require('path');
const glob = require('glob');

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

  /**
   * Loads manual configuration from .ast-architecture.json if exists
   * @returns {Object|null} Configuration or null
   */
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

  /**
   * Detects the dominant architectural pattern in the project
   * @returns {string} Pattern name
   */
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

  /**
   * Feature-First + DDD + Clean Architecture (PRIMARY PATTERN)
   * Signals:
   * - Structure: features/ with subfolders domain/, application/, infrastructure/, presentation/
   * - Domain contains: entities/, value-objects/, repositories/ (interfaces)
   * - Application contains: use-cases/, hooks/, stores/
   * - Presentation contains: components/, pages/
   */
  detectFeatureFirstClean(files) {
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
      f.includes('Repository.ts')
    );

    if (hasFeaturesFolders) {
      this.patterns.featureFirstClean += 10;
    }

    if (foundCleanFolders.length >= 3) {
      this.patterns.featureFirstClean += foundCleanFolders.length * 3;
    }

    if (dddConcepts.length > 0) {
      this.patterns.featureFirstClean += dddConcepts.length * 2;
    }

    const featureNames = new Set();
    files.forEach(f => {
      const match = f.match(/\/features?\/(\w+)\//);
      if (match) {
        featureNames.add(match[1]);
      }
    });

    if (featureNames.size >= 2) {
      this.patterns.featureFirstClean += featureNames.size * 4;
    }

    files.forEach(file => {
      const content = this.readFile(file);

      if (file.includes('/domain/') && content.includes('interface ') && content.includes('Repository')) {
        this.patterns.featureFirstClean += 3;
      }

      if (file.includes('/application/') || file.includes('/use-cases/')) {
        if (content.includes('UseCase') || content.includes('useCase')) {
          this.patterns.featureFirstClean += 2;
        }
      }

      if (file.includes('/hooks/') && file.includes('use') && file.endsWith('.ts')) {
        this.patterns.featureFirstClean += 1;
      }
    });

    console.log(`[Architecture Detection] Feature-First + Clean + DDD score: ${this.patterns.featureFirstClean}`);
  }

  /**
   * Component-Based Architecture
   * Signals:
   * - Components/ folder structure
   * - Reusable components
   * - Component composition
   */
  detectComponentBased(files) {
    const hasComponentsFolder = files.some(f => f.includes('/components/'));
    
    if (hasComponentsFolder) {
      this.patterns.componentBased += 10;
    }

    const componentFiles = files.filter(f =>
      f.includes('/components/') && (f.endsWith('.tsx') || f.endsWith('.jsx'))
    );

    if (componentFiles.length > 0) {
      this.patterns.componentBased += componentFiles.length;
    }

    files.forEach(file => {
      if (!file.includes('/components/')) return;
      
      const content = this.readFile(file);
      const componentImports = content.match(/from\s+['"]\.\.\/components\//g) || [];
      
      if (componentImports.length > 0) {
        this.patterns.componentBased += componentImports.length;
      }
    });
  }

  /**
   * Atomic Design Pattern
   * Signals:
   * - atoms/, molecules/, organisms/, templates/, pages/ folders
   * - Atomic design structure
   */
  detectAtomicDesign(files) {
    const atomicFolders = ['atoms', 'molecules', 'organisms', 'templates', 'pages'];
    
    const foundFolders = atomicFolders.filter(folder => {
      return files.some(f => f.includes(`/${folder}/`));
    });

    if (foundFolders.length >= 3) {
      this.patterns.atomicDesign += foundFolders.length * 5;
    }

    if (files.some(f => f.includes('/atoms/')) && 
        files.some(f => f.includes('/molecules/')) && 
        files.some(f => f.includes('/organisms/'))) {
      this.patterns.atomicDesign += 10;
    }
  }

  /**
   * State Management Pattern
   * Signals:
   * - Zustand stores
   * - Redux store/slices
   * - Context providers
   * - State management libraries
   */
  detectStateManagement(files) {
    files.forEach(file => {
      const content = this.readFile(file);

      if (content.includes('zustand') || content.includes('create(') && file.includes('store')) {
        this.patterns.stateManagement += 5;
      }

      if (content.includes('redux') || content.includes('@reduxjs/toolkit') || 
          file.includes('slice') || file.includes('reducer')) {
        this.patterns.stateManagement += 5;
      }

      if (content.includes('createContext') || content.includes('Context.Provider')) {
        this.patterns.stateManagement += 2;
      }

      if (file.includes('/stores/') || file.includes('/state/')) {
        this.patterns.stateManagement += 3;
      }
    });
  }

  /**
   * MVC (Model-View-Controller) - Anti-pattern for frontend
   * Signals:
   * - Components with business logic
   * - Direct API calls from components
   * - No separation of concerns
   */
  detectMVC(files) {
    files.forEach(file => {
      if (!file.includes('component') && !file.endsWith('.tsx') && !file.endsWith('.jsx')) return;
      
      const content = this.readFile(file);
      
      if (content.includes('fetch(') || content.includes('axios.') || content.includes('.get(')) {
        const hasHook = files.some(f => 
          f.includes('use') && f.endsWith('.ts') && !f.includes('component')
        );
        const hasService = files.some(f => 
          f.includes('service') || f.includes('api')
        );
        
        if (!hasHook && !hasService) {
          this.patterns.mvc += 3;
        }
      }

      if (content.match(/const\s+\w+\s*=\s*\(.*\)\s*=>\s*{[\s\S]{0,500}if\s*\(.*\)\s*{[\s\S]{0,500}if\s*\(.*\)\s*{[\s\S]{0,500}if\s*\(.*\)\s*{/)) {
        this.patterns.mvc += 2;
      }
    });
  }

  /**
   * Reads file content
   */
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

  /**
   * Determines the dominant pattern based on scores
   */
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

  /**
   * Returns detection summary with confidence and warnings
   */
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

