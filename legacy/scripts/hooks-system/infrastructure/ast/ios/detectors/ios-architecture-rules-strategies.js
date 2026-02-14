const { pushFinding } = require('../../ast-core');

function readFileSafe(file) {
    const fs = require('fs');
    try {
        return fs.readFileSync(file, 'utf-8');
    } catch (error) {
        if (process.env.DEBUG) {
            console.debug(`[iOSArchitectureRules] Failed to read file ${file}: ${error.message}`);
        }
        return '';
    }
}

function checkFeatureFirstCleanDDDRules(findings, files) {
    files.forEach(file => {
        const content = readFileSafe(file);

        if (file.includes('/domain/')) {
            const forbiddenImports = [
                'import UIKit',
                'import SwiftUI',
                'import Alamofire',
                'import CoreData'
            ];

            forbiddenImports.forEach(forbiddenImport => {
                if (content.includes(forbiddenImport)) {
                    pushFinding(findings, {
                        ruleId: 'ios.clean.domain_dependency_violation',
                        severity: 'critical',
                        message: `Domain layer tiene dependencia de ${forbiddenImport}. Domain debe ser independiente de frameworks.`,
                        filePath: file,
                        line: content.split('\n').findIndex(line => line.includes(forbiddenImport)) + 1,
                        suggestion: 'Remover dependencia. Domain solo debe contener lógica de negocio pura.'
                    });
                }
            });

            if (file.includes('/domain/') && !file.includes('/entities/') &&
                !file.includes('/value-objects/') && !file.includes('/interfaces/')) {
                pushFinding(findings, {
                    ruleId: 'ios.clean.domain_structure',
                    severity: 'critical',
                    message: 'Archivo en domain/ sin estructura correcta. Usar entities/, value-objects/, interfaces/',
                    filePath: file,
                    line: 1
                });
            }
        }

        if (file.includes('Entity.swift')) {
            const hasMethods = (content.match(/func\s+\w+/g) || []).length;
            const hasProperties = (content.match(/(let|var)\s+\w+:/g) || []).length;

            if (hasProperties > 3 && hasMethods === 0) {
                pushFinding(findings, {
                    ruleId: 'ios.ddd.anemic_entity',
                    severity: 'critical',
                    message: 'Entity anémica (solo properties, sin comportamiento). Añadir métodos de negocio.',
                    filePath: file,
                    line: 1,
                    suggestion: 'Entities deben encapsular lógica de negocio, no ser solo contenedores de datos.'
                });
            }
        }

        if (file.includes('VO.swift') || file.includes('ValueObject.swift')) {
            if (content.includes('var ') && !content.includes('private(set)')) {
                pushFinding(findings, {
                    ruleId: 'ios.ddd.mutable_value_object',
                    severity: 'critical',
                    message: 'Value Object con properties mutables. VOs deben ser inmutables (usar let).',
                    filePath: file,
                    line: 1,
                    suggestion: 'Cambiar var por let, o usar private(set) var si necesitas computed properties'
                });
            }

            if (!content.includes('init(') || !content.includes('throw')) {
                pushFinding(findings, {
                    ruleId: 'ios.ddd.value_object_no_validation',
                    severity: 'critical',
                    message: 'Value Object sin validación en init(). VOs deben garantizar invariantes.',
                    filePath: file,
                    line: 1,
                    suggestion: `init(_ value: String) throws {
    guard isValid(value) else {
        throw ValidationError.invalid
    }
    self.value = value
}`
                });
            }
        }

        if (file.includes('UseCase.swift')) {
            if (!content.includes('func execute(')) {
                pushFinding(findings, {
                    ruleId: 'ios.ddd.usecase_missing_execute',
                    severity: 'critical',
                    message: 'Use Case sin método execute(). Convención: func execute(input: Input) async throws -> Output',
                    filePath: file,
                    line: 1
                });
            }

            if (content.includes('UIKit') || content.includes('SwiftUI')) {
                pushFinding(findings, {
                    ruleId: 'ios.clean.usecase_ui_dependency',
                    severity: 'critical',
                    message: 'Use Case depende de UI framework. Application layer debe ser UI-agnostic.',
                    filePath: file,
                    line: 1
                });
            }
        }

        if (content.includes('Repository') && content.includes('class ') && !content.includes('protocol ')) {
            if (!file.includes('/infrastructure/')) {
                pushFinding(findings, {
                    ruleId: 'ios.clean.repository_wrong_layer',
                    severity: 'critical',
                    message: 'Repository implementation fuera de infrastructure/. Mover a infrastructure/repositories/',
                    filePath: file,
                    line: 1
                });
            }
        }

        if (content.includes('protocol ') && content.includes('Repository')) {
            if (!file.includes('/domain/')) {
                pushFinding(findings, {
                    ruleId: 'ios.clean.repository_interface_wrong_layer',
                    severity: 'critical',
                    message: 'Repository protocol fuera de domain/. Mover a domain/interfaces/',
                    filePath: file,
                    line: 1
                });
            }
        }

        if (file.includes('DTO.swift') || file.includes('Dto.swift')) {
            if (!file.includes('/application/')) {
                pushFinding(findings, {
                    ruleId: 'ios.clean.dto_wrong_layer',
                    severity: 'critical',
                    message: 'DTO fuera de application/. Mover a application/dto/',
                    filePath: file,
                    line: 1
                });
            }
        }

        const featureMatch = file.match(/\/Features?\/(\w+)\//);
        if (featureMatch) {
            const currentFeature = featureMatch[1];
            const importMatches = content.matchAll(/import\s+(\w+)/g);

            for (const match of importMatches) {
                const importedModule = match[1];

                if (files.some(f => f.includes(`/Features/${importedModule}/`)) && importedModule !== currentFeature) {
                    pushFinding(findings, {
                        ruleId: 'ios.ddd.feature_coupling',
                        severity: 'critical',
                        message: `Feature '${currentFeature}' importa feature '${importedModule}'. Bounded Contexts NO deben acoplarse.`,
                        filePath: file,
                        line: content.split('\n').findIndex(line => line.includes(`import ${importedModule}`)) + 1,
                        suggestion: 'Comunicar vía eventos de dominio o crear Shared Kernel en Core/'
                    });
                }
            }
        }

        if (file.includes('/infrastructure/')) {
            const methods = content.match(/func\s+\w+[\s\S]*?\{([\s\S]*?)(?=\n\s*func|\n})/g) || [];
            const complexMethods = methods.filter(m => {
                const lines = m.split('\n').length;
                return lines > 30 || (m.includes('if ') && m.includes('guard ') && m.includes('throw '));
            });

            if (complexMethods.length > 0) {
                pushFinding(findings, {
                    ruleId: 'ios.clean.infrastructure_business_logic',
                    severity: 'critical',
                    message: 'Infrastructure con lógica de negocio compleja. Mover a domain/ o application/',
                    filePath: file,
                    line: 1,
                    suggestion: 'Infrastructure solo debe adaptar tecnologías, no contener lógica de negocio'
                });
            }
        }

        if (file.includes('/presentation/')) {
            if (content.includes('Entity') && !content.includes('DTO') && !content.includes('Dto')) {
                pushFinding(findings, {
                    ruleId: 'ios.clean.presentation_uses_entity',
                    severity: 'critical',
                    message: 'Presentation usando Entities de domain directamente. Usar DTOs para desacoplar.',
                    filePath: file,
                    line: 1,
                    suggestion: 'Mapear Entities → DTOs antes de exponer a presentation layer'
                });
            }
        }
    });
}

function checkMVVMRules(findings, files) {
    files.forEach(file => {
        const content = readFileSafe(file);

        if (file.includes('ViewModel.swift')) {
            if (!content.includes('ObservableObject') && !content.includes('@Observable')) {
                pushFinding(findings, {
                    ruleId: 'ios.mvvm.viewmodel_not_observable',
                    severity: 'critical',
                    message: 'ViewModel debe conformar ObservableObject o usar @Observable macro (iOS 17+)',
                    filePath: file,
                    line: 1
                });
            }

            if (content.match(/import\s+UIKit/) && !content.includes('#if canImport(UIKit)')) {
                pushFinding(findings, {
                    ruleId: 'ios.mvvm.viewmodel_uikit_dependency',
                    severity: 'critical',
                    message: 'ViewModel NO debe depender de UIKit. Usar tipos agnósticos de plataforma.',
                    filePath: file,
                    line: content.split('\n').findIndex(line => line.includes('import UIKit')) + 1
                });
            }

            const classMatch = content.match(/class\s+\w+ViewModel/);
            if (classMatch && content.includes('var ') && !content.includes('@Published')) {
                pushFinding(findings, {
                    ruleId: 'ios.mvvm.missing_published',
                    severity: 'critical',
                    message: 'ViewModel properties que cambian deben usar @Published para notificar a la View',
                    filePath: file,
                    line: 1
                });
            }
        }

        if (file.includes('View.swift') || (content.includes('struct ') && content.includes(': View'))) {
            const hasBusinessLogic =
                /func\s+\w+\([^)]*\)\s*->\s*\w+\s*{[\s\S]{100,}/.test(content) ||
                content.includes('URLSession') ||
                content.includes('CoreData') ||
                /\.save\(|\.fetch\(|\.delete\(/.test(content);

            if (hasBusinessLogic) {
                pushFinding(findings, {
                    ruleId: 'ios.mvvm.view_business_logic',
                    severity: 'critical',
                    message: 'View contiene lógica de negocio. Mover al ViewModel.',
                    filePath: file,
                    line: 1
                });
            }
        }
    });
}

function checkMVPRules(findings, files) {
    files.forEach(file => {
        const content = readFileSafe(file);

        if (file.includes('View.swift') && !file.includes('ViewController')) {
            if (!content.includes('protocol ') && content.includes('View')) {
                pushFinding(findings, {
                    ruleId: 'ios.mvp.view_not_protocol',
                    severity: 'critical',
                    message: 'En MVP, View debe ser un protocol implementado por ViewController',
                    filePath: file,
                    line: 1
                });
            }
        }

        if (file.includes('Presenter.swift')) {
            if (content.includes('var view:') && !content.includes('weak var view')) {
                pushFinding(findings, {
                    ruleId: 'ios.mvp.presenter_strong_view',
                    severity: 'critical',
                    message: 'Presenter debe tener referencia weak a View para evitar retain cycles',
                    filePath: file,
                    line: content.split('\n').findIndex(line => line.includes('var view:')) + 1
                });
            }

            const hasLogic = content.split('\n').filter(line =>
                line.includes('func ') && !line.includes('viewDidLoad')
            ).length;

            if (hasLogic < 3) {
                pushFinding(findings, {
                    ruleId: 'ios.mvp.presenter_thin',
                    severity: 'critical',
                    message: 'Presenter parece tener poca lógica. En MVP, Presenter debe contener toda la lógica de presentación.',
                    filePath: file,
                    line: 1
                });
            }
        }

        if (file.includes('ViewController.swift')) {
            const hasBusinessLogic =
                content.includes('URLSession') ||
                content.includes('CoreData') ||
                /func\s+\w+\([^)]*\)\s*->\s*\w+\s*{[\s\S]{50,}/.test(content);

            if (hasBusinessLogic) {
                pushFinding(findings, {
                    ruleId: 'ios.mvp.viewcontroller_business_logic',
                    severity: 'critical',
                    message: 'ViewController NO debe contener lógica de negocio. Delegar al Presenter.',
                    filePath: file,
                    line: 1
                });
            }
        }
    });
}

function checkVIPERRules(findings, files) {
    files.forEach(file => {
        const content = readFileSafe(file);

        if (file.includes('View.swift') || (file.includes('ViewController.swift') && content.includes('ViewProtocol'))) {
            if (!content.includes('protocol ') || !content.includes('ViewProtocol')) {
                pushFinding(findings, {
                    ruleId: 'ios.viper.view_protocol',
                    severity: 'high',
                    message: 'En VIPER, View debe ser un protocol (ViewProtocol)',
                    filePath: file,
                    line: 1
                });
            }
        }

        if (file.includes('Interactor.swift')) {
            if (content.includes('UIKit') || content.includes('import SwiftUI')) {
                pushFinding(findings, {
                    ruleId: 'ios.viper.interactor_ui_dependency',
                    severity: 'high',
                    message: 'Interactor NO debe depender de frameworks de UI (UIKit, SwiftUI)',
                    filePath: file,
                    line: 1
                });
            }

            if (!content.includes('var presenter:') && !content.includes('var output:')) {
                pushFinding(findings, {
                    ruleId: 'ios.viper.interactor_no_output',
                    severity: 'high',
                    message: 'Interactor debe tener referencia a Presenter (output) para enviar resultados',
                    filePath: file,
                    line: 1
                });
            }
        }

        if (file.includes('Presenter.swift')) {
            const hasViewReference = content.includes('var view') || content.includes('weak var view');
            const hasInteractorReference = content.includes('var interactor');

            if (!hasViewReference || !hasInteractorReference) {
                pushFinding(findings, {
                    ruleId: 'ios.viper.presenter_missing_references',
                    severity: 'high',
                    message: 'Presenter debe tener referencias a View e Interactor',
                    filePath: file,
                    line: 1
                });
            }

            if (content.includes('URLSession') || content.includes('CoreData')) {
                pushFinding(findings, {
                    ruleId: 'ios.viper.presenter_business_logic',
                    severity: 'high',
                    message: 'Presenter NO debe contener lógica de negocio. Delegar al Interactor.',
                    filePath: file,
                    line: 1
                });
            }
        }

        if (file.includes('Router.swift') || file.includes('Wireframe.swift')) {
            const hasBusinessLogic =
                content.includes('URLSession') ||
                content.includes('CoreData') ||
                content.includes('UserDefaults');

            if (hasBusinessLogic) {
                pushFinding(findings, {
                    ruleId: 'ios.viper.router_business_logic',
                    severity: 'high',
                    message: 'Router NO debe contener lógica de negocio ni persistencia. Solo navegación.',
                    filePath: file,
                    line: 1
                });
            }
        }

        if (file.includes('Entity.swift')) {
            const hasMethods = (content.match(/func\s+/g) || []).length;
            if (hasMethods > 2) {
                pushFinding(findings, {
                    ruleId: 'ios.viper.entity_with_logic',
                    severity: 'medium',
                    message: 'Entity debe contener solo datos. Lógica debe estar en Interactor.',
                    filePath: file,
                    line: 1
                });
            }
        }
    });
}

function checkTCARules(findings, files) {
    files.forEach(file => {
        const content = readFileSafe(file);

        if (content.includes('struct ') && content.includes('State')) {
            if (content.includes('var ') && !content.includes('mutating func')) {
                pushFinding(findings, {
                    ruleId: 'ios.tca.mutable_state',
                    severity: 'medium',
                    message: 'State debe ser inmutable. Usar mutating func en Reducer para cambios.',
                    filePath: file,
                    line: 1
                });
            }
        }

        if (content.includes('Action')) {
            if (!content.includes('enum ') && content.includes('Action')) {
                pushFinding(findings, {
                    ruleId: 'ios.tca.action_not_enum',
                    severity: 'high',
                    message: 'Action debe ser enum para type-safety',
                    filePath: file,
                    line: 1
                });
            }
        }

        if (content.includes(': Reducer')) {
            if ((content.includes('URLSession') || content.includes('async ')) &&
                !content.includes('Effect')) {
                pushFinding(findings, {
                    ruleId: 'ios.tca.missing_effect',
                    severity: 'high',
                    message: 'Side effects en TCA deben usar Effect para manejo de async',
                    filePath: file,
                    line: 1
                });
            }
        }

        if (content.includes('Store<')) {
            const storeCount = (content.match(/Store</g) || []).length;
            if (storeCount > 2) {
                pushFinding(findings, {
                    ruleId: 'ios.tca.multiple_stores',
                    severity: 'medium',
                    message: 'Considerar unificar stores. TCA recomienda un Store por feature.',
                    filePath: file,
                    line: 1
                });
            }
        }
    });
}

function checkCleanSwiftRules(findings, files) {
    files.forEach(file => {
        const content = readFileSafe(file);

        if (file.includes('Models.swift')) {
            const hasRequest = content.includes('Request');
            const hasResponse = content.includes('Response');
            const hasViewModel = content.includes('ViewModel');

            if (!hasRequest || !hasResponse || !hasViewModel) {
                pushFinding(findings, {
                    ruleId: 'ios.clean_swift.incomplete_cycle',
                    severity: 'high',
                    message: 'Clean Swift requiere ciclo completo: Request → Response → ViewModel',
                    filePath: file,
                    line: 1
                });
            }
        }

        if (file.includes('Presenter.swift')) {
            if (content.includes('interactor?.')) {
                pushFinding(findings, {
                    ruleId: 'ios.clean_swift.bidirectional_flow',
                    severity: 'high',
                    message: 'Presenter NO debe llamar a Interactor directamente. Flujo debe ser unidireccional.',
                    filePath: file,
                    line: 1
                });
            }
        }
    });
}

function checkMVCLegacyRules(findings, files) {
    files.forEach(file => {
        const content = readFileSafe(file);

        if (file.includes('ViewController.swift')) {
            const lines = content.split('\n').length;

            if (lines > 500) {
                pushFinding(findings, {
                    ruleId: 'ios.mvc.massive_view_controller_critical',
                    severity: 'critical',
                    message: `Massive View Controller detectado (${lines} líneas). Refactorizar urgentemente a MVVM, MVP, VIPER o TCA.`,
                    filePath: file,
                    line: 1
                });
            } else if (lines > 300) {
                pushFinding(findings, {
                    ruleId: 'ios.mvc.massive_view_controller',
                    severity: 'high',
                    message: `View Controller grande (${lines} líneas). Considerar refactorizar a arquitectura moderna.`,
                    filePath: file,
                    line: 1
                });
            }

            const hasBusinessLogic =
                content.includes('URLSession') ||
                content.includes('CoreData') ||
                content.includes('UserDefaults') ||
                (content.match(/func\s+\w+\([^)]*\)\s*{[\s\S]{100,}}/g) || []).length > 5;

            if (hasBusinessLogic) {
                pushFinding(findings, {
                    ruleId: 'ios.mvc.business_logic_in_controller',
                    severity: 'high',
                    message: 'ViewController contiene lógica de negocio. Extraer a capa separada (ViewModel, Presenter, Interactor).',
                    filePath: file,
                    line: 1
                });
            }
        }
    });
}

function checkMixedArchitectureRules(findings, files) {
    pushFinding(findings, {
        ruleId: 'ios.architecture.mixed_patterns',
        severity: 'critical',
        message: 'Múltiples patrones arquitectónicos detectados en el proyecto. Esto indica inconsistencia arquitectónica grave.',
        filePath: 'PROJECT_ROOT',
        line: 1,
        suggestion: 'Refactorizar para usar un único patrón arquitectónico consistente en todo el proyecto.'
    });

    const patterns = {
        mvvm: files.filter(f => f.includes('ViewModel.swift')).length,
        mvp: files.filter(f => f.includes('Presenter.swift')).length,
        viper: files.filter(f => f.includes('Interactor.swift') || f.includes('Router.swift')).length
    };

    const activePatternsCount = Object.values(patterns).filter(count => count > 0).length;

    if (activePatternsCount >= 2) {
        pushFinding(findings, {
            ruleId: 'ios.architecture.inconsistent_structure',
            severity: 'high',
            message: `Se detectaron ${activePatternsCount} patrones diferentes. Estandarizar en un único patrón.`,
            filePath: 'PROJECT_ROOT',
            line: 1
        });
    }
}

module.exports = {
    checkFeatureFirstCleanDDDRules,
    checkMVVMRules,
    checkMVPRules,
    checkVIPERRules,
    checkTCARules,
    checkCleanSwiftRules,
    checkMVCLegacyRules,
    checkMixedArchitectureRules,
};
