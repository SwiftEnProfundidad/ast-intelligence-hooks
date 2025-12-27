const path = require('path');
const glob = require('glob');
const { pushFileFinding } = require('../../ast-core');

class TDDRules {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }

    analyze(findings) {
        this.checkTDDTestCoverage(findings);
    }

    checkTDDTestCoverage(findings) {
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
                    `🚨 CRITICAL: Feature '${feature.name}' tiene implementación sin tests.\n\nWORKFLOW BDD→TDD→IMPLEMENTATION VIOLADO:\n- BDD: ✅ Feature file existe\n- TDD: ❌ Tests NO existen (REQUERIDO antes de implementación)\n- Implementation: ✅ Existe (pero NO debería existir sin tests)\n\nACCIÓN REQUERIDA:\n1. Crear tests (.spec.ts, .test.ts, .spec.swift, etc.) basados en la feature\n2. Los tests deben fallar inicialmente (red phase)\n3. Luego implementar código para que pasen (green phase)\n4. Refactorizar si es necesario\n\nTDD requiere: Tests ANTES de implementación. Sin tests, no hay TDD.`,
                    findings
                );
            }
        });

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
                'critical',
                'PROJECT_ROOT',
                1,
                1,
                `🚨 CRITICAL: ${srcWithoutTests.length} archivos de implementación sin tests.\n\nTDD VIOLADO: TDD requiere tests para cada implementación.\n\nWORKFLOW CORRECTO:\n1. BDD: Feature file (.feature) ✅\n2. TDD: Tests escritos ANTES de implementación ❌ (FALTAN)\n3. Implementation: Código que pasa los tests ✅\n\nACCIÓN REQUERIDA:\n- Crear tests para cada archivo de implementación\n- Tests deben existir ANTES o al mismo tiempo que la implementación\n- Sin tests, no hay TDD`,
                findings
            );
        } else if (srcWithoutTests.length > 0) {
            pushFileFinding(
                'workflow.tdd.low_test_coverage',
                'high',
                'PROJECT_ROOT',
                1,
                1,
                `⚠️ HIGH: ${srcWithoutTests.length} archivos de implementación sin tests. TDD requiere tests para cada implementación.`,
                findings
            );
        }
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

module.exports = TDDRules;
