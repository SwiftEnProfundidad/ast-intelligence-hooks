
const path = require('path');
const fs = require('fs').promises;
const { SourceKittenParser } = require('../parsers/SourceKittenParser');
const { pushFinding, mapToLevel } = require(path.join(__dirname, '../../ast-core'));

/**
 * iOSEnterpriseAnalyzer
 * Enterprise-grade Swift/iOS code analyzer
 * Uses SourceKitten for native AST parsing
 *
 * @class iOSEnterpriseAnalyzer
 */
class iOSEnterpriseAnalyzer {
  constructor() {
    this.parser = new SourceKittenParser();
    this.findings = [];
  }

  /**
   * Analyze Swift file with complete iOS rules
   * @param {string} filePath - Path to Swift file
   * @param {Array} findings - Global findings array
   * @returns {Promise<void>}
   */
  async analyzeFile(filePath, findings) {
    this.findings = findings;

    try {
      const ast = await this.parser.parseFile(filePath);

      if (!ast.parsed) {
        console.warn(`[iOS Enterprise] Could not parse ${filePath}: ${ast.error}`);
        return;
      }

      const content = await fs.readFile(filePath, 'utf-8');

      const classes = this.parser.extractClasses(ast);
      const functions = this.parser.extractFunctions(ast);
      const properties = this.parser.extractProperties(ast);
      const protocols = this.parser.extractProtocols(ast);

      await this.analyzeSwiftModerno(ast, content, filePath);
      await this.analyzeSwiftUI(ast, classes, filePath);
      await this.analyzeUIKit(ast, classes, filePath);
      await this.analyzeProtocolOriented(protocols, filePath);
      await this.analyzeValueTypes(classes, filePath);
      await this.analyzeMemoryManagement(content, filePath);
      await this.analyzeOptionals(content, filePath);
      await this.analyzeDependencyInjection(classes, filePath);
      await this.analyzeNetworking(content, filePath);
      await this.analyzePersistence(content, filePath);
      await this.analyzeCombine(content, filePath);
      await this.analyzeConcurrency(content, filePath);
      await this.analyzeTesting(content, filePath);
      await this.analyzeUITesting(content, filePath);
      await this.analyzeSecurity(content, filePath);
      await this.analyzeAccessibility(content, filePath);
      await this.analyzeLocalization(content, filePath);
      await this.analyzeArchitecturePatterns(classes, functions, filePath);
      await this.analyzePerformance(functions, content, filePath);
      await this.analyzeCodeOrganization(filePath, content);

    } catch (error) {
      console.error(`[iOS Enterprise] Error analyzing ${filePath}:`, error.message);
    }
  }

  /**
   * CATEGORY: Swift Moderno
   * Rules: async/await, structured concurrency, sendable, opaque types, property wrappers, generics
   */
  async analyzeSwiftModerno(ast, content, filePath) {
    // ios.async_await_missing
    if (content.includes('completion:') && !content.includes('async ')) {
      this.addFinding('ios.async_await_missing', 'medium', filePath, 1,
        'Using completion handlers instead of async/await (Swift 5.9+ required)');
    }

    // ios.structured_concurrency_missing
    const taskCount = (content.match(/\bTask\s*\{/g) || []).length;
    if (taskCount > 3 && !content.includes('TaskGroup')) {
      this.addFinding('ios.structured_concurrency_missing', 'medium', filePath, 1,
        `Multiple Task blocks (${taskCount}) without TaskGroup - use structured concurrency`);
    }

    // ios.sendable_missing
    if (content.includes('actor ') && !content.includes(': Sendable')) {
      this.addFinding('ios.sendable_missing', 'low', filePath, 1,
        'Actor should conform to Sendable protocol for thread-safe types');
    }

    // ios.opaque_types_missing
    if (content.includes('func ') && content.includes('-> View') && !content.includes('some View')) {
      this.addFinding('ios.opaque_types_missing', 'low', filePath, 1,
        'Use "some View" instead of explicit View protocol return');
    }

    // ios.property_wrappers_missing
    if (content.includes('UIViewController') && !content.includes('@State') && !content.includes('@Binding')) {
      this.addFinding('ios.property_wrappers_missing', 'info', filePath, 1,
        'Consider using SwiftUI property wrappers (@State, @Binding) for state management');
    }

    // ios.generics_missing
    const functions = this.parser.extractFunctions(ast);
    functions.forEach(fn => {
      if (fn.name.includes('Array') || fn.name.includes('Collection')) {
        if (!content.includes('<T>') && !content.includes('<Element>')) {
          this.addFinding('ios.generics_missing', 'low', filePath, fn.line,
            `Function ${fn.name} should use generics for type safety`);
        }
      }
    });
  }

  /**
   * CATEGORY: SwiftUI
   * Rules: SwiftUI primero, @State, @Binding, @StateObject, @ObservedObject, @EnvironmentObject
   */
  async analyzeSwiftUI(ast, classes, filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const usesSwiftUI = this.parser.usesSwiftUI(ast);
    const usesUIKit = this.parser.usesUIKit(ast);

    // ios.swiftui_first
    if (usesUIKit && !usesSwiftUI) {
      this.addFinding('ios.swiftui_first', 'medium', filePath, 1,
        'Consider migrating to SwiftUI for new views (UIKit only when strictly necessary)');
    }

    if (usesSwiftUI) {
      // ios.state_local_missing
      if (!content.includes('@State')) {
        this.addFinding('ios.state_local_missing', 'info', filePath, 1,
          'SwiftUI view without @State - consider if local state is needed');
      }

      // ios.stateobject_missing
      if (content.includes('ObservableObject') && !content.includes('@StateObject')) {
        this.addFinding('ios.stateobject_missing', 'high', filePath, 1,
          'ObservableObject should be owned with @StateObject, not @ObservedObject');
      }

      // ios.environmentobject_missing
      if (content.includes('class') && content.includes('ObservableObject') && !content.includes('@EnvironmentObject')) {
        this.addFinding('ios.environmentobject_missing', 'info', filePath, 1,
          'Consider using @EnvironmentObject for dependency injection in SwiftUI');
      }

      // ios.declarativo_missing
      if (content.includes('.frame(') && content.includes('CGRect(')) {
        this.addFinding('ios.declarativo_missing', 'medium', filePath, 1,
          'Using imperative CGRect in SwiftUI - use declarative .frame() modifiers');
      }

      // ios.geometryreader_moderation
      const geometryReaderCount = (content.match(/GeometryReader/g) || []).length;
      if (geometryReaderCount > 2) {
        this.addFinding('ios.geometryreader_moderation', 'medium', filePath, 1,
          `Excessive GeometryReader usage (${geometryReaderCount}x) - use only when necessary`);
      }
    }
  }

  /**
   * CATEGORY: UIKit
   * Rules: Programmatic UI, ViewControllers delgados, MVVM
   */
  async analyzeUIKit(ast, classes, filePath) {
    const content = await fs.readFile(filePath, 'utf-8');

    classes.forEach(cls => {
      if (cls.name.includes('ViewController')) {
        // ios.massive_viewcontrollers
        const linesCount = cls.substructure.length * 10;
        if (linesCount > 300) {
          this.addFinding('ios.massive_viewcontrollers', 'high', filePath, cls.line,
            `Massive ViewController ${cls.name} (~${linesCount} lines) - break down into smaller components`);
        }

        // ios.uikit.viewmodel_delegation
        if (!content.includes('ViewModel')) {
          this.addFinding('ios.uikit.viewmodel_delegation', 'medium', filePath, cls.line,
            `ViewController ${cls.name} should delegate logic to ViewModel (MVVM pattern)`);
        }
      }
    });

    // ios.storyboards
    if (filePath.endsWith('.swift') && !filePath.includes('analyzer') && !filePath.includes('detector')) {
      if (content.includes('storyboard') || content.includes('.xib') || content.includes('.nib')) {
        this.addFinding('ios.storyboards', 'high', filePath, 1,
          'Storyboard/XIB detected - use programmatic UI for better version control');
      }
    }
  }

  /**
   * CATEGORY: Protocol-Oriented Programming
   * Rules: Protocols over inheritance, protocol extensions, testability
   */
  async analyzeProtocolOriented(protocols, filePath) {
    const content = await fs.readFile(filePath, 'utf-8');

    // ios.pop.missing_extensions
    if (protocols.length > 0 && !content.includes('extension ')) {
      this.addFinding('ios.pop.missing_extensions', 'low', filePath, 1,
        'Protocols detected but no extensions - consider protocol extensions for default implementations');
    }

    // ios.pop.missing_composition_over_inheritance
    if (content.includes('class ') && content.includes(': ')) {
      const inheritanceCount = (content.match(/class\s+\w+\s*:\s*\w+/g) || []).length;
      if (inheritanceCount > 2) {
        this.addFinding('ios.pop.missing_composition_over_inheritance', 'medium', filePath, 1,
          `Excessive class inheritance (${inheritanceCount}x) - prefer protocol composition`);
      }
    }
  }

  /**
   * CATEGORY: Value Types
   * Rules: struct por defecto, inmutabilidad, copy-on-write
   */
  async analyzeValueTypes(classes, filePath) {
    const content = await fs.readFile(filePath, 'utf-8');

    // ios.values.classes_instead_structs
    classes.forEach(cls => {
      if (!cls.inheritedTypes.length && !content.includes('ObservableObject')) {
        this.addFinding('ios.values.classes_instead_structs', 'medium', filePath, cls.line,
          `Class ${cls.name} without inheritance - consider struct for value semantics`);
      }
    });

    // ios.values.mutability
    const varCount = (content.match(/\bvar\s+/g) || []).length;
    const letCount = (content.match(/\blet\s+/g) || []).length;
    if (varCount > letCount) {
      this.addFinding('ios.values.mutability', 'low', filePath, 1,
        `More var (${varCount}) than let (${letCount}) - prefer immutability`);
    }
  }

  /**
   * CATEGORY: Memory Management
   * Rules: [weak self], [unowned self], retain cycles, deinit, ARC
   */
  async analyzeMemoryManagement(content, filePath) {
    // ios.memory.missing_weak_self
    const closureMatches = content.match(/\{\s*\[/g);
    const weakSelfMatches = content.match(/\[weak self\]/g);
    if (closureMatches && closureMatches.length > (weakSelfMatches?.length || 0)) {
      this.addFinding('ios.memory.missing_weak_self', 'high', filePath, 1,
        'Closures without [weak self] - potential retain cycles');
    }

    // ios.memory.retain_cycles
    if (content.includes('self.') && content.includes('{') && !content.includes('[weak self]')) {
      this.addFinding('ios.memory.retain_cycles', 'high', filePath, 1,
        'Potential retain cycle - closure captures self without [weak self]');
    }

    // ios.memory.missing_deinit
    if (content.includes('class ') && !content.includes('deinit')) {
      this.addFinding('ios.memory.missing_deinit', 'low', filePath, 1,
        'Class without deinit - consider adding for cleanup verification');
    }
  }

  /**
   * CATEGORY: Optionals
   * Rules: No force unwrapping, if let, guard let, nil coalescing
   */
  async analyzeOptionals(content, filePath) {
    // ios.force_unwrapping
    const forceUnwraps = content.match(/(\w+)\s*!/g);
    if (forceUnwraps && forceUnwraps.length > 0) {
      const nonIBOutlets = forceUnwraps.filter(match => !content.includes(`@IBOutlet`));
      if (nonIBOutlets.length > 0) {
        this.addFinding('ios.force_unwrapping', 'high', filePath, 1,
          `Force unwrapping (!) detected ${nonIBOutlets.length}x - use if let or guard let`);
      }
    }

    // ios.optionals.optional_binding
    const ifLetCount = (content.match(/if\s+let\s+/g) || []).length;
    const guardLetCount = (content.match(/guard\s+let\s+/g) || []).length;
    if (ifLetCount === 0 && guardLetCount === 0 && content.includes('?')) {
      this.addFinding('ios.optionals.optional_binding', 'medium', filePath, 1,
        'Optionals present but no optional binding - use if let or guard let');
    }

    // ios.optionals.missing_nil_coalescing
    if (content.includes('?') && !content.includes('??')) {
      this.addFinding('ios.optionals.missing_nil_coalescing', 'info', filePath, 1,
        'Consider using nil coalescing operator (??) for default values');
    }
  }

  /**
   * Helper method to add finding
   */
  addFinding(ruleId, severity, filePath, line, message) {
    this.findings.push({
      ruleId,
      severity,
      message,
      filePath,
      line,
      platform: 'ios',
    });
  }

  /**
   * CATEGORY: Dependency Injection
   * Rules: Protocols en domain, no singletons, factory pattern, @EnvironmentObject
   */
  async analyzeDependencyInjection(classes, filePath) {
    const content = await fs.readFile(filePath, 'utf-8');

    // ios.di.singleton_usage
    if (content.includes('.shared') || content.includes('static let shared')) {
      this.addFinding('ios.di.singleton_usage', 'high', filePath, 1,
        'Singleton detected - use dependency injection instead');
    }

    // ios.di.missing_protocol_injection
    classes.forEach(cls => {
      if (cls.name.includes('ViewModel') || cls.name.includes('Service')) {
        const hasInit = content.includes(`init(`);
        if (!hasInit) {
          this.addFinding('ios.di.missing_protocol_injection', 'medium', filePath, cls.line,
            `${cls.name} should inject dependencies via initializer`);
        }
      }
    });

    // ios.di.missing_factory
    if (content.includes('init(') && content.match(/init\([^)]{50,}\)/)) {
      this.addFinding('ios.di.missing_factory', 'low', filePath, 1,
        'Complex initialization - consider factory pattern');
    }
  }

  /**
   * CATEGORY: Networking
   * Rules: URLSession, async/await, Codable, error handling, SSL pinning, retry logic
   */
  async analyzeNetworking(content, filePath) {
    // ios.networking.urlsession
    if (!content.includes('URLSession') && !content.includes('Alamofire')) {
      if (content.includes('http://') || content.includes('https://')) {
        this.addFinding('ios.networking.missing_urlsession', 'high', filePath, 1,
          'Network URLs detected but no URLSession/Alamofire usage');
      }
    }

    // ios.networking.completion_handlers_instead_async
    if (content.includes('URLSession') && content.includes('completionHandler:') && !content.includes('async')) {
      this.addFinding('ios.networking.completion_handlers_instead_async', 'medium', filePath, 1,
        'Using completion handlers with URLSession - migrate to async/await');
    }

    // ios.networking.missing_codable
    if (content.includes('JSONSerialization') && !content.includes('Codable')) {
      this.addFinding('ios.networking.missing_codable', 'medium', filePath, 1,
        'Manual JSON parsing - use Codable for type safety');
    }

    // ios.networking.missing_error_handling
    if (content.includes('URLSession') && !content.includes('NetworkError')) {
      this.addFinding('ios.networking.missing_error_handling', 'high', filePath, 1,
        'Network code without custom NetworkError enum');
    }

    // ios.networking.missing_ssl_pinning
    if (content.includes('URLSession') && !content.includes('serverTrustPolicy') && !content.includes('pinning')) {
      this.addFinding('ios.networking.missing_ssl_pinning', 'medium', filePath, 1,
        'Consider SSL pinning for high-security apps');
    }

    // ios.networking.missing_retry
    if (content.includes('URLSession') && !content.includes('retry')) {
      this.addFinding('ios.networking.missing_retry', 'low', filePath, 1,
        'Network requests without retry logic');
    }
  }

  /**
   * CATEGORY: Persistence
   * Rules: UserDefaults, Keychain, Core Data, SwiftData, FileManager
   */
  async analyzePersistence(content, filePath) {
    // ios.persistence.userdefaults_sensitive
    if (content.includes('UserDefaults') && (content.includes('password') || content.includes('token') || content.includes('auth'))) {
      this.addFinding('ios.persistence.userdefaults_sensitive', 'critical', filePath, 1,
        'Sensitive data in UserDefaults - use Keychain instead');
    }

    // ios.persistence.missing_keychain
    if ((content.includes('password') || content.includes('token')) && !content.includes('Keychain') && !content.includes('Security')) {
      this.addFinding('ios.persistence.missing_keychain', 'critical', filePath, 1,
        'Sensitive data detected but no Keychain usage');
    }

    // ios.persistence.core_data_on_main
    if (content.includes('NSManagedObjectContext') && content.includes('.main')) {
      this.addFinding('ios.persistence.core_data_on_main', 'high', filePath, 1,
        'Core Data operations on main thread - use background context');
    }

    // ios.persistence.missing_migration
    if (content.includes('NSPersistentContainer') && !content.includes('NSMigrationManager')) {
      this.addFinding('ios.persistence.missing_migration', 'medium', filePath, 1,
        'Core Data without migration strategy');
    }
  }

  /**
   * CATEGORY: Combine
   * Rules: Publishers, @Published, subscribers, operators, cancellables
   */
  async analyzeCombine(content, filePath) {
    // ios.combine.missing_cancellables
    if (content.includes('.sink(') && !content.includes('AnyCancellable')) {
      this.addFinding('ios.combine.missing_cancellables', 'high', filePath, 1,
        'Combine sink without storing AnyCancellable - memory leak');
    }

    // ios.combine.published_without_combine
    if (content.includes('@Published') && !content.includes('import Combine')) {
      this.addFinding('ios.combine.published_without_combine', 'high', filePath, 1,
        '@Published used but Combine not imported');
    }

    // ios.combine.error_handling
    if (content.includes('.sink(') && !content.includes('receiveCompletion')) {
      this.addFinding('ios.combine.error_handling', 'medium', filePath, 1,
        'Combine subscriber without error handling (receiveCompletion)');
    }

    // ios.combine.prefer_async_await
    if (content.includes('Future<') && !content.includes('async')) {
      this.addFinding('ios.combine.prefer_async_await', 'low', filePath, 1,
        'Combine Future for single value - consider async/await instead');
    }
  }

  /**
   * CATEGORY: Concurrency
   * Rules: async/await, Task, TaskGroup, actor, @MainActor, Sendable
   */
  async analyzeConcurrency(content, filePath) {
    // ios.concurrency.dispatchqueue_old
    if (content.includes('DispatchQueue') && !content.includes('async func')) {
      this.addFinding('ios.concurrency.dispatchqueue_old', 'medium', filePath, 1,
        'Using DispatchQueue - prefer async/await for new code');
    }

    // ios.concurrency.missing_mainactor
    if (content.includes('DispatchQueue.main') && content.includes('UI')) {
      this.addFinding('ios.concurrency.missing_mainactor', 'medium', filePath, 1,
        'Manual main thread dispatch - use @MainActor annotation');
    }

    // ios.concurrency.task_cancellation
    if (content.includes('Task {') && !content.includes('.cancel()') && !content.includes('Task.isCancelled')) {
      this.addFinding('ios.concurrency.task_cancellation', 'low', filePath, 1,
        'Task without cancellation handling');
    }

    // ios.concurrency.actor_missing
    if (content.includes('var ') && content.includes('queue') && !content.includes('actor')) {
      this.addFinding('ios.concurrency.actor_missing', 'medium', filePath, 1,
        'Manual synchronization with queue - consider actor for thread safety');
    }
  }

  /**
   * CATEGORY: Testing
   * Rules: XCTest, Quick/Nimble, makeSUT, trackForMemoryLeaks, protocols, coverage
   */
  async analyzeTesting(content, filePath) {
    // ios.testing.missing_xctest
    if (filePath.includes('Test') && !content.includes('XCTest') && !content.includes('Quick')) {
      this.addFinding('ios.testing.missing_xctest', 'high', filePath, 1,
        'Test file without XCTest or Quick import');
    }

    // ios.testing.missing_makesut
    if (filePath.includes('Test') && !content.includes('makeSUT') && content.includes('func test')) {
      this.addFinding('ios.testing.missing_makesut', 'medium', filePath, 1,
        'Test without makeSUT pattern - centralize system under test creation');
    }

    // ios.testing.missing_memory_leak_tracking
    if (filePath.includes('Test') && !content.includes('trackForMemoryLeaks') && content.includes('class')) {
      this.addFinding('ios.testing.missing_memory_leak_tracking', 'medium', filePath, 1,
        'Test without trackForMemoryLeaks helper');
    }

    if (filePath.includes('Test') && content.includes('init(') && !content.includes('Protocol')) {
      this.addFinding('ios.testing.concrete_dependencies', 'medium', filePath, 1,
        'Test using concrete dependencies - inject protocols for testability');
    }
  }

  /**
   * CATEGORY: UI Testing
   * Rules: XCUITest, accessibility identifiers, page object, wait for existence
   */
  async analyzeUITesting(content, filePath) {
    if (filePath.includes('UITest') && !content.includes('XCUIApplication')) {
      this.addFinding('ios.uitesting.missing_xcuitest', 'high', filePath, 1,
        'UI test file without XCUIApplication');
    }

    if (filePath.includes('UITest') && !content.includes('accessibilityIdentifier')) {
      this.addFinding('ios.uitesting.missing_accessibility', 'medium', filePath, 1,
        'UI test without accessibility identifiers for element location');
    }

    if (filePath.includes('UITest') && content.includes('XCUIElement') && !content.includes('Page')) {
      this.addFinding('ios.uitesting.missing_page_object', 'low', filePath, 1,
        'UI test without Page Object pattern for encapsulation');
    }

    if (filePath.includes('UITest') && content.includes('.tap()') && !content.includes('waitForExistence')) {
      this.addFinding('ios.uitesting.missing_wait', 'high', filePath, 1,
        'UI test tapping without waitForExistence - flaky test');
    }
  }

  /**
   * CATEGORY: Security
   * Rules: Keychain, SSL pinning, jailbreak detection, ATS, biometric, secure enclave
   */
  async analyzeSecurity(content, filePath) {
    if (content.includes('http://') && !content.includes('NSAppTransportSecurity')) {
      this.addFinding('ios.security.missing_ats', 'critical', filePath, 1,
        'HTTP URLs without App Transport Security exception');
    }

    if ((content.includes('password') || content.includes('auth')) && !content.includes('LAContext') && !content.includes('biometric')) {
      this.addFinding('ios.security.missing_biometric', 'medium', filePath, 1,
        'Authentication without biometric option (Face ID/Touch ID)');
    }

    if (content.includes('Security') && !content.includes('jailbreak') && !content.includes('Cydia')) {
      this.addFinding('ios.security.missing_jailbreak', 'low', filePath, 1,
        'Consider jailbreak detection for security-critical apps');
    }

    if (content.includes('SecKey') && !content.includes('kSecAttrTokenIDSecureEnclave')) {
      this.addFinding('ios.security.missing_secure_enclave', 'medium', filePath, 1,
        'Cryptographic keys without Secure Enclave storage');
    }

    const secretPatterns = /(api[_-]?key|secret|password|token)\s*=\s*["'][^"']{8,}["']/gi;
    if (secretPatterns.test(content)) {
      this.addFinding('ios.security.hardcoded_secrets', 'critical', filePath, 1,
        'Hardcoded secrets detected in code - use environment/keychain');
    }
  }

  /**
   * CATEGORY: Accessibility
   * Rules: VoiceOver, Dynamic Type, accessibility labels, traits, reduce motion
   */
  async analyzeAccessibility(content, filePath) {
    if (content.includes('UIButton') && !content.includes('accessibilityLabel')) {
      this.addFinding('ios.accessibility.missing_labels', 'high', filePath, 1,
        'UIButton without accessibilityLabel for VoiceOver');
    }

    if (content.includes('UIFont') && !content.includes('preferredFont')) {
      this.addFinding('ios.accessibility.missing_dynamic_type', 'medium', filePath, 1,
        'UIFont without Dynamic Type support - use preferredFont');
    }

    if (content.includes('accessibilityLabel') && !content.includes('accessibilityTraits')) {
      this.addFinding('ios.accessibility.missing_traits', 'medium', filePath, 1,
        'Accessibility label without traits (.isButton, .isHeader)');
    }

    if (content.includes('UIView.animate') && !content.includes('isReduceMotionEnabled')) {
      this.addFinding('ios.accessibility.missing_reduce_motion', 'low', filePath, 1,
        'Animations without respecting Reduce Motion setting');
    }

    if (content.includes('UIColor') && content.includes('.gray') && content.includes('Text')) {
      this.addFinding('ios.accessibility.color_contrast', 'medium', filePath, 1,
        'Gray text color - verify WCAG AA contrast ratio (4.5:1 minimum)');
    }
  }

  /**
   * CATEGORY: Localization (i18n)
   * Rules: NSLocalizedString, Localizable.strings, Stringsdict, RTL, formatters
   */
  async analyzeLocalization(content, filePath) {
    // ios.i18n.hardcoded_strings
    const textMatches = content.match(/(Text|UILabel)\(["\'][^"\']+["\']\)/g);
    if (textMatches && textMatches.length > 0 && !content.includes('NSLocalizedString')) {
      this.addFinding('ios.i18n.hardcoded_strings', 'medium', filePath, 1,
        `Hardcoded UI strings (${textMatches.length}x) - use NSLocalizedString`);
    }

    if (content.includes('NSLocalizedString') && !filePath.includes('Localizable.strings')) {
      this.addFinding('ios.i18n.missing_localizable', 'low', filePath, 1,
        'NSLocalizedString used - ensure Localizable.strings exists');
    }

    if (content.includes('String(') && content.match(/\d+\.\d+/)) {
      this.addFinding('ios.i18n.missing_number_formatter', 'medium', filePath, 1,
        'Manual number formatting - use NumberFormatter for locale support');
    }

    if (content.includes('Date') && content.includes('String') && !content.includes('DateFormatter')) {
      this.addFinding('ios.i18n.missing_date_formatter', 'medium', filePath, 1,
        'Manual date formatting - use DateFormatter for locale support');
    }

    if (content.includes('leading') || content.includes('trailing')) {
    } else if (content.includes('.left') || content.includes('.right')) {
      this.addFinding('ios.i18n.missing_rtl', 'medium', filePath, 1,
        'Using left/right instead of leading/trailing - breaks RTL languages');
    }
  }

  /**
   * CATEGORY: Architecture Patterns
   * Rules: MVVM, MVVM-C, TCA, VIPER, avoid MVC
   */
  async analyzeArchitecturePatterns(classes, functions, filePath) {
    const content = await fs.readFile(filePath, 'utf-8');

    const viewControllerClasses = classes.filter(c => c.name.includes('ViewController'));
    viewControllerClasses.forEach(vc => {
      const methodsInVC = functions.filter(f => content.substring(vc.line, vc.line + 1000).includes(f.name));
      if (methodsInVC.length > 20) {
        this.addFinding('ios.architecture.mvc_pattern', 'high', filePath, vc.line,
          `Massive View Controller ${vc.name} (${methodsInVC.length} methods) - migrate to MVVM`);
      }
    });

    if (classes.some(c => c.name.includes('ViewController')) && !classes.some(c => c.name.includes('ViewModel'))) {
      this.addFinding('ios.architecture.missing_mvvm', 'medium', filePath, 1,
        'ViewController without ViewModel - consider MVVM pattern');
    }

    if (content.includes('navigationController') && !content.includes('Coordinator')) {
      this.addFinding('ios.architecture.missing_coordinator', 'low', filePath, 1,
        'Manual navigation - consider Coordinator pattern (MVVM-C)');
    }
  }

  /**
   * CATEGORY: Performance
   * Rules: Instruments, lazy loading, image optimization, background threads, reuse cells
   */
  async analyzePerformance(functions, content, filePath) {
    // ios.performance.blocking_main_thread
    if (content.includes('URLSession') && !content.includes('DispatchQueue') && !content.includes('async')) {
      this.addFinding('ios.performance.blocking_main_thread', 'high', filePath, 1,
        'Network call potentially on main thread - use async or background queue');
    }

    if (content.includes('UITableView') && !content.includes('cellForRowAt') && !content.includes('dequeueReusableCell')) {
      this.addFinding('ios.performance.missing_lazy_loading', 'high', filePath, 1,
        'UITableView without cell reuse - memory issue with large datasets');
    }

    if (content.includes('UIImage(named:') && !content.includes('UIImage.SymbolConfiguration')) {
      this.addFinding('ios.performance.image_not_optimized', 'low', filePath, 1,
        'Consider SF Symbols or optimized image assets');
    }

    functions.forEach(fn => {
      if (fn.bodyLength > 100 && content.includes('@MainActor')) {
        this.addFinding('ios.performance.heavy_computation_main', 'high', filePath, fn.line,
          `Heavy function ${fn.name} on main thread - move to background`);
      }
    });

    if (content.includes('expensive') || content.includes('calculate')) {
      if (!content.includes('cache') && !content.includes('memoized')) {
        this.addFinding('ios.performance.missing_memoization', 'low', filePath, 1,
          'Expensive calculations without caching/memoization');
      }
    }
  }

  /**
   * CATEGORY: Code Organization
   * Rules: SPM, feature modules, extensions, MARK, file naming
   */
  async analyzeCodeOrganization(filePath, content) {
    // ios.organization.missing_mark
    if (content.length > 200 && !content.includes('// MARK:')) {
      this.addFinding('ios.organization.missing_mark', 'low', filePath, 1,
        'Large file without MARK comments for organization');
    }

    const lineCount = content.split('\n').length;
    if (lineCount > 400) {
      this.addFinding('ios.organization.file_too_large', 'medium', filePath, 1,
        `File too large (${lineCount} lines) - break into smaller files`);
    }

    if (content.includes('extension ') && filePath.includes('+')) {
      this.addFinding('ios.organization.missing_extensions', 'low', filePath, 1,
        'Extension file without + extension - split into separate files (Type+Extension.swift)');
    } else if (content.split('extension ').length > 3) {
      this.addFinding('ios.organization.missing_extensions', 'low', filePath, 1,
        'Multiple extensions in single file - split into separate files (Type+Extension.swift)');
    }

    if (filePath.includes('/Sources/') && !content.includes('import PackageDescription')) {
      this.addFinding('ios.organization.missing_spm', 'info', filePath, 1,
        'Consider Swift Package Manager for modularization');
    }
  }
}

module.exports = { iOSEnterpriseAnalyzer };
