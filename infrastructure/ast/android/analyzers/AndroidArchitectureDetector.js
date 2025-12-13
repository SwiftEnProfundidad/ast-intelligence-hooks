/**
 * Android Architecture Pattern Detector
 *
 * Automatically detects the architectural pattern used in an Android project:
 * - MVVM (Model-View-ViewModel)
 * - MVI (Model-View-Intent)
 * - MVP (Model-View-Presenter)
 * - Clean Architecture (Domain-Data-Presentation)
 * - Feature-First + Clean + DDD
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class AndroidArchitectureDetector {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.patterns = {
      featureFirstClean: 0,  // Feature-First + DDD + Clean Architecture
      mvvm: 0,
      mvi: 0,
      mvp: 0,
      cleanArchitecture: 0,
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
        console.log('[Android Architecture] Manual configuration loaded from .ast-architecture.json');
        return config.android || null;
      }
    } catch (error) {
      console.warn('[Android Architecture] Error loading .ast-architecture.json:', error.message);
    }
    return null;
  }

  /**
   * Detects the dominant architectural pattern in the project
   * @returns {string} Pattern name
   */
  detect() {
    // If manual config exists, use it (has priority)
    if (this.manualConfig && this.manualConfig.architecturePattern) {
      const manualPattern = this.manualConfig.architecturePattern;
      console.log(`[Android Architecture] Using manual configuration: ${manualPattern}`);
      return manualPattern;
    }

    // If no manual config, detect automatically
    const kotlinFiles = glob.sync('**/*.kt', {
      cwd: this.projectRoot,
      ignore: ['**/build/**', '**/.gradle/**', '**/node_modules/**']
    });

    if (kotlinFiles.length === 0) {
      return 'UNKNOWN';
    }

    // Analyze files to detect patterns
    // PRIORITY 1: Feature-First + DDD + Clean Architecture
    this.detectFeatureFirstClean(kotlinFiles);

    // PRIORITY 2: Other patterns
    this.detectMVVM(kotlinFiles);
    this.detectMVI(kotlinFiles);
    this.detectMVP(kotlinFiles);
    this.detectCleanArchitecture(kotlinFiles);
    this.detectMVC(kotlinFiles);

    // Determine dominant pattern
    return this.getDominantPattern();
  }

  /**
   * Feature-First + DDD + Clean Architecture (PRIMARY PATTERN)
   * Signals:
   * - Structure: features/ with subfolders domain/, data/, presentation/
   * - Domain contains: entities/, usecases/, repositories/ (interfaces)
   * - Data contains: repositories/ (impl), datasources/, dtos/
   * - Presentation contains: ui/, viewmodels/, composables/
   */
  detectFeatureFirstClean(files) {
    // Detect Feature-First folder structure
    const hasFeaturesFolders = files.some(f =>
      /\/features?\/\w+\/(domain|data|presentation)\//.test(f)
    );

    // Detect Clean Architecture layers within features
    const cleanArchFolders = ['domain', 'data', 'presentation'];
    const foundCleanFolders = cleanArchFolders.filter(folder => {
      return files.some(f => f.includes(`/${folder}/`));
    });

    // Detect DDD concepts
    const dddConcepts = files.filter(f =>
      f.includes('/entities/') ||
      f.includes('/usecases/') ||
      f.includes('/repositories/') ||
      f.includes('Entity.kt') ||
      f.includes('UseCase.kt') ||
      f.includes('Repository.kt')
    );

    // Scoring for Feature-First + Clean + DDD
    if (hasFeaturesFolders) {
      this.patterns.featureFirstClean += 10;
    }

    if (foundCleanFolders.length >= 3) {
      this.patterns.featureFirstClean += foundCleanFolders.length * 3;
    }

    if (dddConcepts.length > 0) {
      this.patterns.featureFirstClean += dddConcepts.length * 2;
    }

    // Detect feature names (bounded contexts)
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

    // Analyze file content for DDD validation
    files.forEach(file => {
      const content = this.readFile(file);

      // Detect Value Objects
      if (content.includes('data class ') && (content.includes('VO') || content.includes('ValueObject'))) {
        this.patterns.featureFirstClean += 2;
      }

      // Detect Entities with behavior (not anemic)
      if (file.includes('Entity.kt') && content.includes('fun ')) {
        this.patterns.featureFirstClean += 2;
      }

      // Detect Repository interfaces in domain
      if (file.includes('/domain/') && content.includes('interface ') && content.includes('Repository')) {
        this.patterns.featureFirstClean += 3;
      }

      // Detect Use Cases in domain
      if (file.includes('/usecases/') || (file.includes('/domain/') && content.includes('UseCase'))) {
        this.patterns.featureFirstClean += 2;
      }
    });

    console.log(`[Architecture Detection] Feature-First + Clean + DDD score: ${this.patterns.featureFirstClean}`);
  }

  /**
   * MVVM (Model-View-ViewModel)
   * Signals:
   * - ViewModel classes
   * - LiveData or StateFlow/SharedFlow
   * - Data binding or Compose
   */
  detectMVVM(files) {
    const mvvmIndicators = [
      'class.*ViewModel',
      'androidx.lifecycle.ViewModel',
      'LiveData',
      'StateFlow',
      'SharedFlow',
      'MutableLiveData',
      'MutableStateFlow'
    ];

    files.forEach(file => {
      const content = this.readFile(file);
      const matches = mvvmIndicators.filter(indicator =>
        new RegExp(indicator).test(content)
      ).length;

      if (matches >= 2) {
        this.patterns.mvvm += matches;
      }
    });

    // Detect ViewModel files
    const viewModelFiles = files.filter(f =>
      /ViewModel\.kt$/i.test(f)
    );

    if (viewModelFiles.length > 0) {
      this.patterns.mvvm += viewModelFiles.length * 3;
    }
  }

  /**
   * MVI (Model-View-Intent)
   * Signals:
   * - State/Intent/Effect sealed classes
   * - Unidirectional data flow
   * - Intent handling
   */
  detectMVI(files) {
    const mviIndicators = [
      'sealed class.*State',
      'sealed class.*Intent',
      'sealed class.*Effect',
      'sealed interface.*State',
      'sealed interface.*Intent',
      'fun handleIntent',
      'fun processIntent'
    ];

    files.forEach(file => {
      const content = this.readFile(file);
      const matches = mviIndicators.filter(indicator =>
        new RegExp(indicator).test(content)
      ).length;

      if (matches >= 3) {
        this.patterns.mvi += matches * 2;
      }
    });

    // Detect MVI structure files
    const mviFiles = files.filter(f =>
      /(State|Intent|Effect)\.kt$/i.test(f) && f.includes('/ui/')
    );

    if (mviFiles.length >= 2) {
      this.patterns.mvi += mviFiles.length * 3;
    }
  }

  /**
   * MVP (Model-View-Presenter)
   * Signals:
   * - Presenter classes
   * - View interfaces/contracts
   * - Contract/View/Presenter pattern
   */
  detectMVP(files) {
    const mvpIndicators = [
      'class.*Presenter',
      'interface.*View',
      'interface.*Contract',
      'class.*Contract'
    ];

    files.forEach(file => {
      const content = this.readFile(file);
      const matches = mvpIndicators.filter(indicator =>
        new RegExp(indicator).test(content)
      ).length;

      if (matches >= 2) {
        this.patterns.mvp += matches;
      }
    });

    // Detect Presenter files
    const presenterFiles = files.filter(f =>
      /Presenter\.kt$/i.test(f)
    );

    if (presenterFiles.length > 0) {
      this.patterns.mvp += presenterFiles.length * 3;
    }

    // Detect Contract files (MVP pattern)
    const contractFiles = files.filter(f =>
      /Contract\.kt$/i.test(f)
    );

    if (contractFiles.length > 0) {
      this.patterns.mvp += contractFiles.length * 2;
    }
  }

  /**
   * Clean Architecture (Domain-Data-Presentation)
   * Signals:
   * - Domain, Data, Presentation layers
   * - Repository pattern (interface in domain, impl in data)
   * - Use cases in domain
   */
  detectCleanArchitecture(files) {
    // Detect layer structure
    const hasDomain = files.some(f => f.includes('/domain/'));
    const hasData = files.some(f => f.includes('/data/'));
    const hasPresentation = files.some(f => f.includes('/presentation/') || f.includes('/ui/'));

    if (hasDomain && hasData && hasPresentation) {
      this.patterns.cleanArchitecture += 10;
    }

    // Detect Repository pattern (interface in domain, impl in data)
    const domainRepos = files.filter(f => 
      f.includes('/domain/') && f.includes('Repository') && fs.readFileSync(path.join(this.projectRoot, f), 'utf-8').includes('interface ')
    );
    const dataRepos = files.filter(f => 
      f.includes('/data/') && f.includes('Repository') && fs.readFileSync(path.join(this.projectRoot, f), 'utf-8').includes('class ')
    );

    if (domainRepos.length > 0 && dataRepos.length > 0) {
      this.patterns.cleanArchitecture += (domainRepos.length + dataRepos.length) * 2;
    }

    // Detect Use Cases
    const useCases = files.filter(f =>
      f.includes('/usecases/') || f.includes('UseCase.kt')
    );

    if (useCases.length > 0) {
      this.patterns.cleanArchitecture += useCases.length * 2;
    }
  }

  /**
   * MVC (Model-View-Controller) - Legacy/Anti-pattern
   * Signals:
   * - Activities/Fragments with business logic
   * - Direct database access from UI
   * - No ViewModels or Presenters
   */
  detectMVC(files) {
    files.forEach(file => {
      const content = this.readFile(file);
      
      // Anti-pattern: Activity/Fragment with database access
      if ((file.includes('Activity.kt') || file.includes('Fragment.kt')) &&
          (content.includes('RoomDatabase') || content.includes('SQLiteDatabase'))) {
        this.patterns.mvc += 3;
      }

      // Anti-pattern: Activity/Fragment with business logic
      if ((file.includes('Activity.kt') || file.includes('Fragment.kt')) &&
          content.match(/fun\s+(calculate|process|validate|transform)/)) {
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
    } catch (err) {
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

    if (dominantScore === 0) {
      return 'UNKNOWN';
    }

    const patternMap = {
      featureFirstClean: 'FEATURE_FIRST_CLEAN_DDD',
      mvvm: 'MVVM',
      mvi: 'MVI',
      mvp: 'MVP',
      cleanArchitecture: 'CLEAN_ARCHITECTURE',
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
        message: 'Could not detect a clear architectural pattern in the Android project.',
        recommendation: 'Define project architecture before continuing. Options: MVVM, MVI, MVP, Clean Architecture, or Feature-First + Clean + DDD.'
      });
    }

    if (this.patterns.mvc > 0 && dominantPattern !== 'MVC') {
      warnings.push({
        severity: 'MEDIUM',
        message: 'MVC anti-pattern detected. Consider migrating to MVVM, MVI, or MVP.',
        recommendation: 'Refactor Activities/Fragments to use ViewModels and separate business logic.'
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

module.exports = { AndroidArchitectureDetector };

