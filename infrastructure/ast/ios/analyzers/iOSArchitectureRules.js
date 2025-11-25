/**
 * iOS Architecture Pattern Rules
 * 
 * Reglas específicas para cada patrón arquitectónico detectado.
 * Solo se ejecutan las reglas del patrón detectado en el proyecto.
 */

const { pushFinding } = require('../../ast-core');

class iOSArchitectureRules {
  constructor(findings, detectedPattern) {
    this.findings = findings;
    this.pattern = detectedPattern;
  }

  /**
   * Ejecuta las reglas correspondientes al patrón detectado
   */
  runRules(files) {
    console.log(`[iOS Architecture] Detected pattern: ${this.pattern}`);
    
    switch (this.pattern) {
      case 'FEATURE_FIRST_CLEAN_DDD':
        this.checkFeatureFirstCleanDDDRules(files);
        break;
      case 'MVVM':
        this.checkMVVMRules(files);
        break;
      case 'MVVM-C':
        this.checkMVVMCRules(files);
        break;
      case 'MVP':
        this.checkMVPRules(files);
        break;
      case 'VIPER':
        this.checkVIPERRules(files);
        break;
      case 'TCA':
        this.checkTCARules(files);
        break;
      case 'CLEAN_SWIFT':
        this.checkCleanSwiftRules(files);
        break;
      case 'MVC_LEGACY':
        this.checkMVCLegacyRules(files);
        break;
      case 'MIXED':
        this.checkMixedArchitectureRules(files);
        break;
      default:
        console.log(`[iOS Architecture] No specific rules for pattern: ${this.pattern}`);
    }
  }

  // ============================================
  // Feature-First + DDD + Clean Architecture Rules (PATRÓN PRINCIPAL)
  // ============================================
  checkFeatureFirstCleanDDDRules(files) {
    files.forEach(file => {
      const content = this.readFile(file);

      // 1. Domain NO debe depender de otras capas
      if (file.includes('/domain/')) {
        const forbiddenImports = [
          'import UIKit',
          'import SwiftUI',
          'import Alamofire',
          'import CoreData'
        ];

        forbiddenImports.forEach(forbiddenImport => {
          if (content.includes(forbiddenImport)) {
            pushFinding(this.findings, {
              ruleId: 'ios.clean.domain_dependency_violation',
              severity: 'critical',
              message: `Domain layer tiene dependencia de ${forbiddenImport}. Domain debe ser independiente de frameworks.`,
              filePath: file,
              line: content.split('\n').findIndex(line => line.includes(forbiddenImport)) + 1,
              suggestion: 'Remover dependencia. Domain solo debe contener lógica de negocio pura.'
            });
          }
        });

        // Domain debe contener entities/, value-objects/, interfaces/
        if (file.includes('/domain/') && !file.includes('/entities/') && 
            !file.includes('/value-objects/') && !file.includes('/interfaces/')) {
          pushFinding(this.findings, {
            ruleId: 'ios.clean.domain_structure',
            severity: 'medium',
            message: 'Archivo en domain/ sin estructura correcta. Usar entities/, value-objects/, interfaces/',
            filePath: file,
            line: 1
          });
        }
      }

      // 2. Entities deben tener comportamiento (NO anémicas)
      if (file.includes('Entity.swift')) {
        const hasMethods = (content.match(/func\s+\w+/g) || []).length;
        const hasProperties = (content.match(/(let|var)\s+\w+:/g) || []).length;

        if (hasProperties > 3 && hasMethods === 0) {
          pushFinding(this.findings, {
            ruleId: 'ios.ddd.anemic_entity',
            severity: 'high',
            message: 'Entity anémica (solo properties, sin comportamiento). Añadir métodos de negocio.',
            filePath: file,
            line: 1,
            suggestion: 'Entities deben encapsular lógica de negocio, no ser solo contenedores de datos.'
          });
        }
      }

      // 3. Value Objects deben ser inmutables
      if (file.includes('VO.swift') || file.includes('ValueObject.swift')) {
        if (content.includes('var ') && !content.includes('private(set)')) {
          pushFinding(this.findings, {
            ruleId: 'ios.ddd.mutable_value_object',
            severity: 'high',
            message: 'Value Object con properties mutables. VOs deben ser inmutables (usar let).',
            filePath: file,
            line: 1,
            suggestion: 'Cambiar var por let, o usar private(set) var si necesitas computed properties'
          });
        }

        // Value Objects deben validar en init
        if (!content.includes('init(') || !content.includes('throw')) {
          pushFinding(this.findings, {
            ruleId: 'ios.ddd.value_object_no_validation',
            severity: 'medium',
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

      // 4. Use Cases deben tener execute()
      if (file.includes('UseCase.swift')) {
        if (!content.includes('func execute(')) {
          pushFinding(this.findings, {
            ruleId: 'ios.ddd.usecase_missing_execute',
            severity: 'high',
            message: 'Use Case sin método execute(). Convención: func execute(input: Input) async throws -> Output',
            filePath: file,
            line: 1
          });
        }

        // Use Cases NO deben contener lógica de UI
        if (content.includes('UIKit') || content.includes('SwiftUI')) {
          pushFinding(this.findings, {
            ruleId: 'ios.clean.usecase_ui_dependency',
            severity: 'high',
            message: 'Use Case depende de UI framework. Application layer debe ser UI-agnostic.',
            filePath: file,
            line: 1
          });
        }
      }

      // 5. Repository implementations deben estar en infrastructure
      if (content.includes('Repository') && content.includes('class ') && !content.includes('protocol ')) {
        if (!file.includes('/infrastructure/')) {
          pushFinding(this.findings, {
            ruleId: 'ios.clean.repository_wrong_layer',
            severity: 'high',
            message: 'Repository implementation fuera de infrastructure/. Mover a infrastructure/repositories/',
            filePath: file,
            line: 1
          });
        }
      }

      // 6. Repository interfaces deben estar en domain
      if (content.includes('protocol ') && content.includes('Repository')) {
        if (!file.includes('/domain/')) {
          pushFinding(this.findings, {
            ruleId: 'ios.clean.repository_interface_wrong_layer',
            severity: 'high',
            message: 'Repository protocol fuera de domain/. Mover a domain/interfaces/',
            filePath: file,
            line: 1
          });
        }
      }

      // 7. DTOs deben estar en application
      if (file.includes('DTO.swift') || file.includes('Dto.swift')) {
        if (!file.includes('/application/')) {
          pushFinding(this.findings, {
            ruleId: 'ios.clean.dto_wrong_layer',
            severity: 'medium',
            message: 'DTO fuera de application/. Mover a application/dto/',
            filePath: file,
            line: 1
          });
        }
      }

      // 8. Features NO deben importarse entre sí (Bounded Contexts)
      const featureMatch = file.match(/\/Features?\/(\w+)\//);
      if (featureMatch) {
        const currentFeature = featureMatch[1];
        const importMatches = content.matchAll(/import\s+(\w+)/g);
        
        for (const match of importMatches) {
          const importedModule = match[1];
          
          // Si importa otro feature, es violación
          if (files.some(f => f.includes(`/Features/${importedModule}/`)) && importedModule !== currentFeature) {
            pushFinding(this.findings, {
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

      // 9. Infrastructure NO debe contener lógica de negocio
      if (file.includes('/infrastructure/')) {
        // Detectar lógica de negocio compleja (métodos largos, validaciones)
        const methods = content.match(/func\s+\w+[\s\S]*?\{([\s\S]*?)(?=\n\s*func|\n})/g) || [];
        const complexMethods = methods.filter(m => {
          const lines = m.split('\n').length;
          return lines > 30 || m.includes('if ') && m.includes('guard ') && m.includes('throw ');
        });

        if (complexMethods.length > 0) {
          pushFinding(this.findings, {
            ruleId: 'ios.clean.infrastructure_business_logic',
            severity: 'high',
            message: 'Infrastructure con lógica de negocio compleja. Mover a domain/ o application/',
            filePath: file,
            line: 1,
            suggestion: 'Infrastructure solo debe adaptar tecnologías, no contener lógica de negocio'
          });
        }
      }

      // 10. Presentation debe usar solo DTOs (no entities de domain)
      if (file.includes('/presentation/')) {
        if (content.includes('Entity') && !content.includes('DTO') && !content.includes('Dto')) {
          pushFinding(this.findings, {
            ruleId: 'ios.clean.presentation_uses_entity',
            severity: 'medium',
            message: 'Presentation usando Entities de domain directamente. Usar DTOs para desacoplar.',
            filePath: file,
            line: 1,
            suggestion: 'Mapear Entities → DTOs antes de exponer a presentation layer'
          });
        }
      }
    });
  }

  // ============================================
  // MVVM Rules
  // ============================================
  checkMVVMRules(files) {
    files.forEach(file => {
      const content = this.readFile(file);
      
      // 1. ViewModel debe ser ObservableObject
      if (file.includes('ViewModel.swift')) {
        if (!content.includes('ObservableObject') && !content.includes('@Observable')) {
          pushFinding(this.findings, {
            ruleId: 'ios.mvvm.viewmodel_not_observable',
            severity: 'high',
            message: 'ViewModel debe conformar ObservableObject o usar @Observable macro (iOS 17+)',
            filePath: file,
            line: 1
          });
        }

        // 2. ViewModel NO debe tener referencias a UIKit
        if (content.match(/import\s+UIKit/) && !content.includes('#if canImport(UIKit)')) {
          pushFinding(this.findings, {
            ruleId: 'ios.mvvm.viewmodel_uikit_dependency',
            severity: 'high',
            message: 'ViewModel NO debe depender de UIKit. Usar tipos agnósticos de plataforma.',
            filePath: file,
            line: content.split('\n').findIndex(line => line.includes('import UIKit')) + 1
          });
        }

        // 3. ViewModel debe usar @Published para properties observables
        const classMatch = content.match(/class\s+\w+ViewModel/);
        if (classMatch && content.includes('var ') && !content.includes('@Published')) {
          pushFinding(this.findings, {
            ruleId: 'ios.mvvm.missing_published',
            severity: 'medium',
            message: 'ViewModel properties que cambian deben usar @Published para notificar a la View',
            filePath: file,
            line: 1
          });
        }
      }

      // 4. View NO debe contener lógica de negocio
      if (file.includes('View.swift') || content.includes('struct ') && content.includes(': View')) {
        const hasBusinessLogic = 
          /func\s+\w+\([^)]*\)\s*->\s*\w+\s*{[\s\S]{100,}/.test(content) || // Funciones largas
          content.includes('URLSession') ||
          content.includes('CoreData') ||
          /\.save\(|\.fetch\(|\.delete\(/.test(content);

        if (hasBusinessLogic) {
          pushFinding(this.findings, {
            ruleId: 'ios.mvvm.view_business_logic',
            severity: 'high',
            message: 'View contiene lógica de negocio. Mover al ViewModel.',
            filePath: file,
            line: 1
          });
        }
      }
    });
  }

  // ============================================
  // MVVM-C Rules
  // ============================================
  checkMVVMCRules(files) {
    // Primero ejecutar reglas MVVM base
    this.checkMVVMRules(files);

    files.forEach(file => {
      const content = this.readFile(file);

      // 1. Coordinator debe conformar Coordinator protocol
      if (file.includes('Coordinator.swift')) {
        if (!content.includes('protocol Coordinator') && !content.includes(': Coordinator')) {
          pushFinding(this.findings, {
            ruleId: 'ios.mvvmc.coordinator_protocol',
            severity: 'medium',
            message: 'Coordinator debe conformar protocol Coordinator con start() y navigate(to:)',
            filePath: file,
            line: 1
          });
        }

        // 2. Coordinator debe tener método start()
        if (!/func\s+start\(\)/.test(content)) {
          pushFinding(this.findings, {
            ruleId: 'ios.mvvmc.coordinator_missing_start',
            severity: 'high',
            message: 'Coordinator debe implementar func start() para iniciar el flujo',
            filePath: file,
            line: 1
          });
        }

        // 3. Coordinator NO debe contener lógica de negocio
        const hasBusinessLogic = 
          content.includes('URLSession') ||
          content.includes('CoreData') ||
          /\.save\(|\.fetch\(|\.delete\(/.test(content);

        if (hasBusinessLogic) {
          pushFinding(this.findings, {
            ruleId: 'ios.mvvmc.coordinator_business_logic',
            severity: 'high',
            message: 'Coordinator NO debe contener lógica de negocio. Solo navegación.',
            filePath: file,
            line: 1
          });
        }
      }

      // 4. ViewModel NO debe manejar navegación directamente
      if (file.includes('ViewModel.swift')) {
        if (content.includes('navigationController') || content.includes('.present(')) {
          pushFinding(this.findings, {
            ruleId: 'ios.mvvmc.viewmodel_navigation',
            severity: 'high',
            message: 'ViewModel NO debe manejar navegación. Delegar al Coordinator.',
            filePath: file,
            line: 1
          });
        }
      }
    });
  }

  // ============================================
  // MVP Rules
  // ============================================
  checkMVPRules(files) {
    files.forEach(file => {
      const content = this.readFile(file);

      // 1. View debe ser protocol (View es pasivo en MVP)
      if (file.includes('View.swift') && !file.includes('ViewController')) {
        if (!content.includes('protocol ') && content.includes('View')) {
          pushFinding(this.findings, {
            ruleId: 'ios.mvp.view_not_protocol',
            severity: 'high',
            message: 'En MVP, View debe ser un protocol implementado por ViewController',
            filePath: file,
            line: 1
          });
        }
      }

      // 2. Presenter debe tener referencia weak a View
      if (file.includes('Presenter.swift')) {
        if (content.includes('var view:') && !content.includes('weak var view')) {
          pushFinding(this.findings, {
            ruleId: 'ios.mvp.presenter_strong_view',
            severity: 'high',
            message: 'Presenter debe tener referencia weak a View para evitar retain cycles',
            filePath: file,
            line: content.split('\n').findIndex(line => line.includes('var view:')) + 1
          });
        }

        // 3. Presenter debe contener toda la lógica de presentación
        const hasLogic = content.split('\n').filter(line => 
          line.includes('func ') && !line.includes('viewDidLoad')
        ).length;

        if (hasLogic < 3) {
          pushFinding(this.findings, {
            ruleId: 'ios.mvp.presenter_thin',
            severity: 'medium',
            message: 'Presenter parece tener poca lógica. En MVP, Presenter debe contener toda la lógica de presentación.',
            filePath: file,
            line: 1
          });
        }
      }

      // 4. ViewController NO debe contener lógica de negocio
      if (file.includes('ViewController.swift')) {
        const hasBusinessLogic = 
          content.includes('URLSession') ||
          content.includes('CoreData') ||
          /func\s+\w+\([^)]*\)\s*->\s*\w+\s*{[\s\S]{50,}/.test(content);

        if (hasBusinessLogic) {
          pushFinding(this.findings, {
            ruleId: 'ios.mvp.viewcontroller_business_logic',
            severity: 'high',
            message: 'ViewController NO debe contener lógica de negocio. Delegar al Presenter.',
            filePath: file,
            line: 1
          });
        }
      }
    });
  }

  // ============================================
  // VIPER Rules
  // ============================================
  checkVIPERRules(files) {
    files.forEach(file => {
      const content = this.readFile(file);

      // 1. View debe ser protocol
      if (file.includes('View.swift') || (file.includes('ViewController.swift') && content.includes('ViewProtocol'))) {
        if (!content.includes('protocol ') || !content.includes('ViewProtocol')) {
          pushFinding(this.findings, {
            ruleId: 'ios.viper.view_protocol',
            severity: 'high',
            message: 'En VIPER, View debe ser un protocol (ViewProtocol)',
            filePath: file,
            line: 1
          });
        }
      }

      // 2. Interactor debe contener SOLO lógica de negocio
      if (file.includes('Interactor.swift')) {
        if (content.includes('UIKit') || content.includes('import SwiftUI')) {
          pushFinding(this.findings, {
            ruleId: 'ios.viper.interactor_ui_dependency',
            severity: 'high',
            message: 'Interactor NO debe depender de frameworks de UI (UIKit, SwiftUI)',
            filePath: file,
            line: 1
          });
        }

        // Interactor debe tener output (Presenter)
        if (!content.includes('var presenter:') && !content.includes('var output:')) {
          pushFinding(this.findings, {
            ruleId: 'ios.viper.interactor_no_output',
            severity: 'high',
            message: 'Interactor debe tener referencia a Presenter (output) para enviar resultados',
            filePath: file,
            line: 1
          });
        }
      }

      // 3. Presenter debe ser intermediario entre View e Interactor
      if (file.includes('Presenter.swift')) {
        const hasViewReference = content.includes('var view') || content.includes('weak var view');
        const hasInteractorReference = content.includes('var interactor');

        if (!hasViewReference || !hasInteractorReference) {
          pushFinding(this.findings, {
            ruleId: 'ios.viper.presenter_missing_references',
            severity: 'high',
            message: 'Presenter debe tener referencias a View e Interactor',
            filePath: file,
            line: 1
          });
        }

        // Presenter NO debe contener lógica de negocio
        if (content.includes('URLSession') || content.includes('CoreData')) {
          pushFinding(this.findings, {
            ruleId: 'ios.viper.presenter_business_logic',
            severity: 'high',
            message: 'Presenter NO debe contener lógica de negocio. Delegar al Interactor.',
            filePath: file,
            line: 1
          });
        }
      }

      // 4. Router debe manejar SOLO navegación
      if (file.includes('Router.swift') || file.includes('Wireframe.swift')) {
        const hasBusinessLogic = 
          content.includes('URLSession') ||
          content.includes('CoreData') ||
          content.includes('UserDefaults');

        if (hasBusinessLogic) {
          pushFinding(this.findings, {
            ruleId: 'ios.viper.router_business_logic',
            severity: 'high',
            message: 'Router NO debe contener lógica de negocio ni persistencia. Solo navegación.',
            filePath: file,
            line: 1
          });
        }
      }

      // 5. Entity debe ser simple (solo datos)
      if (file.includes('Entity.swift')) {
        const hasMethods = (content.match(/func\s+/g) || []).length;
        if (hasMethods > 2) { // Permitir computed properties
          pushFinding(this.findings, {
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

  // ============================================
  // TCA Rules (The Composable Architecture)
  // ============================================
  checkTCARules(files) {
    files.forEach(file => {
      const content = this.readFile(file);

      // 1. State debe ser struct inmutable
      if (content.includes('struct ') && content.includes('State')) {
        if (content.includes('var ') && !content.includes('mutating func')) {
          pushFinding(this.findings, {
            ruleId: 'ios.tca.mutable_state',
            severity: 'medium',
            message: 'State debe ser inmutable. Usar mutating func en Reducer para cambios.',
            filePath: file,
            line: 1
          });
        }
      }

      // 2. Action debe ser enum
      if (content.includes('Action')) {
        if (!content.includes('enum ') && content.includes('Action')) {
          pushFinding(this.findings, {
            ruleId: 'ios.tca.action_not_enum',
            severity: 'high',
            message: 'Action debe ser enum para type-safety',
            filePath: file,
            line: 1
          });
        }
      }

      // 3. Side effects deben usar Effect
      if (content.includes(': Reducer')) {
        if ((content.includes('URLSession') || content.includes('async ')) && 
            !content.includes('Effect')) {
          pushFinding(this.findings, {
            ruleId: 'ios.tca.missing_effect',
            severity: 'high',
            message: 'Side effects en TCA deben usar Effect para manejo de async',
            filePath: file,
            line: 1
          });
        }
      }

      // 4. Store debe ser único por feature
      if (content.includes('Store<')) {
        const storeCount = (content.match(/Store</g) || []).length;
        if (storeCount > 2) {
          pushFinding(this.findings, {
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

  // ============================================
  // Clean Swift Rules (VIP)
  // ============================================
  checkCleanSwiftRules(files) {
    files.forEach(file => {
      const content = this.readFile(file);

      // 1. Debe seguir ciclo Request-Response-ViewModel
      if (file.includes('Models.swift')) {
        const hasRequest = content.includes('Request');
        const hasResponse = content.includes('Response');
        const hasViewModel = content.includes('ViewModel');

        if (!hasRequest || !hasResponse || !hasViewModel) {
          pushFinding(this.findings, {
            ruleId: 'ios.clean_swift.incomplete_cycle',
            severity: 'high',
            message: 'Clean Swift requiere ciclo completo: Request → Response → ViewModel',
            filePath: file,
            line: 1
          });
        }
      }

      // 2. Protocols deben seguir convención *Logic
      if (file.includes('ViewController.swift') || file.includes('Interactor.swift') || file.includes('Presenter.swift')) {
        const hasDisplayLogic = content.includes('DisplayLogic');
        const hasBusinessLogic = content.includes('BusinessLogic');
        const hasPresentationLogic = content.includes('PresentationLogic');

        if (!hasDisplayLogic && file.includes('ViewController')) {
          pushFinding(this.findings, {
            ruleId: 'ios.clean_swift.missing_display_logic',
            severity: 'medium',
            message: 'ViewController debe conformar DisplayLogic protocol',
            filePath: file,
            line: 1
          });
        }
      }

      // 3. Flujo unidireccional estricto
      if (file.includes('Presenter.swift')) {
        if (content.includes('interactor?.')) {
          pushFinding(this.findings, {
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

  // ============================================
  // MVC Legacy Rules (Anti-patterns)
  // ============================================
  checkMVCLegacyRules(files) {
    files.forEach(file => {
      const content = this.readFile(file);

      // 1. Massive View Controller detection
      if (file.includes('ViewController.swift')) {
        const lines = content.split('\n').length;
        
        if (lines > 500) {
          pushFinding(this.findings, {
            ruleId: 'ios.mvc.massive_view_controller_critical',
            severity: 'critical',
            message: `Massive View Controller detectado (${lines} líneas). Refactorizar urgentemente a MVVM, MVP, VIPER o TCA.`,
            filePath: file,
            line: 1
          });
        } else if (lines > 300) {
          pushFinding(this.findings, {
            ruleId: 'ios.mvc.massive_view_controller',
            severity: 'high',
            message: `View Controller grande (${lines} líneas). Considerar refactorizar a arquitectura moderna.`,
            filePath: file,
            line: 1
          });
        }

        // 2. Lógica de negocio en ViewController
        const hasBusinessLogic = 
          content.includes('URLSession') ||
          content.includes('CoreData') ||
          content.includes('UserDefaults') ||
          (content.match(/func\s+\w+\([^)]*\)\s*{[\s\S]{100,}}/g) || []).length > 5;

        if (hasBusinessLogic) {
          pushFinding(this.findings, {
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

  // ============================================
  // Mixed Architecture Rules (Anti-pattern)
  // ============================================
  checkMixedArchitectureRules(files) {
    pushFinding(this.findings, {
      ruleId: 'ios.architecture.mixed_patterns',
      severity: 'critical',
      message: 'Múltiples patrones arquitectónicos detectados en el proyecto. Esto indica inconsistencia arquitectónica grave.',
      filePath: 'PROJECT_ROOT',
      line: 1,
      suggestion: 'Refactorizar para usar un único patrón arquitectónico consistente en todo el proyecto.'
    });

    // Detectar archivos que violan el patrón mixto
    const patterns = {
      mvvm: files.filter(f => f.includes('ViewModel.swift')).length,
      mvp: files.filter(f => f.includes('Presenter.swift')).length,
      viper: files.filter(f => f.includes('Interactor.swift') || f.includes('Router.swift')).length
    };

    const activePatternsCount = Object.values(patterns).filter(count => count > 0).length;
    
    if (activePatternsCount >= 2) {
      pushFinding(this.findings, {
        ruleId: 'ios.architecture.inconsistent_structure',
        severity: 'high',
        message: `Se detectaron ${activePatternsCount} patrones diferentes. Estandarizar en un único patrón.`,
        filePath: 'PROJECT_ROOT',
        line: 1
      });
    }
  }

  readFile(file) {
    const fs = require('fs');
    const path = require('path');
    try {
      return fs.readFileSync(file, 'utf-8');
    } catch (error) {
      return '';
    }
  }
}

module.exports = { iOSArchitectureRules };

