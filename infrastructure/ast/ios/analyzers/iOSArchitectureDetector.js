/**
 * iOS Architecture Pattern Detector
 * 
 * Detecta automáticamente el patrón arquitectónico usado en un proyecto iOS:
 * - MVVM (Model-View-ViewModel)
 * - MVVM-C (MVVM + Coordinator)
 * - MVP (Model-View-Presenter)
 * - VIPER (View-Interactor-Presenter-Entity-Router)
 * - TCA (The Composable Architecture)
 * - Clean Swift (VIP - View-Interactor-Presenter)
 * - MVC (Model-View-Controller) - Legacy/Anti-pattern
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

class iOSArchitectureDetector {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.patterns = {
      featureFirstClean: 0,  // ← PATRÓN PRINCIPAL (Feature-First + DDD + Clean Architecture)
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

  /**
   * Carga configuración manual de .ast-architecture.json si existe
   * @returns {Object|null} Configuración o null
   */
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

  /**
   * Detecta el patrón arquitectónico dominante en el proyecto
   * @returns {string} Nombre del patrón detectado
   */
  detect() {
    // Si hay configuración manual, usarla (tiene prioridad)
    if (this.manualConfig && this.manualConfig.architecturePattern) {
      const manualPattern = this.manualConfig.architecturePattern;
      console.log(`[iOS Architecture] Using manual configuration: ${manualPattern}`);
      return manualPattern;
    }

    // Si no hay config manual, detectar automáticamente
    const swiftFiles = glob.sync('**/*.swift', {
      cwd: this.projectRoot,
      ignore: ['**/Pods/**', '**/Carthage/**', '**/Build/**', '**/.build/**', '**/DerivedData/**']
    });

    if (swiftFiles.length === 0) {
      return 'UNKNOWN';
    }

    // Analizar archivos para detectar patrones
    // PRIORIDAD 1: Feature-First + DDD + Clean Architecture (PATRÓN PRINCIPAL)
    this.detectFeatureFirstClean(swiftFiles);
    
    // PRIORIDAD 2: Otros patrones
    this.detectTCA(swiftFiles);
    this.detectVIPER(swiftFiles);
    this.detectCleanSwift(swiftFiles);
    this.detectMVP(swiftFiles);
    this.detectMVVMC(swiftFiles);
    this.detectMVVM(swiftFiles);
    this.detectMVC(swiftFiles);

    // Determinar patrón dominante
    return this.getDominantPattern();
  }

  /**
   * Feature-First + DDD + Clean Architecture (PATRÓN PRINCIPAL)
   * Señales:
   * - Estructura: Features/ con subcarpetas domain/, application/, infrastructure/, presentation/
   * - Domain contiene: entities/, value-objects/, interfaces/
   * - Application contiene: use-cases/, dto/
   * - Bounded Contexts por feature
   */
  detectFeatureFirstClean(files) {
    // Detectar estructura de carpetas Feature-First
    const hasFeaturesFolders = files.some(f => 
      /\/Features?\/\w+\/(domain|application|infrastructure|presentation)\//.test(f)
    );

    // Detectar carpetas de Clean Architecture dentro de features
    const cleanArchFolders = ['domain', 'application', 'infrastructure', 'presentation'];
    const foundCleanFolders = cleanArchFolders.filter(folder => {
      return files.some(f => f.includes(`/${folder}/`));
    });

    // Detectar conceptos DDD
    const dddConcepts = files.filter(f => 
      f.includes('/entities/') || 
      f.includes('/value-objects/') || 
      f.includes('/use-cases/') ||
      f.includes('Entity.swift') ||
      f.includes('VO.swift') ||
      f.includes('UseCase.swift')
    );

    // Scoring para Feature-First + Clean + DDD
    if (hasFeaturesFolders) {
      this.patterns.featureFirstClean += 10; // Muy fuerte señal
    }

    if (foundCleanFolders.length >= 3) {
      this.patterns.featureFirstClean += foundCleanFolders.length * 3;
    }

    if (dddConcepts.length > 0) {
      this.patterns.featureFirstClean += dddConcepts.length * 2;
    }

    // Detectar Bounded Contexts (features separadas)
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

    // Analizar contenido de archivos para validar DDD
    files.forEach(file => {
      const content = this.readFile(file);
      
      // Detectar Value Objects
      if (content.includes('struct ') && content.includes('VO')) {
        this.patterns.featureFirstClean += 2;
      }

      // Detectar Entities con comportamiento (no anémicas)
      if (file.includes('Entity.swift') && content.includes('func ')) {
        this.patterns.featureFirstClean += 2;
      }

      // Detectar Repository interfaces en domain
      if (file.includes('/domain/') && content.includes('protocol ') && content.includes('Repository')) {
        this.patterns.featureFirstClean += 3;
      }

      // Detectar Use Cases en application
      if (file.includes('/application/') && content.includes('UseCase')) {
        this.patterns.featureFirstClean += 2;
      }
    });

    console.log(`[Architecture Detection] Feature-First + Clean + DDD score: ${this.patterns.featureFirstClean}`);
  }

  /**
   * TCA (The Composable Architecture)
   * Señales:
   * - import ComposableArchitecture
   * - Store<State, Action>
   * - Reducer protocol
   * - Effect
   */
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

  /**
   * VIPER (View-Interactor-Presenter-Entity-Router)
   * Señales:
   * - Archivos *Presenter.swift, *Interactor.swift, *Router.swift
   * - Protocols: *ViewProtocol, *PresenterProtocol, *InteractorProtocol
   * - Estructura de carpetas: View/, Interactor/, Presenter/, Entity/, Router/
   */
  detectVIPER(files) {
    const viperFiles = files.filter(f => 
      /Presenter\.swift$|Interactor\.swift$|Router\.swift$|Entity\.swift$/.test(f)
    );

    if (viperFiles.length >= 4) {
      this.patterns.viper += viperFiles.length;
    }

    // Buscar protocols VIPER
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

    // Buscar estructura de carpetas VIPER
    const viperFolders = ['View', 'Interactor', 'Presenter', 'Entity', 'Router'];
    const hasViperStructure = viperFolders.filter(folder => {
      const folderPath = path.join(this.projectRoot, folder);
      return fs.existsSync(folderPath);
    }).length;

    if (hasViperStructure >= 3) {
      this.patterns.viper += hasViperStructure * 3;
    }
  }

  /**
   * Clean Swift (VIP - View-Interactor-Presenter)
   * Similar a VIPER pero sin Router explícito
   * Señales:
   * - *ViewController.swift, *Interactor.swift, *Presenter.swift
   * - *Models.swift con Request/Response/ViewModel cycles
   * - Protocols: *DisplayLogic, *BusinessLogic, *PresentationLogic
   */
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

  /**
   * MVP (Model-View-Presenter)
   * Señales:
   * - Archivos *Presenter.swift
   * - Protocols: *ViewProtocol, *PresenterProtocol
   * - NO tiene Interactor (diferencia con VIPER)
   * - View es pasivo, Presenter contiene lógica
   */
  detectMVP(files) {
    const presenterFiles = files.filter(f => /Presenter\.swift$/.test(f));
    const interactorFiles = files.filter(f => /Interactor\.swift$/.test(f));
    const routerFiles = files.filter(f => /Router\.swift$/.test(f));

    // Si hay Presenters pero NO hay Interactors ni Routers, es MVP
    if (presenterFiles.length >= 2 && interactorFiles.length === 0 && routerFiles.length === 0) {
      this.patterns.mvp += presenterFiles.length * 3;
    }

    // Buscar protocols MVP
    files.forEach(file => {
      const content = this.readFile(file);
      
      // MVP usa ViewProtocol y PresenterProtocol pero no InteractorProtocol
      const hasMVPProtocols = 
        content.includes('ViewProtocol') && 
        content.includes('PresenterProtocol') &&
        !content.includes('InteractorProtocol');

      if (hasMVPProtocols) {
        this.patterns.mvp += 3;
      }
    });
  }

  /**
   * MVVM-C (MVVM + Coordinator)
   * Señales:
   * - Archivos *Coordinator.swift
   * - Protocol Coordinator con start(), navigate(to:)
   * - ViewModels + Coordinators pattern
   */
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

  /**
   * MVVM (Model-View-ViewModel)
   * Señales:
   * - Archivos *ViewModel.swift
   * - @Published properties
   * - ObservableObject
   * - Combine framework
   */
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

  /**
   * MVC (Model-View-Controller) - Legacy/Anti-pattern
   * Señales:
   * - ViewControllers masivos (>300 líneas)
   * - Lógica de negocio en ViewControllers
   * - NO tiene ViewModel, Presenter, ni Interactor
   */
  detectMVC(files) {
    const viewControllerFiles = files.filter(f => /ViewController\.swift$/.test(f));
    const viewModelFiles = files.filter(f => /ViewModel\.swift$/.test(f));
    const presenterFiles = files.filter(f => /Presenter\.swift$/.test(f));
    const interactorFiles = files.filter(f => /Interactor\.swift$/.test(f));

    // Si hay ViewControllers pero NO hay ViewModels, Presenters ni Interactors
    if (viewControllerFiles.length >= 2 && 
        viewModelFiles.length === 0 && 
        presenterFiles.length === 0 && 
        interactorFiles.length === 0) {
      
      // Analizar tamaño de ViewControllers (Massive View Controllers = MVC anti-pattern)
      viewControllerFiles.forEach(file => {
        const content = this.readFile(file);
        const lines = content.split('\n').length;
        
        if (lines > 300) {
          this.patterns.mvc += 3; // Massive View Controller
        } else if (lines > 150) {
          this.patterns.mvc += 2;
        } else {
          this.patterns.mvc += 1;
        }
      });
    }
  }

  /**
   * Determina el patrón dominante
   */
  getDominantPattern() {
    const sorted = Object.entries(this.patterns)
      .sort((a, b) => b[1] - a[1])
      .filter(([_, score]) => score > 0);

    if (sorted.length === 0) {
      return 'UNKNOWN';
    }

    const [dominant, dominantScore] = sorted[0];

    // Si MVC es dominante, alertar como LEGACY
    if (dominant === 'mvc') {
      return 'MVC_LEGACY';
    }

    // Si hay múltiples patrones con score similar, es un MIXED (anti-pattern)
    if (sorted.length > 1 && sorted[1][1] >= dominantScore * 0.7) {
      return 'MIXED'; // Anti-pattern: múltiples arquitecturas mezcladas
    }

    return this.normalizePatternName(dominant);
  }

  normalizePatternName(pattern) {
    const mapping = {
      'featureFirstClean': 'FEATURE_FIRST_CLEAN_DDD', // ← PATRÓN PRINCIPAL
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

  /**
   * Obtiene un resumen detallado de la detección
   */
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

