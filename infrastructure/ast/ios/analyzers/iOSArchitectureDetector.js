const fs = require('fs');
const path = require('path');
const glob = require('glob');

class iOSArchitectureDetector {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.patterns = {
      featureFirstClean: 0,  
      mvvm: 0,
      mvvmc: 0,
      mvp: 0,
      viper: 0,
      tca: 0,
      cleanSwift: 0,
      mvc: 0
    };
    this.manualConfig = this.loadManualConfig();
  }

  loadManualConfig() {
    try {
      const configPath = path.join(this.projectRoot, '.ast-architecture.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        console.log('[iOS Architecture] Manual configuration loaded from .ast-architecture.json');
        return config.ios || null;
      }
    } catch (error) {
      console.warn('[iOS Architecture] Error loading .ast-architecture.json:', error.message);
    }
    return null;
  }

  detect() {
    if (this.manualConfig && this.manualConfig.architecturePattern) {
      const manualPattern = this.manualConfig.architecturePattern;
      console.log(`[iOS Architecture] Using manual configuration: ${manualPattern}`);
      return manualPattern;
    }

    const swiftFiles = glob.sync('**/*.swift', {
      cwd: this.projectRoot,
      ignore: ['**/PodsCarthageBuild.buildDerivedData/**']
    });

    if (swiftFiles.length === 0) {
      return 'UNKNOWN';
    }

    this.detectFeatureFirstClean(swiftFiles);

    this.detectTCA(swiftFiles);
    this.detectVIPER(swiftFiles);
    this.detectCleanSwift(swiftFiles);
    this.detectMVP(swiftFiles);
    this.detectMVVMC(swiftFiles);
    this.detectMVVM(swiftFiles);
    this.detectMVC(swiftFiles);

    return this.getDominantPattern();
  }

  detectFeatureFirstClean(files) {
    const hasFeaturesFolders = files.some(f =>
      /\/Features?\/\w+\/(domain|application|infrastructure|presentation)\//.test(f)
    );

    const cleanArchFolders = ['domain', 'application', 'infrastructure', 'presentation'];
    const foundCleanFolders = cleanArchFolders.filter(folder => {
      return files.some(f => f.includes(`/${folder}/`));
    });

    const dddConcepts = files.filter(f =>
      f.includes('/entities/') ||
      f.includes('/value-objects/') ||
      f.includes('/use-cases/') ||
      f.includes('Entity.swift') ||
      f.includes('VO.swift') ||
      f.includes('UseCase.swift')
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
      const match = f.match(/\/Features?\/(\w+)\//);
      if (match) {
        featureNames.add(match[1]);
      }
    });

    if (featureNames.size >= 2) {
      this.patterns.featureFirstClean += featureNames.size * 4;
    }

    files.forEach(file => {
      const content = this.readFile(file);

      if (content.includes('struct ') && content.includes('VO')) {
        this.patterns.featureFirstClean += 2;
      }

      if (file.includes('Entity.swift') && content.includes('func ')) {
        this.patterns.featureFirstClean += 2;
      }

      if (file.includes('/domain/') && content.includes('protocol ') && content.includes('Repository')) {
        this.patterns.featureFirstClean += 3;
      }

      if (file.includes('/application/') && content.includes('UseCase')) {
        this.patterns.featureFirstClean += 2;
      }
    });

    console.log(`[Architecture Detection] Feature-First + Clean + DDD score: ${this.patterns.featureFirstClean}`);
  }

  detectTCA(files) {
    const tcaIndicators = [
      'import ComposableArchitecture',
      'Store<',
      'struct.*State',
      'enum.*Action',
      ': Reducer',
      'Effect<'
    ];

    files.forEach(file => {
      const content = this.readFile(file);
      const matches = tcaIndicators.filter(indicator =>
        new RegExp(indicator).test(content)
      ).length;

      if (matches >= 3) {
        this.patterns.tca += matches;
      }
    });
  }

  detectVIPER(files) {
    const viperFiles = files.filter(f =>
      /Presenter\.swift$|Interactor\.swift$|Router\.swift$|Entity\.swift$/.test(f)
    );

    if (viperFiles.length >= 4) {
      this.patterns.viper += viperFiles.length;
    }

    files.forEach(file => {
      const content = this.readFile(file);
      const viperProtocols = [
        'ViewProtocol',
        'PresenterProtocol',
        'InteractorProtocol',
        'RouterProtocol'
      ];

      const matches = viperProtocols.filter(proto =>
        content.includes(proto)
      ).length;

      if (matches >= 2) {
        this.patterns.viper += matches * 2;
      }
    });

    const viperFolders = ['View', 'Interactor', 'Presenter', 'Entity', 'Router'];
    const hasViperStructure = viperFolders.filter(folder => {
      const folderPath = path.join(this.projectRoot, folder);
      return fs.existsSync(folderPath);
    }).length;

    if (hasViperStructure >= 3) {
      this.patterns.viper += hasViperStructure * 3;
    }
  }

  detectCleanSwift(files) {
    const cleanSwiftFiles = files.filter(f =>
      /Models\.swift$/.test(f)
    );

    files.forEach(file => {
      const content = this.readFile(file);
      const cleanSwiftIndicators = [
        'DisplayLogic',
        'BusinessLogic',
        'PresentationLogic',
        'Request\\s*{',
        'Response\\s*{',
        'ViewModel\\s*{'
      ];

      const matches = cleanSwiftIndicators.filter(indicator =>
        new RegExp(indicator).test(content)
      ).length;

      if (matches >= 3) {
        this.patterns.cleanSwift += matches * 2;
      }
    });
  }

  detectMVP(files) {
    const presenterFiles = files.filter(f => /Presenter\.swift$/.test(f));
    const interactorFiles = files.filter(f => /Interactor\.swift$/.test(f));
    const routerFiles = files.filter(f => /Router\.swift$/.test(f));

    if (presenterFiles.length >= 2 && interactorFiles.length === 0 && routerFiles.length === 0) {
      this.patterns.mvp += presenterFiles.length * 3;
    }

    files.forEach(file => {
      const content = this.readFile(file);

      const hasMVPProtocols =
        content.includes('ViewProtocol') &&
        content.includes('PresenterProtocol') &&
        !content.includes('InteractorProtocol');

      if (hasMVPProtocols) {
        this.patterns.mvp += 3;
      }
    });
  }

  detectMVVMC(files) {
    const coordinatorFiles = files.filter(f => /Coordinator\.swift$/.test(f));

    if (coordinatorFiles.length >= 1) {
      this.patterns.mvvmc += coordinatorFiles.length * 3;
    }

    files.forEach(file => {
      const content = this.readFile(file);

      if (content.includes('protocol Coordinator') ||
          content.includes(': Coordinator') ||
          /func\s+start\(\)/.test(content) && /func\s+navigate/.test(content)) {
        this.patterns.mvvmc += 2;
      }
    });
  }

  detectMVVM(files) {
    const viewModelFiles = files.filter(f => /ViewModel\.swift$/.test(f));

    if (viewModelFiles.length >= 2) {
      this.patterns.mvvm += viewModelFiles.length * 2;
    }

    files.forEach(file => {
      const content = this.readFile(file);

      const mvvmIndicators = [
        '@Published',
        ': ObservableObject',
        'import Combine',
        'class.*ViewModel'
      ];

      const matches = mvvmIndicators.filter(indicator =>
        new RegExp(indicator).test(content)
      ).length;

      if (matches >= 2) {
        this.patterns.mvvm += matches;
      }
    });
  }

  detectMVC(files) {
    const viewControllerFiles = files.filter(f => /ViewController\.swift$/.test(f));
    const viewModelFiles = files.filter(f => /ViewModel\.swift$/.test(f));
    const presenterFiles = files.filter(f => /Presenter\.swift$/.test(f));
    const interactorFiles = files.filter(f => /Interactor\.swift$/.test(f));

    if (viewControllerFiles.length >= 2 &&
        viewModelFiles.length === 0 &&
        presenterFiles.length === 0 &&
        interactorFiles.length === 0) {

      viewControllerFiles.forEach(file => {
        const content = this.readFile(file);
        const lines = content.split('\n').length;

        if (lines > 300) {
          this.patterns.mvc += 3; 
        } else if (lines > 150) {
          this.patterns.mvc += 2;
        } else {
          this.patterns.mvc += 1;
        }
      });
    }
  }

  getDominantPattern() {
    const sorted = Object.entries(this.patterns)
      .sort((a, b) => b[1] - a[1])
      .filter(([_, score]) => score > 0);

    if (sorted.length === 0) {
      return 'UNKNOWN';
    }

    const [dominant, dominantScore] = sorted[0];

    if (dominant === 'mvc') {
      return 'MVC_LEGACY';
    }

    if (sorted.length > 1 && sorted[1][1] >= dominantScore * 0.7) {
      return 'MIXED'; 
    }

    return this.normalizePatternName(dominant);
  }

  normalizePatternName(pattern) {
    const mapping = {
      'featureFirstClean': 'FEATURE_FIRST_CLEAN_DDD', 
      'mvvm': 'MVVM',
      'mvvmc': 'MVVM-C',
      'mvp': 'MVP',
      'viper': 'VIPER',
      'tca': 'TCA',
      'cleanSwift': 'CLEAN_SWIFT',
      'mvc': 'MVC_LEGACY'
    };
    return mapping[pattern] || 'UNKNOWN';
  }

  readFile(file) {
    try {
      const filePath = path.join(this.projectRoot, file);
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      return '';
    }
  }

  getDetectionSummary() {
    const dominant = this.getDominantPattern();

    return {
      detected: dominant,
      scores: this.patterns,
      confidence: this.calculateConfidence(),
      warnings: this.getWarnings()
    };
  }

  calculateConfidence() {
    const total = Object.values(this.patterns).reduce((sum, val) => sum + val, 0);
    if (total === 0) return 0;

    const sorted = Object.values(this.patterns).sort((a, b) => b - a);
    const dominantScore = sorted[0];

    return Math.round((dominantScore / total) * 100);
  }

  getWarnings() {
    const warnings = [];
    const dominant = this.getDominantPattern();

    if (dominant === 'MIXED') {
      warnings.push({
        severity: 'CRITICAL',
        message: 'Múltiples patrones arquitectónicos detectados en el proyecto. Esto indica inconsistencia arquitectónica GRAVE que debe corregirse inmediatamente.',
        recommendation: `Refactorizar urgentemente para usar un único patrón arquitectónico consistente.

ACCIONES REQUERIDAS:
1. Auditar todos los módulos y determinar patrón dominante
2. Crear plan de migración para unificar arquitectura
3. Documentar decisión arquitectónica en docs/ARCHITECTURE.md
4. Configurar .ast-architecture.json con patrón elegido`
      });
    }

    if (dominant === 'UNKNOWN') {
      warnings.push({
        severity: 'HIGH',
        message: 'No se pudo detectar un patrón arquitectónico claro en el proyecto. Esto bloqueará commits en modo strict.',
        recommendation: `Definir arquitectura del proyecto ANTES de continuar:

OPCIONES PARA RESOLVER:
1. Implementar estructura base de algún patrón (MVVM, MVP, VIPER, TCA)
2. Crear archivo .ast-architecture.json en raíz del proyecto iOS especificando:
   {
     "ios": {
       "architecturePattern": "MVVM-C",
       "strictMode": true,
       "documentation": "docs/ARCHITECTURE.md"
     }
   }
3. Documentar decisión en docs/ARCHITECTURE.md
4. Bypass emergencia (NO recomendado): GIT_BYPASS_HOOK=1

PATRONES RECOMENDADOS:
- MVVM-C: Para apps modernas con SwiftUI/UIKit
- VIPER: Para apps enterprise grandes
- TCA: Para apps funcionales/reactivas
- Clean Swift: Para Clean Architecture estricta`
      });
    }

    if (dominant === 'MVC_LEGACY') {
      warnings.push({
        severity: 'MEDIUM',
        message: 'Patrón MVC legacy detectado con Massive View Controllers. Se acumulará como deuda técnica.',
        recommendation: `Planificar migración a arquitectura moderna:

DEUDA TÉCNICA DETECTADA:
- ViewControllers masivos (>300 líneas)
- Lógica de negocio mezclada con UI
- Difícil de testear y mantener

PLAN DE MIGRACIÓN SUGERIDO:
1. Identificar ViewControllers más problemáticos
2. Extraer lógica a ViewModels (MVVM)
3. Implementar Coordinators para navegación (MVVM-C)
4. Migrar gradualmente módulo por módulo
5. Documentar progreso y target date`
      });
    }

    return warnings;
  }
}

module.exports = { iOSArchitectureDetector };
