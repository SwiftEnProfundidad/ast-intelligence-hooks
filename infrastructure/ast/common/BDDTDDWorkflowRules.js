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
      cwd: this.projectRoot,
      absolute: true
    });

      cwd: this.projectRoot,
      absolute: true
    });

    if (implementationFiles.length > 50 && featureFiles.length === 0) {
      pushFileFinding(
        'workflow.bdd.missing_feature_files',
        'critical',
        'PROJECT_ROOT',
        1,
        1,
        `🚨 CRITICAL: Proyecto con ${implementationFiles.length} archivos de implementación sin feature files (.feature). 
        
WORKFLOW BDD→TDD→IMPLEMENTATION VIOLADO:
1. BDD (OBLIGATORIO): Crear feature files (.feature) con especificaciones Gherkin ANTES de cualquier código
2. TDD: Escribir tests basados en las features
3. Implementation: Implementar código que pase los tests

ACCIÓN REQUERIDA:
- Crear feature files en features/ o specs/ con estructura:
  Feature: Nombre de la funcionalidad
    Scenario: Descripción del escenario
      Given condición inicial
      When acción
      Then resultado esperado

Sin feature files, el proyecto NO sigue el workflow estándar BDD→TDD.`,
        this.findings
      );
    }

    if (implementationFiles.length > 20 && featureFiles.length < 3) {
      pushFileFinding(
        'workflow.bdd.insufficient_features',
        'high',
        'PROJECT_ROOT',
        1,
        1,
        `⚠️ HIGH: Solo ${featureFiles.length} feature files para ${implementationFiles.length} archivos de implementación. 
        
BDD requiere feature files para cada funcionalidad. Aumentar cobertura BDD antes de continuar.`,
        this.findings
      );
    }

    featureFiles.forEach(featureFile => {
      const content = fs.readFileSync(featureFile, 'utf-8');

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
    const features = this.findFeatures();

    features.forEach(feature => {
      const hasTests = this.hasTestsForFeature(feature);
      const hasImplementation = this.hasImplementationForFeature(feature);

      if (hasImplementation && !hasTests) {
        pushFileFinding(
          'workflow.tdd.implementation_before_tests',
          'critical',
          feature.path,
          1,
          1,
          `🚨 CRITICAL: Feature '${feature.name}' tiene implementación sin tests. 
          
WORKFLOW BDD→TDD→IMPLEMENTATION VIOLADO:
- BDD: ✅ Feature file existe
- TDD: ❌ Tests NO existen (REQUERIDO antes de implementación)
- Implementation: ✅ Existe (pero NO debería existir sin tests)

ACCIÓN REQUERIDA:
1. Crear tests (.spec.ts, .test.ts, .spec.swift, etc.) basados en la feature
2. Los tests deben fallar inicialmente (red phase)
3. Luego implementar código para que pasen (green phase)
4. Refactorizar si es necesario

TDD requiere: Tests ANTES de implementación. Sin tests, no hay TDD.`,
          this.findings
        );
      }
    });

      cwd: this.projectRoot,
      absolute: false
    });

      cwd: this.projectRoot,
      absolute: false
    });

    const srcWithoutTests = srcFiles.filter(srcFile => {
      const baseName = path.basename(srcFile, path.extname(srcFile));
      return !testFiles.some(testFile => testFile.includes(baseName));
    });

    if (srcWithoutTests.length > 10) {
      pushFileFinding(
        'workflow.tdd.low_test_coverage',
        'critical',
        'PROJECT_ROOT',
        1,
        1,
        `🚨 CRITICAL: ${srcWithoutTests.length} archivos de implementación sin tests. 
        
TDD VIOLADO: TDD requiere tests para cada implementación.

WORKFLOW CORRECTO:
1. BDD: Feature file (.feature) ✅
2. TDD: Tests escritos ANTES de implementación ❌ (FALTAN)
3. Implementation: Código que pasa los tests ✅

ACCIÓN REQUERIDA:
- Crear tests para cada archivo de implementación
- Tests deben existir ANTES o al mismo tiempo que la implementación
- Sin tests, no hay TDD`,
        this.findings
      );
    } else if (srcWithoutTests.length > 0) {
      pushFileFinding(
        'workflow.tdd.low_test_coverage',
        'high',
        'PROJECT_ROOT',
        1,
        1,
        `⚠️ HIGH: ${srcWithoutTests.length} archivos de implementación sin tests. TDD requiere tests para cada implementación.`,
        this.findings
      );
    }
  }

  /**
   * 3. Implementation: Validar que sigue Feature-First + DDD + Clean
   */
  checkImplementationAlignment() {
      cwd: this.projectRoot,
      absolute: true
    });

    srcFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');

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
      cwd: this.projectRoot,
      absolute: true
    });

    const ratio = {
      features: features.length,
      tests: tests.length,
      implementation: impl.length
    };

    if (ratio.implementation > ratio.tests * 2 && ratio.implementation > 20) {
      pushFileFinding(
        'workflow.sequence.tests_lagging',
        'critical',
        'PROJECT_ROOT',
        1,
        1,
        `🚨 CRITICAL: Ratio Implementation:Tests desequilibrado (${ratio.implementation} implementaciones : ${ratio.tests} tests). 
        
WORKFLOW BDD→TDD→IMPLEMENTATION VIOLADO:
- BDD: ${ratio.features} features
- TDD: ${ratio.tests} tests (INSUFICIENTES)
- Implementation: ${ratio.implementation} archivos (DEMASIADOS sin tests)

TDD requiere: Tests primero, luego implementación. Ratio ideal: Tests >= Implementation.

ACCIÓN REQUERIDA:
- Escribir tests para cada implementación
- No crear nueva implementación sin tests correspondientes
- Seguir flujo: Feature → Tests → Implementation`,
        this.findings
      );
    } else if (ratio.implementation > ratio.tests * 2) {
      pushFileFinding(
        'workflow.sequence.tests_lagging',
        'high',
        'PROJECT_ROOT',
        1,
        1,
        `⚠️ HIGH: Ratio Implementation:Tests desequilibrado (${ratio.implementation}:${ratio.tests}). TDD requiere tests primero.`,
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

    featureFiles.forEach(featureFile => {
      const content = fs.readFileSync(featureFile, 'utf-8');
      const featureName = this.extractFeatureName(content);

      if (featureName) {
          cwd: this.projectRoot,
          absolute: true,
          nocase: true
        });

          cwd: this.projectRoot,
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
      cwd: this.projectRoot,
      nocase: true
    });
    return testFiles.length > 0;
  }

  hasImplementationForFeature(feature) {
      cwd: this.projectRoot,
    });
    return implFiles.length > 0;
  }
}

module.exports = { BDDTDDWorkflowRules };
