const fs = require('fs');
const glob = require('glob');
const { pushFileFinding } = require('../../ast-core');

class BDDRules {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }

    analyze(findings) {
        this.checkBDDFeatureFiles(findings);
    }

    checkBDDFeatureFiles(findings) {
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

        if (implementationFiles.length > 50 && featureFiles.length === 0) {
            pushFileFinding(
                'workflow.bdd.missing_feature_files',
                'critical',
                'PROJECT_ROOT',
                1,
                1,
                `🚨 CRITICAL: Proyecto con ${implementationFiles.length} archivos de implementación sin feature files (.feature).\n\nWORKFLOW BDD→TDD→IMPLEMENTATION VIOLADO:\n1. BDD (OBLIGATORIO): Crear feature files (.feature) con especificaciones Gherkin ANTES de cualquier código\n2. TDD: Escribir tests basados en las features\n3. Implementation: Implementar código que pase los tests\n\nACCIÓN REQUERIDA:\n- Crear feature files en features/ o specs/ con estructura:\n  Feature: Nombre de la funcionalidad\n    Scenario: Descripción del escenario\n      Given condición inicial\n      When acción\n      Then resultado esperado\n\nSin feature files, el proyecto NO sigue el workflow estándar BDD→TDD.`,
                findings
            );
        }

        if (implementationFiles.length > 20 && featureFiles.length < 3) {
            pushFileFinding(
                'workflow.bdd.insufficient_features',
                'high',
                'PROJECT_ROOT',
                1,
                1,
                `⚠️ HIGH: Solo ${featureFiles.length} feature files para ${implementationFiles.length} archivos de implementación.\n\nBDD requiere feature files para cada funcionalidad. Aumentar cobertura BDD antes de continuar.`,
                findings
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
                    findings
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
                    findings
                );
            }
        });
    }
}

module.exports = BDDRules;
