/**
 * BDD → TDD → Implementation Workflow Rules
 *
 * Valida que el proyecto sigue el workflow:
 * 1. BDD: Feature files (.feature) con Gherkin specs
 * 2. TDD: Tests escritos ANTES de implementación
 * 3. Implementation: Código siguiendo Feature-First + DDD + Clean Architecture
 *
 * Este es el workflow ESTÁNDAR para todos los proyectos.
 */

const { pushFinding, pushFileFinding } = require('../ast-core');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

class BDDTDDWorkflowRules {
  constructor(findings, projectRoot) {
    this.findings = findings;
    this.projectRoot = projectRoot;
  }

  analyze() {
    this.checkBDDFeatureFiles();
    this.checkTDDTestCoverage();
    this.checkImplementationAlignment();
    this.checkWorkflowSequence();
    this.checkFeatureTestImplementationTriad();
  }

  /**
   * 1. BDD: Validar que existen feature files con especificaciones
   */
  checkBDDFeatureFiles() {
    const featureFiles = glob.sync('**/*.feature', {
      cwd: this.projectRoot,
      ignore: ['**/node_modules/**', '**/build/**', '**/dist/**'],
      absolute: true
    });

    const implementationFiles = glob.sync('**/*.{swift,kt,ts,tsx}', {
      cwd: this.projectRoot,
      ignore: ['**/node_modules/**', '**/build/**', '**/dist/**', '**/*test*', '**/*spec*'],
      absolute: true
    });

    // Si hay muchos archivos de implementación pero pocos features
    if (implementationFiles.length > 50 && featureFiles.length === 0) {
      pushFileFinding(
        'workflow.bdd.missing_feature_files',
        'high',
        'PROJECT_ROOT',
        1,
        1,
        `Proyecto con ${implementationFiles.length} archivos de implementación sin feature files (.feature). Workflow debe empezar con BDD.`,
        this.findings
      );
    }

    if (implementationFiles.length > 20 && featureFiles.length < 3) {
      pushFileFinding(
        'workflow.bdd.insufficient_features',
        'medium',
        'PROJECT_ROOT',
        1,
        1,
        `Solo ${featureFiles.length} feature files para ${implementationFiles.length} archivos de implementación. Aumentar cobertura BDD.`,
        this.findings
      );
    }

    // Validar estructura de feature files
    featureFiles.forEach(featureFile => {
      const content = fs.readFileSync(featureFile, 'utf-8');

      // Feature debe tener al menos: Feature, Scenario, Given, When, Then
      const hasFeature = content.includes('Feature:');
      const hasScenario = content.includes('Scenario:');
      const hasGiven = content.includes('Given ');
      const hasWhen = content.includes('When ');
      const hasThen = content.includes('Then ');

      if (!hasFeature || !hasScenario) {
        pushFileFinding(
          'workflow.bdd.invalid_feature_structure',
          'high',
          featureFile,
          1,
          1,
          'Feature file sin estructura Gherkin correcta (Feature, Scenario, Given/When/Then)',
          this.findings
        );
      }

      if (hasScenario && (!hasGiven || !hasWhen || !hasThen)) {
        pushFileFinding(
          'workflow.bdd.incomplete_gherkin',
          'medium',
          featureFile,
          1,
          1,
          'Scenario sin estructura completa Given/When/Then',
          this.findings
        );
      }
    });
  }

  /**
   * 2. TDD: Validar que hay tests ANTES de implementación
   */
  checkTDDTestCoverage() {
    // Encontrar features sin tests correspondientes
    const features = this.findFeatures();

    features.forEach(feature => {
      const hasTests = this.hasTestsForFeature(feature);
      const hasImplementation = this.hasImplementationForFeature(feature);

      if (hasImplementation && !hasTests) {
        pushFileFinding(
          'workflow.tdd.implementation_before_tests',
          'high',
          feature.path,
          1,
          1,
          `Feature '${feature.name}' tiene implementación sin tests. TDD requiere tests ANTES de implementación.`,
          this.findings
        );
      }
    });

    // Validar que test files existen para cada archivo de implementación
    const srcFiles = glob.sync('**/src/**/*.{ts,tsx,swift,kt}', {
      cwd: this.projectRoot,
      ignore: ['**/*test*', '**/*spec*', '**/node_modules/**'],
      absolute: false
    });

    const testFiles = glob.sync('**/*.{test,spec}.{ts,tsx,swift,kt}', {
      cwd: this.projectRoot,
      ignore: ['**/node_modules/**'],
      absolute: false
    });

    const srcWithoutTests = srcFiles.filter(srcFile => {
      const baseName = path.basename(srcFile, path.extname(srcFile));
      return !testFiles.some(testFile => testFile.includes(baseName));
    });

    if (srcWithoutTests.length > 10) {
      pushFileFinding(
        'workflow.tdd.low_test_coverage',
        'high',
        'PROJECT_ROOT',
        1,
        1,
        `${srcWithoutTests.length} archivos de implementación sin tests. TDD requiere tests para cada implementación.`,
        this.findings
      );
    }
  }

  /**
   * 3. Implementation: Validar que sigue Feature-First + DDD + Clean
   */
  checkImplementationAlignment() {
    const srcFiles = glob.sync('**/src/**/*.{ts,tsx,swift,kt}', {
      cwd: this.projectRoot,
      ignore: ['**/node_modules/**', '**/*test*'],
      absolute: true
    });

    srcFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');

      // Validar que NO hay lógica de negocio en presentation/controllers
      if (file.includes('/presentation/') || file.includes('/controllers/')) {
        const hasComplexLogic =
          (content.match(/func\s+\w+[\s\S]{200,}?}/g) || []).length > 0 ||
          content.includes('for ') || content.includes('while ') ||
          (content.match(/if\s*\(/g) || []).length > 5;

        if (hasComplexLogic) {
          pushFileFinding(
            'workflow.implementation.presentation_business_logic',
            'high',
            file,
            1,
            1,
            'Presentation/Controllers con lógica de negocio compleja. Extraer a Use Cases (application layer).',
            this.findings
          );
        }
      }

      // Validar que domain NO tiene dependencias externas
      if (file.includes('/domain/')) {
        const frameworkImports = [
          'UIKit', 'SwiftUI', 'Alamofire', 'CoreData',
          '@nestjs', 'express', 'axios', 'react', 'next'
        ];

        frameworkImports.forEach(framework => {
          if (content.includes(framework)) {
            pushFileFinding(
              'workflow.implementation.domain_framework_dependency',
              'critical',
              file,
              1,
              1,
              `Domain layer depende de '${framework}'. Domain debe ser framework-agnostic (lógica pura).`,
              this.findings
            );
          }
        });
      }

      // Validar que hay interfaces/protocols en domain para repositories
      if (file.includes('Repository') && content.includes('class ') && !file.includes('/domain/')) {
        const hasInterface = content.includes('protocol ') || content.includes('interface ');

        if (!hasInterface) {
          pushFileFinding(
            'workflow.implementation.repository_without_interface',
            'high',
            file,
            1,
            1,
            'Repository implementation sin interface/protocol en domain. DDD requiere abstracción.',
            this.findings
          );
        }
      }
    });
  }

  /**
   * 4. Workflow Sequence: BDD → TDD → Implementation
   */
  checkWorkflowSequence() {
    const features = glob.sync('**/*.feature', { cwd: this.projectRoot, absolute: true });
    const tests = glob.sync('**/*.{test,spec}.{ts,tsx,swift,kt}', { cwd: this.projectRoot, absolute: true });
    const impl = glob.sync('**/src/**/*.{ts,tsx,swift,kt}', {
      cwd: this.projectRoot,
      ignore: ['**/*test*', '**/*spec*'],
      absolute: true
    });

    const ratio = {
      features: features.length,
      tests: tests.length,
      implementation: impl.length
    };

    // Ideal: Features <= Tests <= Implementation
    if (ratio.implementation > ratio.tests * 2) {
      pushFileFinding(
        'workflow.sequence.tests_lagging',
        'high',
        'PROJECT_ROOT',
        1,
        1,
        `Ratio Implementation:Tests desequilibrado (${ratio.implementation}:${ratio.tests}). TDD requiere tests primero.`,
        this.findings
      );
    }

    if (ratio.tests > 0 && ratio.features === 0) {
      pushFileFinding(
        'workflow.sequence.missing_bdd_specs',
        'medium',
        'PROJECT_ROOT',
        1,
        1,
        'Tests sin feature files BDD. Workflow debe empezar con especificaciones de comportamiento.',
        this.findings
      );
    }
  }

  /**
   * 5. Feature-Test-Implementation Triad
   */
  checkFeatureTestImplementationTriad() {
    const featureFiles = glob.sync('**/*.feature', { cwd: this.projectRoot, absolute: true });

    featureFiles.forEach(featureFile => {
      const content = fs.readFileSync(featureFile, 'utf-8');
      const featureName = this.extractFeatureName(content);

      if (featureName) {
        // Buscar tests correspondientes
        const testFiles = glob.sync(`**/*${featureName}*.{test,spec}.{ts,tsx,swift,kt}`, {
          cwd: this.projectRoot,
          absolute: true,
          nocase: true
        });

        // Buscar implementación correspondiente
        const implFiles = glob.sync(`**/*${featureName}*.{ts,tsx,swift,kt}`, {
          cwd: this.projectRoot,
          ignore: ['**/*test*', '**/*spec*', '**/*.feature'],
          absolute: true,
          nocase: true
        });

        if (testFiles.length === 0) {
          pushFileFinding(
            'workflow.triad.feature_without_tests',
            'high',
            featureFile,
            1,
            1,
            `Feature '${featureName}' sin tests correspondientes. BDD → TDD workflow roto.`,
            this.findings
          );
        }

        if (implFiles.length === 0 && testFiles.length > 0) {
          pushFileFinding(
            'workflow.triad.tests_without_implementation',
            'low',
            featureFile,
            1,
            1,
            `Feature '${featureName}' con tests pero sin implementación (OK si está en desarrollo).`,
            this.findings
          );
        }

        if (implFiles.length > 0 && testFiles.length === 0) {
          pushFileFinding(
            'workflow.triad.implementation_without_tests',
            'critical',
            featureFile,
            1,
            1,
            `Feature '${featureName}' con implementación pero SIN tests. Violación grave de TDD.`,
            this.findings
          );
        }
      }
    });
  }

  extractFeatureName(content) {
    const match = content.match(/Feature:\s*(.+)/);
    return match ? match[1].trim().replace(/\s+/g, '') : null;
  }

  findFeatures() {
    const features = [];
    const featureFolders = glob.sync('**/Features/*/', {
      cwd: this.projectRoot,
      absolute: true
    });

    featureFolders.forEach(folder => {
      const name = path.basename(folder);
      features.push({
        name,
        path: folder
      });
    });

    return features;
  }

  hasTestsForFeature(feature) {
    const testFiles = glob.sync(`**/*${feature.name}*.{test,spec}.{ts,tsx,swift,kt}`, {
      cwd: this.projectRoot,
      nocase: true
    });
    return testFiles.length > 0;
  }

  hasImplementationForFeature(feature) {
    const implFiles = glob.sync(`**/Features/${feature.name}/**/*.{ts,tsx,swift,kt}`, {
      cwd: this.projectRoot,
      ignore: ['**/*test*', '**/*spec*']
    });
    return implFiles.length > 0;
  }
}

module.exports = { BDDTDDWorkflowRules };
