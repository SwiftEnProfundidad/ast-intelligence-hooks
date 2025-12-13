/**
 * Backend Architecture Pattern Detector
 *
 * Automatically detects the architectural pattern used in a Backend (NestJS) project:
 * - Clean Architecture (Hexagonal/Ports & Adapters)
 * - Onion Architecture
 * - Layered Architecture (3-tier)
 * - Feature-First + Clean + DDD
 * - CQRS (Command Query Responsibility Segregation)
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class BackendArchitectureDetector {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.patterns = {
      featureFirstClean: 0,  // Feature-First + DDD + Clean Architecture
      cleanArchitecture: 0,  // Clean Architecture (Hexagonal)
      onionArchitecture: 0,  // Onion Architecture
      layeredArchitecture: 0,  // 3-tier Layered
      cqrs: 0,
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
        console.log('[Backend Architecture] Manual configuration loaded from .ast-architecture.json');
        return config.backend || null;
      }
    } catch (error) {
      console.warn('[Backend Architecture] Error loading .ast-architecture.json:', error.message);
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
      console.log(`[Backend Architecture] Using manual configuration: ${manualPattern}`);
      return manualPattern;
    }

    // If no manual config, detect automatically
    const tsFiles = glob.sync('**/*.ts', {
      cwd: this.projectRoot,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.spec.ts', '**/*.test.ts']
    });

    if (tsFiles.length === 0) {
      return 'UNKNOWN';
    }

    // Analyze files to detect patterns
    // PRIORITY 1: Feature-First + DDD + Clean Architecture
    this.detectFeatureFirstClean(tsFiles);

    // PRIORITY 2: Other patterns
    this.detectCleanArchitecture(tsFiles);
    this.detectOnionArchitecture(tsFiles);
    this.detectLayeredArchitecture(tsFiles);
    this.detectCQRS(tsFiles);
    this.detectMVC(tsFiles);

    // Determine dominant pattern
    return this.getDominantPattern();
  }

  /**
   * Feature-First + DDD + Clean Architecture (PRIMARY PATTERN)
   * Signals:
   * - Structure: features/ with subfolders domain/, application/, infrastructure/, presentation/
   * - Domain contains: entities/, value-objects/, repositories/ (interfaces)
   * - Application contains: use-cases/, dtos/, events/
   * - Infrastructure contains: repositories/ (impl), database/, external-services/
   */
  detectFeatureFirstClean(files) {
    // Detect Feature-First folder structure
    const hasFeaturesFolders = files.some(f =>
      /\/features?\/\w+\/(domain|application|infrastructure|presentation)\//.test(f)
    );

    // Detect Clean Architecture layers within features
    const cleanArchFolders = ['domain', 'application', 'infrastructure', 'presentation'];
    const foundCleanFolders = cleanArchFolders.filter(folder => {
      return files.some(f => f.includes(`/${folder}/`));
    });

    // Detect DDD concepts
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

      // Detect Repository interfaces in domain
      if (file.includes('/domain/') && content.includes('interface ') && content.includes('Repository')) {
        this.patterns.featureFirstClean += 3;
      }

      // Detect Use Cases in application
      if (file.includes('/application/') || file.includes('/use-cases/')) {
        if (content.includes('UseCase') || content.includes('execute(')) {
          this.patterns.featureFirstClean += 2;
        }
      }

      // Detect Domain Events
      if (content.includes('Event') && (file.includes('/domain/') || file.includes('/application/'))) {
        this.patterns.featureFirstClean += 2;
      }
    });

    console.log(`[Architecture Detection] Feature-First + Clean + DDD score: ${this.patterns.featureFirstClean}`);
  }

  /**
   * Clean Architecture (Hexagonal/Ports & Adapters)
   * Signals:
   * - Domain, Application, Infrastructure, Presentation layers
   * - Repository pattern (interface in domain, impl in infrastructure)
   * - Use cases in application layer
   */
  detectCleanArchitecture(files) {
    // Detect layer structure
    const hasDomain = files.some(f => f.includes('/domain/'));
    const hasApplication = files.some(f => f.includes('/application/'));
    const hasInfrastructure = files.some(f => f.includes('/infrastructure/'));
    const hasPresentation = files.some(f => f.includes('/presentation/') || f.includes('/controllers/'));

    if (hasDomain && hasApplication && hasInfrastructure) {
      this.patterns.cleanArchitecture += 10;
    }

    // Detect Repository pattern (interface in domain, impl in infrastructure)
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
      this.patterns.cleanArchitecture += (domainRepos.length + infraRepos.length) * 2;
    }

    // Detect Use Cases
    const useCases = files.filter(f =>
      f.includes('/use-cases/') || f.includes('UseCase.ts') || (f.includes('/application/') && this.readFile(f).includes('UseCase'))
    );

    if (useCases.length > 0) {
      this.patterns.cleanArchitecture += useCases.length * 2;
    }

    // Detect Ports & Adapters (interfaces in domain, implementations in infrastructure)
    const interfaces = files.filter(f => 
      f.includes('/domain/') && (this.readFile(f).includes('interface ') || this.readFile(f).includes('abstract '))
    );

    if (interfaces.length > 0) {
      this.patterns.cleanArchitecture += interfaces.length;
    }
  }

  /**
   * Onion Architecture
   * Signals:
   * - Similar to Clean Architecture but with Domain Services layer
   * - Domain at center, dependencies point inward
   * - Domain Services, Application Services, Infrastructure Services
   */
  detectOnionArchitecture(files) {
    // Detect Domain Services
    const domainServices = files.filter(f =>
      f.includes('/domain/') && (f.includes('Service.ts') || this.readFile(f).includes('DomainService'))
    );

    if (domainServices.length > 0) {
      this.patterns.onionArchitecture += domainServices.length * 2;
    }

    // Detect Application Services
    const appServices = files.filter(f =>
      f.includes('/application/') && f.includes('Service.ts')
    );

    if (appServices.length > 0) {
      this.patterns.onionArchitecture += appServices.length;
    }

    // Onion is similar to Clean but emphasizes services
    if (this.patterns.cleanArchitecture > 5 && domainServices.length > 0) {
      this.patterns.onionArchitecture += 5;
    }
  }

  /**
   * Layered Architecture (3-tier)
   * Signals:
   * - Controllers, Services, Repositories layers
   * - Direct dependencies between layers
   * - No domain layer separation
   */
  detectLayeredArchitecture(files) {
    const hasControllers = files.some(f => f.includes('/controllers/') || f.includes('.controller.ts'));
    const hasServices = files.some(f => f.includes('/services/') || f.includes('.service.ts'));
    const hasRepositories = files.some(f => f.includes('/repositories/') || f.includes('.repository.ts'));

    if (hasControllers && hasServices && hasRepositories) {
      // Check if NOT Clean Architecture (no domain layer)
      const hasDomain = files.some(f => f.includes('/domain/'));
      
      if (!hasDomain) {
        this.patterns.layeredArchitecture += 10;
      } else {
        // Has domain, so it's Clean, not Layered
        this.patterns.layeredArchitecture -= 5;
      }
    }
  }

  /**
   * CQRS (Command Query Responsibility Segregation)
   * Signals:
   * - Separate Command and Query handlers
   * - Commands/, Queries/ folders
   * - ICommandHandler, IQueryHandler interfaces
   */
  detectCQRS(files) {
    const cqrsIndicators = [
      '/commands/',
      '/queries/',
      'CommandHandler',
      'QueryHandler',
      'ICommandHandler',
      'IQueryHandler',
      'Command<',
      'Query<'
    ];

    files.forEach(file => {
      const content = this.readFile(file);
      const matches = cqrsIndicators.filter(indicator =>
        file.includes(indicator) || content.includes(indicator)
      ).length;

      if (matches >= 2) {
        this.patterns.cqrs += matches * 2;
      }
    });

    // Detect CQRS folder structure
    const hasCommands = files.some(f => f.includes('/commands/'));
    const hasQueries = files.some(f => f.includes('/queries/'));

    if (hasCommands && hasQueries) {
      this.patterns.cqrs += 10;
    }
  }

  /**
   * MVC (Model-View-Controller) - Legacy/Anti-pattern for backend
   * Signals:
   * - Controllers with business logic
   * - Direct database access from controllers
   * - No service layer
   */
  detectMVC(files) {
    files.forEach(file => {
      if (!file.includes('controller') && !file.includes('Controller')) return;
      
      const content = this.readFile(file);
      
      // Anti-pattern: Controller with database access
      if (content.includes('@InjectRepository') || content.includes('TypeORM') || content.includes('Prisma')) {
        // Check if there's a service layer
        const hasService = files.some(f => 
          f.includes('.service.ts') && !f.includes('controller')
        );
        
        if (!hasService) {
          this.patterns.mvc += 3;
        }
      }

      // Anti-pattern: Controller with business logic
      if (content.match(/async\s+\w+\(.*\)\s*{[\s\S]{0,500}if\s*\(.*\)\s*{[\s\S]{0,500}if\s*\(.*\)\s*{/)) {
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

