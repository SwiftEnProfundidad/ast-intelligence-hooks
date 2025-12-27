const fs = require('fs');
const glob = require('glob');
const { pushFileFinding } = require('../../ast-core');

class WorkflowRules {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }

    analyze(findings) {
        this.checkWorkflowSequence(findings);
        this.checkFeatureTestImplementationTriad(findings);
    }

    checkWorkflowSequence(findings) {
        const features = glob.sync('**/*.feature', { cwd: this.projectRoot, absolute: true });
        const tests = glob.sync('**/*.{test,spec}.{ts,tsx,swift,kt}', { cwd: this.projectRoot, absolute: true });
        const impl = glob.sync('**/src/**/*.{ts,tsx,swift,kt}', {
            cwd: this.projectRoot,
            ignore: ['**/*test*', '**/*spec*'],
            absolute: true
        });

        const isLibrarySelfAudit = process.env.AUDIT_LIBRARY_SELF === 'true' ||
            this.projectRoot.includes('ast-intelligence-hooks');
        if (isLibrarySelfAudit) {
            return;
        }

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
                `🚨 CRITICAL: Ratio Implementation:Tests desequilibrado (${ratio.implementation} implementaciones : ${ratio.tests} tests).\n\nWORKFLOW BDD→TDD→IMPLEMENTATION VIOLADO:\n- BDD: ${ratio.features} features\n- TDD: ${ratio.tests} tests (INSUFICIENTES)\n- Implementation: ${ratio.implementation} archivos (DEMASIADOS sin tests)\n\nTDD requiere: Tests primero, luego implementación. Ratio ideal: Tests >= Implementation.\n\nACCIÓN REQUERIDA:\n- Escribir tests para cada implementación\n- No crear nueva implementación sin tests correspondientes\n- Seguir flujo: Feature → Tests → Implementation`,
                findings
            );
        } else if (ratio.implementation > ratio.tests * 2) {
            pushFileFinding(
                'workflow.sequence.tests_lagging',
                'high',
                'PROJECT_ROOT',
                1,
                1,
                `⚠️ HIGH: Ratio Implementation:Tests desequilibrado (${ratio.implementation}:${ratio.tests}). TDD requiere tests primero.`,
                findings
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
                findings
            );
        }
    }

    checkFeatureTestImplementationTriad(findings) {
        const featureFiles = glob.sync('**/*.feature', { cwd: this.projectRoot, absolute: true });

        featureFiles.forEach(featureFile => {
            const content = fs.readFileSync(featureFile, 'utf-8');
            const featureName = this.extractFeatureName(content);

            if (featureName) {
                const testFiles = glob.sync(`**/*${featureName}*.{test,spec}.{ts,tsx,swift,kt}`, {
                    cwd: this.projectRoot,
                    absolute: true,
                    nocase: true
                });

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
                        findings
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
                        findings
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
                        findings
                    );
                }
            }
        });
    }

    extractFeatureName(content) {
        const match = content.match(/Feature:\s*(.+)/);
        return match ? match[1].trim().replace(/\s+/g, '') : null;
    }
}

module.exports = WorkflowRules;
