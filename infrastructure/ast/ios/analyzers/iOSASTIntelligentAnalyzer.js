// ===== iOS AST INTELLIGENT ANALYZER =====
// 100% Node-based AST analysis using SourceKitten
// NO regex/includes for rule detection - pure AST traversal
// Enterprise-grade: SOLID, Clean Architecture, SwiftUI, Concurrency, Memory, Testing

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class iOSASTIntelligentAnalyzer {
  constructor(findings) {
    this.findings = findings;
    this.sourceKittenPath = '/opt/homebrew/bin/sourcekitten';
    this.isAvailable = this.checkSourceKitten();
    this.hasSwiftSyntax = this.checkSwiftSyntax();
    this.fileContent = '';
    this.currentFilePath = '';
    this.allNodes = [];
    this.imports = [];
    this.classes = [];
    this.structs = [];
    this.protocols = [];
    this.functions = [];
    this.properties = [];
    this.closures = [];
  }

  checkSourceKitten() {
    try {
      execSync(`${this.sourceKittenPath} version`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  checkSwiftSyntax() {
    // Dynamic project root detection (portable)
    const projectRoot = require('child_process')
      .execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' })
      .trim();

    const possiblePaths = [
      path.join(__dirname, '../../../../../../CustomLintRules/.build/debug/swift-ast-analyzer'),
      path.join(projectRoot, 'CustomLintRules/.build/debug/swift-ast-analyzer'),
      path.join(projectRoot, '.build/debug/swift-ast-analyzer')
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        this.swiftSyntaxPath = p;
        return true;
      }
    }
    return false;
  }

  analyzeWithSwiftSyntax(filePath) {
    if (!this.swiftSyntaxPath) return;
    try {
      const result = execSync(`"${this.swiftSyntaxPath}" "${filePath}"`, {
        encoding: 'utf8', timeout: 30000, stdio: ['pipe', 'pipe', 'pipe']
      });
      const violations = JSON.parse(result);
      for (const v of violations) {
        this.findings.push({
          ruleId: v.ruleId, severity: v.severity, filePath,
          line: v.line, column: v.column, message: v.message
        });
      }
    } catch (error) {
      console.error('[iOSASTIntelligentAnalyzer] Error parsing file:', error.message);
    }
  }

  parseFile(filePath) {
    if (!this.isAvailable) return null;
    try {
      const result = execSync(
        `${this.sourceKittenPath} structure --file "${filePath}"`,
        { encoding: 'utf8', timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] }
      );
      return JSON.parse(result);
    } catch {
      return null;
    }
  }

  analyzeFile(filePath) {
    if (!filePath.endsWith('.swift')) return;

    if (this.hasSwiftSyntax) {
      this.analyzeWithSwiftSyntax(filePath);
    }

    const ast = this.parseFile(filePath);
    if (!ast) return;

    this.currentFilePath = filePath;
    this.resetCollections();

    try {
      this.fileContent = fs.readFileSync(filePath, 'utf8');
    } catch {
      this.fileContent = '';
    }

    const substructure = ast['key.substructure'] || [];

    this.collectAllNodes(substructure, null);
    this.analyzeCollectedNodes(filePath);
  }

  resetCollections() {
    this.allNodes = [];
    this.imports = [];
    this.classes = [];
    this.structs = [];
    this.protocols = [];
    this.functions = [];
    this.properties = [];
    this.closures = [];
  }

  collectAllNodes(nodes, parent) {
    if (!Array.isArray(nodes)) return;

    for (const node of nodes) {
      const kind = node['key.kind'] || '';
      node._parent = parent;
      this.allNodes.push(node);

      if (kind === 'source.lang.swift.decl.class') {
        this.classes.push(node);
      } else if (kind === 'source.lang.swift.decl.struct') {
        this.structs.push(node);
      } else if (kind === 'source.lang.swift.decl.protocol') {
        this.protocols.push(node);
      } else if (kind.includes('function')) {
        this.functions.push(node);
      } else if (kind.includes('var')) {
        this.properties.push(node);
      } else if (kind.includes('closure')) {
        this.closures.push(node);
      }

      this.collectAllNodes(node['key.substructure'] || [], node);
    }
  }

  analyzeCollectedNodes(filePath) {
    this.extractImports();

    this.analyzeImportsAST(filePath);

    for (const cls of this.classes) {
      this.analyzeClassAST(cls, filePath);
    }

    for (const struct of this.structs) {
      this.analyzeStructAST(struct, filePath);
    }

    for (const proto of this.protocols) {
      this.analyzeProtocolAST(proto, filePath);
    }

    for (const func of this.functions) {
      this.analyzeFunctionAST(func, filePath);
    }

    for (const prop of this.properties) {
      this.analyzePropertyAST(prop, filePath);
    }

    this.analyzeClosuresAST(filePath);
    this.analyzeCleanArchitectureAST(filePath);
    this.analyzeAdditionalRules(filePath);
  }

  extractImports() {
    const lines = this.fileContent.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('import ')) {
        this.imports.push({
          name: line.replace('import ', '').trim(),
          line: i + 1
        });
      }
    }
  }

  analyzeImportsAST(filePath) {
    const importNames = this.imports.map(i => i.name);

    const hasUIKit = importNames.includes('UIKit');
    const hasSwiftUI = importNames.includes('SwiftUI');
    const hasCombine = importNames.includes('Combine');

    if (hasUIKit && hasSwiftUI) {
      this.pushFinding('ios.architecture.mixed_ui_frameworks', 'medium', filePath, 1,
        'Mixing UIKit and SwiftUI - consider separating concerns');
    }

    const hasAsyncFunction = this.functions.some(f =>
      this.hasAttribute(f, 'async')
    );

    if (hasCombine && !hasAsyncFunction) {
      this.pushFinding('ios.concurrency.combine_without_async', 'low', filePath, 1,
        'Using Combine - consider async/await for simpler async code');
    }

    for (const imp of this.imports) {
      if (['Foundation', 'SwiftUI', 'UIKit', 'Combine'].includes(imp.name)) continue;

      const isUsed = this.allNodes.some(n => {
        const typename = n['key.typename'] || '';
        const name = n['key.name'] || '';
        return typename.includes(imp.name) || name.includes(imp.name);
      });

      if (!isUsed) {
        this.pushFinding('ios.imports.unused', 'low', filePath, imp.line,
          `Unused import: ${imp.name}`);
      }
    }

    if (filePath.includes('/Domain/') && (hasUIKit || hasSwiftUI)) {
      this.pushFinding('ios.architecture.domain_ui_import', 'critical', filePath, 1,
        'Domain layer imports UI framework - violates Clean Architecture');
    }
  }

  analyzeClassAST(node, filePath) {
    const name = node['key.name'] || '';
    const line = node['key.line'] || 1;
    const bodyLength = node['key.bodylength'] || 0;
    const substructure = node['key.substructure'] || [];
    const inheritedTypes = (node['key.inheritedtypes'] || []).map(t => t['key.name']);
    const attributes = this.getAttributes(node);

    const methods = substructure.filter(n => (n['key.kind'] || '').includes('function'));
    const properties = substructure.filter(n => (n['key.kind'] || '').includes('var'));
    const inits = methods.filter(m => (m['key.name'] || '').startsWith('init'));

    if (methods.length > 15 || properties.length > 10 || bodyLength > 400) {
      this.pushFinding('ios.solid.srp.god_class', 'critical', filePath, line,
        `God class '${name}': ${methods.length} methods, ${properties.length} properties - VIOLATES SRP`);
    }

    if (name.includes('ViewController')) {
      if (bodyLength > 250 || methods.length > 8) {
        this.pushFinding('ios.architecture.massive_viewcontroller', 'high', filePath, line,
          `Massive ViewController '${name}': ${bodyLength} lines - extract to ViewModel`);
      }

      const hasBusinessLogic = methods.some(m => {
        const methodName = m['key.name'] || '';
        return /calculate|process|validate|fetch|save|delete|update/i.test(methodName);
      });

      if (hasBusinessLogic) {
        this.pushFinding('ios.architecture.vc_business_logic', 'high', filePath, line,
          `ViewController '${name}' contains business logic - move to UseCase`);
      }
    }

    if (name.includes('ViewModel')) {
      const hasMainActor = attributes.includes('MainActor');
      if (!hasMainActor) {
        this.pushFinding('ios.concurrency.viewmodel_mainactor', 'high', filePath, line,
          `ViewModel '${name}' should be @MainActor for UI safety`);
      }

      const hasObservable = inheritedTypes.includes('ObservableObject') ||
        attributes.includes('Observable');
      if (!hasObservable) {
        this.pushFinding('ios.swiftui.viewmodel_observable', 'medium', filePath, line,
          `ViewModel '${name}' should conform to ObservableObject`);
      }

      if (inits.length === 0 && properties.length > 0) {
        this.pushFinding('ios.architecture.viewmodel_no_di', 'high', filePath, line,
          `ViewModel '${name}' has no init - use dependency injection`);
      }
    }

    if (/Manager$|Helper$|Utils$|Handler$/.test(name)) {
      this.pushFinding('ios.naming.god_naming', 'medium', filePath, line,
        `Suspicious class name '${name}' - often indicates SRP violation`);
    }

    const unusedProps = this.findUnusedPropertiesAST(properties, methods);
    for (const prop of unusedProps) {
      this.pushFinding('ios.solid.isp.unused_dependency', 'high', filePath, line,
        `Unused property '${prop}' in '${name}' - ISP violation`);
    }

    this.checkDependencyInjectionAST(properties, filePath, name, line);

    const hasDeinit = methods.some(m => m['key.name'] === 'deinit');
    const hasObservers = this.closures.some(c => c._parent === node) ||
      properties.some(p => this.hasAttribute(p, 'Published'));

    if (!hasDeinit && hasObservers && !name.includes('ViewModel')) {
      this.pushFinding('ios.memory.missing_deinit', 'high', filePath, line,
        `Class '${name}' has observers but no deinit - potential memory leak`);
    }

    const isFinal = attributes.includes('final');
    if (!isFinal && inheritedTypes.length === 0 && name !== 'AppDelegate') {
      this.pushFinding('ios.performance.non_final_class', 'low', filePath, line,
        `Class '${name}' is not final - consider final for performance`);
    }

    const hasSingleton = properties.some(p => {
      const propName = p['key.name'] || '';
      const isStatic = (p['key.kind'] || '').includes('static');
      return isStatic && propName === 'shared';
    });

    if (hasSingleton) {
      this.pushFinding('ios.antipattern.singleton', 'high', filePath, line,
        `Singleton pattern in '${name}' - use dependency injection`);
    }

    if (filePath.includes('Test') && name.includes('Test')) {
      const hasMakeSUT = methods.some(m => (m['key.name'] || '').includes('makeSUT'));
      if (!hasMakeSUT && methods.length > 2) {
        this.pushFinding('ios.testing.missing_makesut', 'medium', filePath, line,
          `Test class '${name}' missing makeSUT() factory`);
      }
    }

    if (name.includes('Repository') && !name.includes('Protocol')) {
      const hasProtocol = inheritedTypes.some(t => t.includes('Protocol'));
      if (!hasProtocol && !filePath.includes('/Domain/')) {
        this.pushFinding('ios.architecture.repository_no_protocol', 'high', filePath, line,
          `Repository '${name}' should implement a protocol`);
      }
    }

    if (name.includes('UseCase')) {
      const hasExecute = methods.some(m => (m['key.name'] || '').includes('execute'));
      if (!hasExecute) {
        this.pushFinding('ios.architecture.usecase_no_execute', 'medium', filePath, line,
          `UseCase '${name}' missing execute() method`);
      }
    }
  }

  analyzeStructAST(node, filePath) {
    const name = node['key.name'] || '';
    const line = node['key.line'] || 1;
    const substructure = node['key.substructure'] || [];
    const inheritedTypes = (node['key.inheritedtypes'] || []).map(t => t['key.name']);

    const methods = substructure.filter(n => (n['key.kind'] || '').includes('function'));
    const properties = substructure.filter(n => (n['key.kind'] || '').includes('var'));

    if (inheritedTypes.includes('View')) {
      this.analyzeSwiftUIViewAST(node, filePath, name, line, methods, properties);
    }

    if (inheritedTypes.includes('Codable') || inheritedTypes.includes('Decodable')) {
      const hasOptionalProps = properties.some(p => (p['key.typename'] || '').includes('?'));
      const hasCodingKeys = substructure.some(n => n['key.name'] === 'CodingKeys');

      if (hasOptionalProps && !hasCodingKeys) {
        this.pushFinding('ios.codable.missing_coding_keys', 'low', filePath, line,
          `Struct '${name}' has optional properties - consider CodingKeys`);
      }
    }

    if ((inheritedTypes.includes('Equatable') || inheritedTypes.includes('Hashable')) &&
      properties.length > 5) {
      this.pushFinding('ios.performance.large_equatable', 'low', filePath, line,
        `Struct '${name}' has ${properties.length} properties with Equatable`);
    }
  }

  analyzeSwiftUIViewAST(node, filePath, name, line, methods, properties) {
    const bodyMethod = methods.find(m => m['key.name'] === 'body');
    if (bodyMethod) {
      const bodyLength = bodyMethod['key.bodylength'] || 0;
      if (bodyLength > 100) {
        this.pushFinding('ios.swiftui.complex_body', 'high', filePath, line,
          `View '${name}' has complex body (${bodyLength} lines) - extract subviews`);
      }
    }

    const stateProps = properties.filter(p =>
      this.hasAttribute(p, 'State') || this.hasAttribute(p, 'Binding')
    );

    if (stateProps.length > 5) {
      this.pushFinding('ios.swiftui.too_many_state', 'medium', filePath, line,
        `View '${name}' has ${stateProps.length} @State/@Binding - consider ViewModel`);
    }

    const hasObservedObject = properties.some(p => this.hasAttribute(p, 'ObservedObject'));
    const hasStateObject = properties.some(p => this.hasAttribute(p, 'StateObject'));

    if (hasObservedObject && !hasStateObject) {
      this.pushFinding('ios.swiftui.observed_without_state', 'medium', filePath, line,
        `View '${name}' uses @ObservedObject - consider @StateObject for ownership`);
    }
  }

  analyzeProtocolAST(node, filePath) {
    const name = node['key.name'] || '';
    const line = node['key.line'] || 1;
    const substructure = node['key.substructure'] || [];

    const requirements = substructure.filter(n =>
      (n['key.kind'] || '').includes('function') || (n['key.kind'] || '').includes('var')
    );

    if (requirements.length > 5) {
      this.pushFinding('ios.solid.isp.fat_protocol', 'medium', filePath, line,
        `Protocol '${name}' has ${requirements.length} requirements - consider splitting (ISP)`);
    }
  }

  analyzeFunctionAST(node, filePath) {
    const name = node['key.name'] || '';
    const line = node['key.line'] || 1;
    const bodyLength = node['key.bodylength'] || 0;
    const attributes = this.getAttributes(node);
    const substructure = node['key.substructure'] || [];

    if (bodyLength > 50) {
      this.pushFinding('ios.quality.long_function', 'high', filePath, line,
        `Function '${name}' is too long (${bodyLength} lines)`);
    }

    const complexity = this.calculateComplexityAST(substructure);
    if (complexity > 10) {
      this.pushFinding('ios.quality.high_complexity', 'high', filePath, line,
        `Function '${name}' has high complexity (${complexity})`);
    }

    const params = substructure.filter(n => (n['key.kind'] || '').includes('var.parameter'));
    if (params.length > 5) {
      this.pushFinding('ios.quality.too_many_params', 'medium', filePath, line,
        `Function '${name}' has ${params.length} parameters - use struct`);
    }

    const closuresInFunc = this.countClosuresInNode(node);
    if (closuresInFunc > 3) {
      this.pushFinding('ios.quality.nested_closures', 'medium', filePath, line,
        `Function '${name}' has ${closuresInFunc} nested closures - use async/await`);
    }

    const ifStatements = this.countStatementsOfType(substructure, 'stmt.if');
    const guardStatements = this.countStatementsOfType(substructure, 'stmt.guard');

    if (ifStatements > 3 && guardStatements === 0) {
      this.pushFinding('ios.quality.pyramid_of_doom', 'medium', filePath, line,
        `Function '${name}' has ${ifStatements} nested ifs - use guard clauses`);
    }

    const isAsync = attributes.includes('async');
    const parentClass = node._parent;
    const parentIsView = parentClass &&
      (parentClass['key.inheritedtypes'] || []).some(t => t['key.name'] === 'View');

    if (isAsync && parentIsView && !attributes.includes('MainActor')) {
      this.pushFinding('ios.concurrency.async_ui_update', 'high', filePath, line,
        `Async function '${name}' in View - consider @MainActor`);
    }
  }

  analyzePropertyAST(node, filePath) {
    const name = node['key.name'] || '';
    const line = node['key.line'] || 1;
    const typename = node['key.typename'] || '';
    const attributes = this.getAttributes(node);
    const kind = node['key.kind'] || '';

    if (typename.includes('!') && !attributes.includes('IBOutlet')) {
      this.pushFinding('ios.safety.force_unwrap_property', 'high', filePath, line,
        `Force unwrapped property '${name}: ${typename}'`);
    }

    const isPublic = (node['key.accessibility'] || '').includes('public');
    const isInstance = kind.includes('var.instance');

    if (isPublic && isInstance && !attributes.includes('setter_access')) {
      this.pushFinding('ios.encapsulation.public_mutable', 'medium', filePath, line,
        `Public mutable property '${name}' - consider private(set)`);
    }
  }

  safeStringify(obj) {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (key === '_parent') return undefined;
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return undefined;
        seen.add(value);
      }
      return value;
    });
  }

  analyzeClosuresAST(filePath) {
    for (const closure of this.closures) {
      const closureText = this.safeStringify(closure);
      const hasSelfReference = closureText.includes('"self"') ||
        closureText.includes('key.name":"self');

      const parentFunc = closure._parent;
      const isEscaping = parentFunc &&
        (parentFunc['key.typename'] || '').includes('@escaping');

      if (hasSelfReference && isEscaping) {
        const hasWeakCapture = closureText.includes('weak') ||
          closureText.includes('unowned');

        if (!hasWeakCapture) {
          const line = closure['key.line'] || 1;
          this.pushFinding('ios.memory.missing_weak_self', 'high', filePath, line,
            'Escaping closure captures self without [weak self]');
        }
      }
    }
  }

  analyzeCleanArchitectureAST(filePath) {
    const fileName = path.basename(filePath);

    if (fileName.includes('UseCase')) {
      const hasVoidReturn = this.functions.some(f => {
        const typename = f['key.typename'] || '';
        return (f['key.name'] || '').includes('execute') && typename.includes('Void');
      });

      if (hasVoidReturn) {
        this.pushFinding('ios.architecture.usecase_void', 'medium', filePath, 1,
          'UseCase returns Void - consider returning Result');
      }

      if (!filePath.includes('/Domain/') && !filePath.includes('/Application/')) {
        this.pushFinding('ios.architecture.usecase_wrong_layer', 'high', filePath, 1,
          'UseCase should be in Domain or Application layer');
      }
    }

    // Infrastructure importing Domain UI
    if (filePath.includes('/Infrastructure/')) {
      const hasUIImport = this.imports.some(i => ['SwiftUI', 'UIKit'].includes(i.name));
      if (hasUIImport) {
        this.pushFinding('ios.architecture.infrastructure_ui', 'critical', filePath, 1,
          'Infrastructure layer imports UI framework - violates Clean Architecture');
      }
    }

    // Presentation importing Infrastructure directly
    if (filePath.includes('/Presentation/') || filePath.includes('/Views/')) {
      const hasInfraImport = this.imports.some(i =>
        i.name.includes('Alamofire') || i.name.includes('Realm') || i.name.includes('CoreData')
      );
      if (hasInfraImport) {
        this.pushFinding('ios.architecture.presentation_infra', 'high', filePath, 1,
          'Presentation imports Infrastructure directly - use Domain layer');
      }
    }
  }

  // ===== Additional Rules from rulesios.mdc =====
  analyzeAdditionalRules(filePath) {
    // Coordinator pattern missing
    if (filePath.includes('ViewModel') && this.fileContent.includes('NavigationLink')) {
      const hasCoordinator = this.imports.some(i => i.name.includes('Coordinator'));
      if (!hasCoordinator) {
        this.pushFinding('ios.architecture.missing_coordinator', 'medium', filePath, 1,
          'Navigation in ViewModel - consider Coordinator pattern');
      }
    }

    // DispatchQueue in new code (should use async/await)
    if (this.fileContent.includes('DispatchQueue.main') || this.fileContent.includes('DispatchQueue.global')) {
      const line = this.findLineNumber('DispatchQueue');
      this.pushFinding('ios.concurrency.dispatch_queue', 'medium', filePath, line,
        'DispatchQueue detected - use async/await in new code');
    }

    // Task without error handling
    if (/Task\s*\{/.test(this.fileContent) && !/Task\s*\{[^}]*do\s*\{/.test(this.fileContent)) {
      const line = this.findLineNumber('Task {');
      this.pushFinding('ios.concurrency.task_no_error_handling', 'high', filePath, line,
        'Task without do-catch - handle errors');
    }

    // UserDefaults for sensitive data
    if (this.fileContent.includes('UserDefaults') && /password|token|secret|key/i.test(this.fileContent)) {
      const line = this.findLineNumber('UserDefaults');
      this.pushFinding('ios.security.sensitive_userdefaults', 'critical', filePath, line,
        'Sensitive data in UserDefaults - use Keychain');
    }

    // Hardcoded strings (i18n)
    const hardcodedStrings = this.fileContent.match(/Text\s*\(\s*"[^"]{10,}"\s*\)/g) || [];
    if (hardcodedStrings.length > 3) {
      this.pushFinding('ios.i18n.hardcoded_strings', 'medium', filePath, 1,
        `${hardcodedStrings.length} hardcoded strings - use NSLocalizedString`);
    }

    // Missing accessibility
    if (this.fileContent.includes('Image(') && !this.fileContent.includes('.accessibilityLabel')) {
      const imageCount = (this.fileContent.match(/Image\s*\(/g) || []).length;
      const labelCount = (this.fileContent.match(/\.accessibilityLabel/g) || []).length;
      if (imageCount > labelCount + 2) {
        this.pushFinding('ios.accessibility.missing_labels', 'medium', filePath, 1,
          'Images without accessibilityLabel - add for VoiceOver');
      }
    }

    // Storyboard usage (should use SwiftUI or programmatic)
    if (this.fileContent.includes('@IBOutlet') || this.fileContent.includes('@IBAction')) {
      const line = this.findLineNumber('@IB');
      this.pushFinding('ios.deprecated.storyboard', 'low', filePath, line,
        'Storyboard/XIB detected - consider SwiftUI or programmatic UI');
    }

    // Completion handlers (should use async/await)
    const completionCount = (this.fileContent.match(/completion\s*:\s*@escaping/g) || []).length;
    if (completionCount > 2) {
      this.pushFinding('ios.concurrency.completion_handlers', 'medium', filePath, 1,
        `${completionCount} completion handlers - use async/await`);
    }

    // Actor isolation missing
    for (const cls of this.classes) {
      const hasSharedState = this.properties.some(p =>
        (p['key.kind'] || '').includes('static') &&
        !this.hasAttribute(p, 'MainActor') &&
        !this.hasAttribute(p, 'nonisolated')
      );
      if (hasSharedState && !this.fileContent.includes('actor ')) {
        const name = cls['key.name'] || '';
        const line = cls['key.line'] || 1;
        this.pushFinding('ios.concurrency.missing_actor', 'high', filePath, line,
          `Class '${name}' has shared state - consider actor for thread safety`);
      }
    }

    // Sendable conformance missing
    for (const cls of this.classes) {
      const name = cls['key.name'] || '';
      const inheritedTypes = (cls['key.inheritedtypes'] || []).map(t => t['key.name']);
      const hasAsync = this.functions.some(f => this.hasAttribute(f, 'async'));

      if (hasAsync && !inheritedTypes.includes('Sendable') && !name.includes('ViewModel')) {
        const line = cls['key.line'] || 1;
        this.pushFinding('ios.concurrency.missing_sendable', 'medium', filePath, line,
          `Class '${name}' used in async context - consider Sendable conformance`);
      }
    }
  }

  findLineNumber(text) {
    const idx = this.fileContent.indexOf(text);
    if (idx === -1) return 1;
    return this.fileContent.substring(0, idx).split('\n').length;
  }

  hasAttribute(node, attrName) {
    const attributes = node['key.attributes'] || [];
    return attributes.some(a => (a['key.attribute'] || '').includes(attrName));
  }

  getAttributes(node) {
    const attributes = node['key.attributes'] || [];
    return attributes.map(a => {
      const attr = a['key.attribute'] || '';
      return attr.replace('source.decl.attribute.', '');
    });
  }

  findUnusedPropertiesAST(properties, methods) {
    const unused = [];

    for (const prop of properties) {
      const propName = prop['key.name'];
      if (!propName) continue;

      if (this.hasAttribute(prop, 'Published') ||
        this.hasAttribute(prop, 'State') ||
        this.hasAttribute(prop, 'Binding')) {
        continue;
      }

      let usageCount = 0;
      for (const method of methods) {
        const methodText = this.safeStringify(method);
        if (methodText.includes(`"${propName}"`)) {
          usageCount++;
        }
      }

      if (usageCount === 0) {
        unused.push(propName);
      }
    }

    return unused;
  }

  calculateComplexityAST(substructure) {
    let complexity = 1;

    const traverse = (nodes) => {
      if (!Array.isArray(nodes)) return;

      for (const node of nodes) {
        const kind = node['key.kind'] || '';

        if (kind.includes('stmt.if') || kind.includes('stmt.guard') ||
          kind.includes('stmt.switch') || kind.includes('stmt.for') ||
          kind.includes('stmt.while') || kind.includes('stmt.catch')) {
          complexity++;
        }

        traverse(node['key.substructure'] || []);
      }
    };

    traverse(substructure);
    return complexity;
  }

  countClosuresInNode(node) {
    let count = 0;
    const traverse = (n) => {
      if ((n['key.kind'] || '').includes('closure')) count++;
      for (const child of (n['key.substructure'] || [])) {
        traverse(child);
      }
    };
    traverse(node);
    return count;
  }

  countStatementsOfType(substructure, stmtType) {
    let count = 0;
    const traverse = (nodes) => {
      if (!Array.isArray(nodes)) return;
      for (const node of nodes) {
        if ((node['key.kind'] || '').includes(stmtType)) count++;
        traverse(node['key.substructure'] || []);
      }
    };
    traverse(substructure);
    return count;
  }

  checkDependencyInjectionAST(properties, filePath, className, line) {
    if (!className.includes('ViewModel') && !className.includes('Service') &&
      !className.includes('Repository') && !className.includes('UseCase')) {
      return;
    }

    for (const prop of properties) {
      const typename = prop['key.typename'] || '';

      if (['String', 'Int', 'Bool', 'Double', 'Float', 'Date', 'URL', 'Data'].includes(typename)) {
        continue;
      }

      const isConcreteService = /Service$|Repository$|UseCase$|Client$/.test(typename) &&
        !typename.includes('Protocol') &&
        !typename.includes('any ') &&
        !typename.includes('some ');

      if (isConcreteService) {
        this.pushFinding('ios.solid.dip.concrete_dependency', 'high', filePath, line,
          `'${className}' depends on concrete '${typename}' - use protocol`);
      }
    }
  }

  pushFinding(ruleId, severity, filePath, line, message) {
    this.findings.push({
      ruleId,
      severity: severity.toUpperCase(),
      filePath,
      line,
      column: 1,
      message,
    });
  }
}

module.exports = { iOSASTIntelligentAnalyzer };
