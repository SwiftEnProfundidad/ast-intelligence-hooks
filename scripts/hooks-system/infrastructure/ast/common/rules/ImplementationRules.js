const fs = require('fs');
const glob = require('glob');
const { pushFileFinding } = require('../../../ast-core');

class ImplementationRules {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }

    analyze(findings) {
        this.checkImplementationAlignment(findings);
    }

    checkImplementationAlignment(findings) {
        const srcFiles = glob.sync('**/src/**/*.{ts,tsx,swift,kt}', {
            cwd: this.projectRoot,
            ignore: ['**/node_modules/**', '**/*test*'],
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
                        findings
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
                            findings
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
                        findings
                    );
                }
            }
        });
    }
}

module.exports = ImplementationRules;
