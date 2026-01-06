const fs = require('fs');
const path = require('path');
const glob = require('glob');
const {
  detectFeatureFirstClean,
  detectTCA,
  detectVIPER,
  detectCleanSwift,
  detectMVP,
  detectMVVMC,
  detectMVVM,
  detectMVC,
} = require('../detectors/ios-architecture-strategies');

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
    detectFeatureFirstClean(files, this.patterns, this.projectRoot);
    console.log(`[Architecture Detection] Feature-First + Clean + DDD score: ${this.patterns.featureFirstClean}`);
  }

  detectTCA(files) {
    detectTCA(files, this.patterns);
  }

  detectVIPER(files) {
    detectVIPER(files, this.patterns, this.projectRoot);
  }

  detectCleanSwift(files) {
    detectCleanSwift(files, this.patterns);
  }

  detectMVP(files) {
    detectMVP(files, this.patterns);
  }

  detectMVVMC(files) {
    detectMVVMC(files, this.patterns);
  }

  detectMVVM(files) {
    detectMVVM(files, this.patterns);
  }

  detectMVC(files) {
    detectMVC(files, this.patterns);
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
