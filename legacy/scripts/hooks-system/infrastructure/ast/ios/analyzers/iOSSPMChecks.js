const { pushFinding } = require('../../ast-core');
const fs = require('fs');
const path = require('path');

function buildContext(base) {
    return {
        ...base,
        setPackageSwiftPath: (p) => { base.packageSwiftPath = p; },
        getPackageSwiftPath: () => base.packageSwiftPath
    };
}

function checkPackageSwiftExists(ctx) {
    const packagePath = path.join(ctx.projectRoot, 'Package.swift');

    if (!fs.existsSync(packagePath)) {
        const swiftFiles = ctx.findSwiftFiles();

        if (swiftFiles.length > 50) {
            pushFinding(ctx.findings, {
                ruleId: 'ios.spm.missing_package_swift',
                severity: 'medium',
                message: `Proyecto con ${swiftFiles.length} archivos Swift sin Package.swift. Considerar modularización con SPM.`,
                filePath: 'PROJECT_ROOT',
                line: 1,
                suggestion: `Crear Package.swift para modularizar:

swift package init --type library
swift package init --type executable`
            });
        }
    } else {
        ctx.setPackageSwiftPath(packagePath);
    }
}

function checkFeatureModulesStructure(ctx) {
    const sources = path.join(ctx.projectRoot, 'Sources');
    if (!fs.existsSync(sources)) return;

    const modules = fs.readdirSync(sources).filter(dir => fs.statSync(path.join(sources, dir)).isDirectory());
    const featureModules = modules.filter(m => m.startsWith('Feature'));
    const coreModules = modules.filter(m => m.startsWith('Core'));

    if (modules.length > 5 && featureModules.length === 0) {
        pushFinding(ctx.findings, {
            ruleId: 'ios.spm.missing_feature_modules',
            severity: 'medium',
            message: `${modules.length} módulos sin naming convention Feature*. Considerar renombrar.`,
            filePath: 'Sources/',
            line: 1,
            suggestion: `Naming convention recomendado:

Sources/
├── FeatureOrders/
├── FeatureUsers/
├── FeatureAuth/
├── CoreNetworking/
├── CoreDatabase/
└── CoreUI/`
        });
    }

    if (modules.length > 10 && coreModules.length === 0) {
        pushFinding(ctx.findings, {
            ruleId: 'ios.spm.missing_core_modules',
            severity: 'medium',
            message: 'Proyecto grande sin módulos Core*. Considerar extraer código compartido.',
            filePath: 'Sources/',
            line: 1
        });
    }
}

function checkCoreModulesStructure(ctx) {
    const recommendedCoreModules = ['CoreNetworking', 'CoreDatabase', 'CoreUI', 'CoreModels'];
    const sources = path.join(ctx.projectRoot, 'Sources');
    if (!fs.existsSync(sources)) return;

    const existingModules = fs.readdirSync(sources);
    const missingCore = recommendedCoreModules.filter(core => !existingModules.includes(core));

    if (missingCore.length > 0 && existingModules.length > 8) {
        pushFinding(ctx.findings, {
            ruleId: 'ios.spm.recommended_core_modules_missing',
            severity: 'low',
            message: `Módulos Core recomendados faltantes: ${missingCore.join(', ')}`,
            filePath: 'Sources/',
            line: 1,
            suggestion: 'CoreNetworking, CoreDatabase, CoreUI ayudan a organizar código compartido'
        });
    }
}

function checkPublicAPIExposure(ctx) {
    const swiftFiles = ctx.findSwiftFiles();

    swiftFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');

        const publicCount = (content.match(/\bpublic\s+(class|struct|enum|func|var|let)/g) || []).length;
        const totalDeclarations = (content.match(/\b(class|struct|enum|func)\s+\w+/g) || []).length;

        if (totalDeclarations > 0) {
            const publicPercentage = (publicCount / totalDeclarations) * 100;

            if (publicPercentage > 70) {
                pushFinding(ctx.findings, {
                    ruleId: 'ios.spm.excessive_public_api',
                    severity: 'medium',
                    message: `${publicPercentage.toFixed(0)}% de declaraciones son public. Minimizar API pública del módulo.`,
                    filePath: file,
                    line: 1,
                    suggestion: `Usar internal por defecto, public solo para API externa:

// ❌ Todo public
public class Helper { ... }
public func process() { ... }

internal class Helper { ... }
public func process() { ... } // Solo lo necesario`
                });
            }
        }

        if (file.includes('/API/') && !content.includes('public ')) {
            pushFinding(ctx.findings, {
                ruleId: 'ios.spm.api_module_not_public',
                severity: 'medium',
                message: 'Módulo API sin declaraciones public. API module debe exponer funcionalidad.',
                filePath: file,
                line: 1
            });
        }
    });
}

function checkModuleDependencies(ctx) {
    const packageSwiftPath = ctx.getPackageSwiftPath();
    if (!packageSwiftPath) return;

    const content = fs.readFileSync(packageSwiftPath, 'utf-8');
    const targets = content.match(/\.target\([\s\S]*?name:\s*"([^"]+)"[\s\S]*?dependencies:\s*\[([\s\S]*?)\]/g);

    if (!targets) return;

    const dependencies = new Map();
    targets.forEach(target => {
        const name = target.match(/name:\s*"([^"]+)"/)?.[1];
        const deps = target.match(/dependencies:\s*\[([\s\S]*?)\]/)?.[1];
        if (name && deps) {
            const depList = deps.match(/"([^"]+)"/g)?.map(d => d.replace(/"/g, '')) || [];
            dependencies.set(name, depList);
        }
    });

    dependencies.forEach((deps, moduleName) => {
        deps.forEach(dep => {
            const depDeps = dependencies.get(dep) || [];
            if (depDeps.includes(moduleName)) {
                pushFinding(ctx.findings, {
                    ruleId: 'ios.spm.circular_dependency',
                    severity: 'critical',
                    message: `Dependencia circular detectada: ${moduleName} ↔ ${dep}`,
                    filePath: 'Package.swift',
                    line: 1,
                    suggestion: 'Romper dependencia circular extrayendo código compartido a módulo Core'
                });
            }
        });
    });

    dependencies.forEach((deps, moduleName) => {
        if (!moduleName.startsWith('Feature')) return;
        const featureDeps = deps.filter(d => d.startsWith('Feature'));
        if (featureDeps.length > 0) {
            pushFinding(ctx.findings, {
                ruleId: 'ios.spm.feature_to_feature_dependency',
                severity: 'high',
                message: `Feature module '${moduleName}' depende de otro Feature: ${featureDeps.join(', ')}. Extraer a Core.`,
                filePath: 'Package.swift',
                line: 1,
                suggestion: 'Features NO deben depender entre sí. Usar Core modules para compartir código.'
            });
        }
    });
}

function checkCrossModuleViolations(ctx) {
    const swiftFiles = ctx.findSwiftFiles();

    swiftFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');

        const internalImports = content.match(/@_implementationOnly\s+import\s+(\w+)/g);
        if (internalImports) {
            pushFinding(ctx.findings, {
                ruleId: 'ios.spm.implementation_only_import',
                severity: 'low',
                message: '@_implementationOnly import detectado. Es válido pero indica posible leak de abstracción.',
                filePath: file,
                line: ctx.findLineNumber(content, '@_implementationOnly'),
                suggestion: 'Verificar si el import es realmente necesario o hay leak de abstracción'
            });
        }

        if (content.includes('@testable import') && !file.includes('Tests/') && !file.includes('Test.swift')) {
            pushFinding(ctx.findings, {
                ruleId: 'ios.spm.testable_import_in_production',
                severity: 'high',
                message: '@testable import en código de producción. Solo debe usarse en tests.',
                filePath: file,
                line: ctx.findLineNumber(content, '@testable import')
            });
        }
    });
}

function checkPackageSwiftConfiguration(ctx) {
    const packageSwiftPath = ctx.getPackageSwiftPath();
    if (!packageSwiftPath) return;

    const content = fs.readFileSync(packageSwiftPath, 'utf-8');
    const toolsVersion = content.match(/\/\/\s*swift-tools-version:\s*(\d+\.\d+)/)?.[1];
    if (toolsVersion && parseFloat(toolsVersion) < 5.9) {
        pushFinding(ctx.findings, {
            ruleId: 'ios.spm.outdated_tools_version',
            severity: 'medium',
            message: `Swift tools version ${toolsVersion} desactualizado. Actualizar a 5.9+`,
            filePath: 'Package.swift',
            line: 1
        });
    }

    if (!content.includes('platforms:')) {
        pushFinding(ctx.findings, {
            ruleId: 'ios.spm.missing_platforms',
            severity: 'medium',
            message: 'Package.swift sin platforms: especificado. Definir versión mínima de iOS.',
            filePath: 'Package.swift',
            line: 1,
            suggestion: 'platforms: [.iOS(.v15), .macOS(.v12)]'
        });
    }
}

function checkTargetNaming(ctx) {
    const packageSwiftPath = ctx.getPackageSwiftPath();
    if (!packageSwiftPath) return;

    const content = fs.readFileSync(packageSwiftPath, 'utf-8');
    const targets = content.match(/\.target\([\s\S]*?name:\s*"([^"]+)"/g);
    if (!targets) return;

    const targetNames = targets.map(t => t.match(/name:\s*"([^"]+)"/)?.[1]).filter(Boolean);
    const hasInconsistentNaming = targetNames.some(name =>
        name.includes('_') || name.includes('-') || /[a-z][A-Z]/.test(name)
    );

    if (hasInconsistentNaming) {
        pushFinding(ctx.findings, {
            ruleId: 'ios.spm.inconsistent_target_naming',
            severity: 'low',
            message: 'Naming inconsistente en targets. Usar PascalCase sin separadores.',
            filePath: 'Package.swift',
            line: 1,
            suggestion: 'FeatureOrders, CoreNetworking (no Feature-Orders, Core_Networking)'
        });
    }
}

function checkProductConfiguration(ctx) {
    const packageSwiftPath = ctx.getPackageSwiftPath();
    if (!packageSwiftPath) return;

    const content = fs.readFileSync(packageSwiftPath, 'utf-8');

    if (!content.includes('.library(')) {
        pushFinding(ctx.findings, {
            ruleId: 'ios.spm.missing_products',
            severity: 'medium',
            message: 'Package.swift sin products definidos. Definir libraries para exponer módulos.',
            filePath: 'Package.swift',
            line: 1,
            suggestion: `.library(name: "FeatureOrders", targets: ["FeatureOrders"])`
        });
    }
}

function checkDependencyVersions(ctx) {
    const packageSwiftPath = ctx.getPackageSwiftPath();
    if (!packageSwiftPath) return;

    const content = fs.readFileSync(packageSwiftPath, 'utf-8');
    if (content.includes('.branch(')) {
        pushFinding(ctx.findings, {
            ruleId: 'ios.spm.dependency_branch_instead_version',
            severity: 'high',
            message: 'Dependencia usando .branch() en lugar de versión específica. Usar .upToNextMajor o .exact.',
            filePath: 'Package.swift',
            line: ctx.findLineNumber(content, '.branch('),
            suggestion: `Usar versiones semánticas:

// ❌ Inestable
.package(url: "...", branch: "main")

// ✅ Estable
.package(url: "...", from: "1.0.0")
.package(url: "...", .upToNextMajor(from: "1.0.0"))`
        });
    }
}

function checkTestTargets(ctx) {
    const packageSwiftPath = ctx.getPackageSwiftPath();
    if (!packageSwiftPath) return;

    const content = fs.readFileSync(packageSwiftPath, 'utf-8');
    const targets = content.match(/\.target\([\s\S]*?name:\s*"([^"]+)"/g) || [];
    const testTargets = content.match(/\.testTarget\([\s\S]*?name:\s*"([^"]+)"/g) || [];

    const targetNames = targets.map(t => t.match(/name:\s*"([^"]+)"/)?.[1]).filter(Boolean);
    const testTargetNames = testTargets.map(t => t.match(/name:\s*"([^"]+)"/)?.[1]).filter(Boolean);

    const targetsWithoutTests = targetNames.filter(name =>
        !testTargetNames.includes(`${name}Tests`) && !name.includes('Tests')
    );

    if (targetsWithoutTests.length > 0) {
        pushFinding(ctx.findings, {
            ruleId: 'ios.spm.targets_without_tests',
            severity: 'medium',
            message: `${targetsWithoutTests.length} targets sin test targets: ${targetsWithoutTests.slice(0, 3).join(', ')}`,
            filePath: 'Package.swift',
            line: 1,
            suggestion: `Añadir test targets:

.testTarget(
    name: "FeatureOrdersTests",
    dependencies: ["FeatureOrders"]
)`
        });
    }
}

function checkModuleBoundaries(ctx) {
    const sources = path.join(ctx.projectRoot, 'Sources');
    if (!fs.existsSync(sources)) return;

    const modules = fs.readdirSync(sources).filter(dir => fs.statSync(path.join(sources, dir)).isDirectory());

    modules.forEach(moduleName => {
        const modulePath = path.join(sources, moduleName);
        const swiftFiles = ctx.findSwiftFilesInDirectory(modulePath);

        swiftFiles.forEach(file => {
            const content = fs.readFileSync(file, 'utf-8');

            if (moduleName.startsWith('Feature')) {
                modules.forEach(otherModule => {
                    if (otherModule.startsWith('Feature') && otherModule !== moduleName) {
                        if (content.includes(`import ${otherModule}`)) {
                            pushFinding(ctx.findings, {
                                ruleId: 'ios.spm.feature_imports_feature',
                                severity: 'high',
                                message: `Feature module '${moduleName}' importa otro Feature '${otherModule}'. Violación de boundaries.`,
                                filePath: file,
                                line: ctx.findLineNumber(content, `import ${otherModule}`),
                                suggestion: 'Extraer código compartido a Core module'
                            });
                        }
                    }
                });
            }

            if (moduleName.startsWith('Core')) {
                modules.forEach(featureModule => {
                    if (featureModule.startsWith('Feature') && content.includes(`import ${featureModule}`)) {
                        pushFinding(ctx.findings, {
                            ruleId: 'ios.spm.core_imports_feature',
                            severity: 'critical',
                            message: `Core module '${moduleName}' importa Feature '${featureModule}'. Dependencia invertida!`,
                            filePath: file,
                            line: ctx.findLineNumber(content, `import ${featureModule}`),
                            suggestion: 'Core NO debe depender de Features. Invertir dependencia.'
                        });
                    }
                });
            }
        });
    });
}

module.exports = {
    buildContext,
    checkPackageSwiftExists,
    checkFeatureModulesStructure,
    checkCoreModulesStructure,
    checkPublicAPIExposure,
    checkModuleDependencies,
    checkCrossModuleViolations,
    checkPackageSwiftConfiguration,
    checkTargetNaming,
    checkProductConfiguration,
    checkDependencyVersions,
    checkTestTargets,
    checkModuleBoundaries,
};
