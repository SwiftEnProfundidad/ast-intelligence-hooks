/**
 * iOS Swift Package Manager (SPM) Rules
 *
 * Reglas de organización de código con SPM:
 * - Feature modules separation
 * - Core modules detection
 * - Package.swift analysis
 * - Public API exposure control
 * - Module dependencies validation
 * - Cross-module violations
 */

const { pushFinding } = require('../../ast-core');
const fs = require('fs');
const path = require('path');

class iOSSPMRules {
  constructor(findings, projectRoot) {
    this.findings = findings;
    this.projectRoot = projectRoot;
  }

  analyze() {
    this.checkPackageSwiftExists();
    this.checkFeatureModulesStructure();
    this.checkCoreModulesStructure();
    this.checkPublicAPIExposure();
    this.checkModuleDependencies();
    this.checkCrossModuleViolations();
    this.checkPackageSwiftConfiguration();
    this.checkTargetNaming();
    this.checkProductConfiguration();
    this.checkDependencyVersions();
    this.checkTestTargets();
    this.checkModuleBoundaries();
  }

  /**
   * 1. Package.swift debe existir para modularización
   */
  checkPackageSwiftExists() {
    const packagePath = path.join(this.projectRoot, 'Package.swift');

    if (!fs.existsSync(packagePath)) {
      const swiftFiles = this.findSwiftFiles();

      if (swiftFiles.length > 50) {
        pushFinding(this.findings, {
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
      this.packageSwiftPath = packagePath;
    }
  }

  /**
   * 2. Feature modules structure
   */
  checkFeatureModulesStructure() {
    const sources = path.join(this.projectRoot, 'Sources');

    if (!fs.existsSync(sources)) return;

    const modules = fs.readdirSync(sources).filter(dir => {
      const stats = fs.statSync(path.join(sources, dir));
      return stats.isDirectory();
    });

    const featureModules = modules.filter(m => m.startsWith('Feature'));
    const coreModules = modules.filter(m => m.startsWith('Core'));

    if (modules.length > 5 && featureModules.length === 0) {
      pushFinding(this.findings, {
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
      pushFinding(this.findings, {
        ruleId: 'ios.spm.missing_core_modules',
        severity: 'medium',
        message: 'Proyecto grande sin módulos Core*. Considerar extraer código compartido.',
        filePath: 'Sources/',
        line: 1
      });
    }
  }

  /**
   * 3. Core modules detection
   */
  checkCoreModulesStructure() {
    const recommendedCoreModules = ['CoreNetworking', 'CoreDatabase', 'CoreUI', 'CoreModels'];
    const sources = path.join(this.projectRoot, 'Sources');

    if (!fs.existsSync(sources)) return;

    const existingModules = fs.readdirSync(sources);
    const missingCore = recommendedCoreModules.filter(core => !existingModules.includes(core));

    if (missingCore.length > 0 && existingModules.length > 8) {
      pushFinding(this.findings, {
        ruleId: 'ios.spm.recommended_core_modules_missing',
        severity: 'low',
        message: `Módulos Core recomendados faltantes: ${missingCore.join(', ')}`,
        filePath: 'Sources/',
        line: 1,
        suggestion: 'CoreNetworking, CoreDatabase, CoreUI ayudan a organizar código compartido'
      });
    }
  }

  /**
   * 4. Public API exposure control
   */
  checkPublicAPIExposure() {
    const swiftFiles = this.findSwiftFiles();

    swiftFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');

      const publicCount = (content.match(/\bpublic\s+(class|struct|enum|func|var|let)/g) || []).length;
      const totalDeclarations = (content.match(/\b(class|struct|enum|func)\s+\w+/g) || []).length;

      if (totalDeclarations > 0) {
        const publicPercentage = (publicCount / totalDeclarations) * 100;

        if (publicPercentage > 70) {
          pushFinding(this.findings, {
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
        pushFinding(this.findings, {
          ruleId: 'ios.spm.api_module_not_public',
          severity: 'medium',
          message: 'Módulo API sin declaraciones public. API module debe exponer funcionalidad.',
          filePath: file,
          line: 1
        });
      }
    });
  }

  /**
   * 5. Module dependencies validation
   */
  checkModuleDependencies() {
    if (!this.packageSwiftPath) return;

    const content = fs.readFileSync(this.packageSwiftPath, 'utf-8');

    const targets = content.match(/\.target\([\s\S]*?name:\s*"([^"]+)"[\s\S]*?dependencies:\s*\[([\s\S]*?)\]/g);

    if (targets) {
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
            pushFinding(this.findings, {
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
        if (moduleName.startsWith('Feature')) {
          const featureDeps = deps.filter(d => d.startsWith('Feature'));

          if (featureDeps.length > 0) {
            pushFinding(this.findings, {
              ruleId: 'ios.spm.feature_to_feature_dependency',
              severity: 'high',
              message: `Feature module '${moduleName}' depende de otro Feature: ${featureDeps.join(', ')}. Extraer a Core.`,
              filePath: 'Package.swift',
              line: 1,
              suggestion: 'Features NO deben depender entre sí. Usar Core modules para compartir código.'
            });
          }
        }
      });
    }
  }

  /**
   * 6. Cross-module violations
   */
  checkCrossModuleViolations() {
    const swiftFiles = this.findSwiftFiles();

    swiftFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');

      const internalImports = content.match(/@_implementationOnly\s+import\s+(\w+)/g);

      if (internalImports) {
        pushFinding(this.findings, {
          ruleId: 'ios.spm.implementation_only_import',
          severity: 'low',
          message: '@_implementationOnly import detectado. Es válido pero indica posible leak de abstracción.',
          filePath: file,
          line: this.findLineNumber(content, '@_implementationOnly'),
          suggestion: 'Verificar si el import es realmente necesario o hay leak de abstracción'
        });
      }

      if (content.includes('@testable import') && !file.includes('Tests/') && !file.includes('Test.swift')) {
        pushFinding(this.findings, {
          ruleId: 'ios.spm.testable_import_in_production',
          severity: 'high',
          message: '@testable import en código de producción. Solo debe usarse en tests.',
          filePath: file,
          line: this.findLineNumber(content, '@testable import')
        });
      }
    });
  }

  /**
   * 7. Package.swift configuration
   */
  checkPackageSwiftConfiguration() {
    if (!this.packageSwiftPath) return;

    const content = fs.readFileSync(this.packageSwiftPath, 'utf-8');

    const toolsVersion = content.match(/\/\/\s*swift-tools-version:\s*(\d+\.\d+)/)?.[1];
    if (toolsVersion && parseFloat(toolsVersion) < 5.9) {
      pushFinding(this.findings, {
        ruleId: 'ios.spm.outdated_tools_version',
        severity: 'medium',
        message: `Swift tools version ${toolsVersion} desactualizado. Actualizar a 5.9+`,
        filePath: 'Package.swift',
        line: 1
      });
    }

    if (!content.includes('platforms:')) {
      pushFinding(this.findings, {
        ruleId: 'ios.spm.missing_platforms',
        severity: 'medium',
        message: 'Package.swift sin platforms: especificado. Definir versión mínima de iOS.',
        filePath: 'Package.swift',
        line: 1,
        suggestion: 'platforms: [.iOS(.v15), .macOS(.v12)]'
      });
    }
  }

  /**
   * 8. Target naming consistency
   */
  checkTargetNaming() {
    if (!this.packageSwiftPath) return;

    const content = fs.readFileSync(this.packageSwiftPath, 'utf-8');
    const targets = content.match(/\.target\([\s\S]*?name:\s*"([^"]+)"/g);

    if (targets) {
      const targetNames = targets.map(t => t.match(/name:\s*"([^"]+)"/)?.[1]).filter(Boolean);

      const hasInconsistentNaming = targetNames.some(name => {
        return name.includes('_') || name.includes('-') || /[a-z][A-Z]/.test(name);
      });

      if (hasInconsistentNaming) {
        pushFinding(this.findings, {
          ruleId: 'ios.spm.inconsistent_target_naming',
          severity: 'low',
          message: 'Naming inconsistente en targets. Usar PascalCase sin separadores.',
          filePath: 'Package.swift',
          line: 1,
          suggestion: 'FeatureOrders, CoreNetworking (no Feature-Orders, Core_Networking)'
        });
      }
    }
  }

  /**
   * 9. Product configuration
   */
  checkProductConfiguration() {
    if (!this.packageSwiftPath) return;

    const content = fs.readFileSync(this.packageSwiftPath, 'utf-8');

    if (!content.includes('.library(')) {
      pushFinding(this.findings, {
        ruleId: 'ios.spm.missing_products',
        severity: 'medium',
        message: 'Package.swift sin products definidos. Definir libraries para exponer módulos.',
        filePath: 'Package.swift',
        line: 1,
        suggestion: `.library(name: "FeatureOrders", targets: ["FeatureOrders"])`
      });
    }
  }

  /**
   * 10. Dependency versions - debe usar versioning semántico
   */
  checkDependencyVersions() {
    if (!this.packageSwiftPath) return;

    const content = fs.readFileSync(this.packageSwiftPath, 'utf-8');

    if (content.includes('.branch(')) {
      pushFinding(this.findings, {
        ruleId: 'ios.spm.dependency_branch_instead_version',
        severity: 'high',
        message: 'Dependencia usando .branch() en lugar de versión específica. Usar .upToNextMajor o .exact.',
        filePath: 'Package.swift',
        line: this.findLineNumber(content, '.branch('),
        suggestion: `Usar versiones semánticas:

// ❌ Inestable
.package(url: "...", branch: "main")

// ✅ Estable
.package(url: "...", from: "1.0.0")
.package(url: "...", .upToNextMajor(from: "1.0.0"))`
      });
    }
  }

  /**
   * 11. Test targets - debe haber tests para cada módulo
   */
  checkTestTargets() {
    if (!this.packageSwiftPath) return;

    const content = fs.readFileSync(this.packageSwiftPath, 'utf-8');

    const targets = content.match(/\.target\([\s\S]*?name:\s*"([^"]+)"/g) || [];
    const testTargets = content.match(/\.testTarget\([\s\S]*?name:\s*"([^"]+)"/g) || [];

    const targetNames = targets.map(t => t.match(/name:\s*"([^"]+)"/)?.[1]).filter(Boolean);
    const testTargetNames = testTargets.map(t => t.match(/name:\s*"([^"]+)"/)?.[1]).filter(Boolean);

    const targetsWithoutTests = targetNames.filter(name =>
      !testTargetNames.includes(`${name}Tests`) &&
      !name.includes('Tests')
    );

    if (targetsWithoutTests.length > 0) {
      pushFinding(this.findings, {
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

  /**
   * 12. Module boundaries - detectar imports indebidos
   */
  checkModuleBoundaries() {
    const sources = path.join(this.projectRoot, 'Sources');
    if (!fs.existsSync(sources)) return;

    const modules = fs.readdirSync(sources).filter(dir => {
      const stats = fs.statSync(path.join(sources, dir));
      return stats.isDirectory();
    });

    modules.forEach(moduleName => {
      const modulePath = path.join(sources, moduleName);
      const swiftFiles = this.findSwiftFilesInDirectory(modulePath);

      swiftFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');

        if (moduleName.startsWith('Feature')) {
          modules.forEach(otherModule => {
            if (otherModule.startsWith('Feature') && otherModule !== moduleName) {
              if (content.includes(`import ${otherModule}`)) {
                pushFinding(this.findings, {
                  ruleId: 'ios.spm.feature_imports_feature',
                  severity: 'high',
                  message: `Feature module '${moduleName}' importa otro Feature '${otherModule}'. Violación de boundaries.`,
                  filePath: file,
                  line: this.findLineNumber(content, `import ${otherModule}`),
                  suggestion: 'Extraer código compartido a Core module'
                });
              }
            }
          });
        }

        if (moduleName.startsWith('Core')) {
          modules.forEach(featureModule => {
            if (featureModule.startsWith('Feature') && content.includes(`import ${featureModule}`)) {
              pushFinding(this.findings, {
                ruleId: 'ios.spm.core_imports_feature',
                severity: 'critical',
                message: `Core module '${moduleName}' importa Feature '${featureModule}'. Dependencia invertida!`,
                filePath: file,
                line: this.findLineNumber(content, `import ${featureModule}`),
                suggestion: 'Core NO debe depender de Features. Invertir dependencia.'
              });
            }
          });
        }
      });
    });
  }

  findSwiftFiles() {
    const glob = require('glob');
    return glob.sync('**/*.swift', {
      cwd: this.projectRoot,
      ignore: ['**/Pods/**', '**/Carthage/**', '**/Build/**', '**/.build/**', '**/DerivedData/**'],
      absolute: true
    });
  }

  findSwiftFilesInDirectory(dir) {
    const glob = require('glob');
    return glob.sync('**/*.swift', {
      cwd: dir,
      absolute: true
    });
  }

  findLineNumber(content, pattern) {
    const lines = content.split('\n');
    const index = lines.findIndex(line =>
      typeof pattern === 'string' ? line.includes(pattern) : pattern.test(line)
    );
    return index !== -1 ? index + 1 : 1;
  }
}

module.exports = { iOSSPMRules };
