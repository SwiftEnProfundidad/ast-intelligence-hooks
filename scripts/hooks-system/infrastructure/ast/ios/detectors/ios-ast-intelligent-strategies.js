const path = require('path');
const DIValidationService = require('../../../../application/DIValidationService');
const { resolveSrpSeverity, isThinWrapperSummary } = require('../utils/ios-srp-helpers');

const diValidationService = new DIValidationService();

function resetCollections(analyzer) {
    analyzer.allNodes = [];
    analyzer.imports = [];
    analyzer.classes = [];
    analyzer.structs = [];
    analyzer.protocols = [];
    analyzer.functions = [];
    analyzer.properties = [];
    analyzer.closures = [];
}

function collectAllNodes(analyzer, nodes, parent) {
    if (!Array.isArray(nodes)) return;

    for (const node of nodes) {
        const kind = node['key.kind'] || '';
        node._parent = parent;
        analyzer.allNodes.push(node);

        if (kind === 'source.lang.swift.decl.class') {
            analyzer.classes.push(node);
        } else if (kind === 'source.lang.swift.decl.struct') {
            analyzer.structs.push(node);
        } else if (kind === 'source.lang.swift.decl.protocol') {
            analyzer.protocols.push(node);
        } else if (kind.includes('function')) {
            analyzer.functions.push(node);
        } else if (kind.includes('var')) {
            analyzer.properties.push(node);
        } else if (kind.includes('closure')) {
            analyzer.closures.push(node);
        }

        collectAllNodes(analyzer, node['key.substructure'] || [], node);
    }
}

async function analyzeCollectedNodes(analyzer, filePath) {
    extractImports(analyzer);

    analyzeImportsAST(analyzer, filePath);

    for (const cls of analyzer.classes) {
        await analyzeClassAST(analyzer, cls, filePath);
    }

    for (const struct of analyzer.structs) {
        analyzeStructAST(analyzer, struct, filePath);
    }

    for (const proto of analyzer.protocols) {
        analyzeProtocolAST(analyzer, proto, filePath);
    }

    for (const func of analyzer.functions) {
        analyzeFunctionAST(analyzer, func, filePath);
    }

    for (const prop of analyzer.properties) {
        analyzePropertyAST(analyzer, prop, filePath);
    }

    analyzeClosuresAST(analyzer, filePath);
    analyzeCleanArchitectureAST(analyzer, filePath);
    analyzeAdditionalRules(analyzer, filePath);
}

function extractImports(analyzer) {
    const lines = (analyzer.fileContent || '').split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('import ')) {
            analyzer.imports.push({
                name: line.replace('import ', '').trim(),
                line: i + 1,
            });
        }
    }
}

function analyzeImportsAST(analyzer, filePath) {
    if (filePath.includes('Tests')) {
        return;
    }
    const content = analyzer.fileContent || '';
    const importNames = analyzer.imports.map((i) => i.name);

    const hasUIKit = importNames.includes('UIKit');
    const hasSwiftUI = importNames.includes('SwiftUI');
    const hasCombine = importNames.includes('Combine');

    if (hasUIKit && hasSwiftUI) {
        analyzer.pushFinding(
            'ios.architecture.mixed_ui_frameworks',
            'medium',
            filePath,
            1,
            'Mixing UIKit and SwiftUI - consider separating concerns'
        );
    }

    const hasAsyncFunction = analyzer.functions.some((f) => analyzer.hasAttribute(f, 'async'));

    if (hasCombine && !hasAsyncFunction) {
        analyzer.pushFinding(
            'ios.concurrency.combine_without_async',
            'low',
            filePath,
            1,
            'Using Combine - consider async/await for simpler async code'
        );
    }

    const unusedImportAllowlist = new Set(['Foundation', 'SwiftUI', 'UIKit', 'Combine']);

    const foundationTypeUsage = /\b(Data|Date|URL|UUID|Decimal|NSNumber|NSDecimalNumber|NSSet|NSDictionary|NSArray|IndexPath|Notification|FileManager|Bundle|Locale|TimeZone|Calendar|DateComponents|URLRequest|URLSession)\b/;
    for (const imp of analyzer.imports) {
        if (!unusedImportAllowlist.has(imp.name)) continue;

        let isUsed = analyzer.allNodes.some((n) => {
            const typename = n['key.typename'] || '';
            const name = n['key.name'] || '';
            return typename.includes(imp.name) || name.includes(imp.name);
        });
        if (!isUsed && imp.name === 'Foundation') {
            isUsed = foundationTypeUsage.test(content);
        }

        if (!isUsed) {
            analyzer.pushFinding('ios.imports.unused', 'low', filePath, imp.line, `Unused import: ${imp.name}`);
        }
    }

    if (filePath.includes('/Domain/') && (hasUIKit || hasSwiftUI)) {
        analyzer.pushFinding(
            'ios.architecture.domain_ui_import',
            'critical',
            filePath,
            1,
            'Domain layer imports UI framework - violates Clean Architecture'
        );
    }
}

async function analyzeClassAST(analyzer, node, filePath) {
    const name = node['key.name'] || '';
    const line = node['key.line'] || 1;
    const bodyLength = countLinesInBody(analyzer, node) || 0;
    const substructure = node['key.substructure'] || [];
    const inheritedTypes = (node['key.inheritedtypes'] || []).map((t) => t['key.name']);
    const attributes = analyzer.getAttributes(node);

    const methods = substructure.filter((n) => (n['key.kind'] || '').includes('function'));
    const properties = substructure.filter((n) => (n['key.kind'] || '').includes('var'));
    const inits = methods.filter((m) => (m['key.name'] || '').startsWith('init'));
    const significantMethods = methods.filter((m) => {
        const methodName = String(m['key.name'] || '');
        if (methodName.length === 0) return false;
        if (methodName === 'deinit') return false;
        if (methodName.startsWith('init')) return false;
        return true;
    });

    if (name && !/Spec$|Test$|Mock/.test(name) && !name.includes('Coordinator')) {
        const complexity = calculateComplexityAST(substructure);
        const isThinWrapper = isThinWrapperSummary({
            methodsCount: significantMethods.length,
            propertiesCount: properties.length,
        });
        if (!isThinWrapper) {
            analyzer.godClassCandidates.push({
                name,
                filePath,
                line,
                methodsCount: methods.length,
                significantMethodsCount: significantMethods.length,
                propertiesCount: properties.length,
                bodyLength,
                complexity,
            });
        }
    }

    if (name.includes('ViewController')) {
        if (bodyLength > 250 || methods.length > 8) {
            analyzer.pushFinding(
                'ios.architecture.massive_viewcontroller',
                'high',
                filePath,
                line,
                `Massive ViewController '${name}': ${bodyLength} lines - extract to ViewModel`
            );
        }

        const hasBusinessLogic = methods.some((m) => {
            const methodName = m['key.name'] || '';
            return /calculate|process|validate|fetch|save|delete|update/i.test(methodName);
        });

        if (hasBusinessLogic) {
            analyzer.pushFinding(
                'ios.architecture.vc_business_logic',
                'high',
                filePath,
                line,
                `ViewController '${name}' contains business logic - move to UseCase`
            );
        }
    }

    if (name.includes('ViewModel')) {
        const hasMainActor = attributes.includes('MainActor');
        if (!hasMainActor) {
            analyzer.pushFinding(
                'ios.concurrency.viewmodel_mainactor',
                'high',
                filePath,
                line,
                `ViewModel '${name}' should be @MainActor for UI safety`
            );
        }

        const hasObservable = inheritedTypes.includes('ObservableObject') || attributes.includes('Observable');
        if (!hasObservable) {
            analyzer.pushFinding(
                'ios.swiftui.viewmodel_observable',
                'medium',
                filePath,
                line,
                `ViewModel '${name}' should conform to ObservableObject`
            );
        }

        if (inits.length === 0 && properties.length > 0) {
            analyzer.pushFinding(
                'ios.architecture.viewmodel_no_di',
                'high',
                filePath,
                line,
                `ViewModel '${name}' has no init - use dependency injection`
            );
        }
    }

    if (/Manager$|Helper$|Utils$|Handler$/.test(name)) {
        analyzer.pushFinding('ios.naming.god_naming', 'medium', filePath, line, `Suspicious class name '${name}' - often indicates SRP violation`);
    }

    // Skip ISP validation for test files - spies/mocks are allowed to have unused properties
    const isTestFile = /Tests?\/|Spec|Mock|Spy|Stub|Fake|Dummy/.test(filePath);
    if (!isTestFile) {
        const unusedProps = findUnusedPropertiesAST(analyzer, properties, methods);
        for (const prop of unusedProps) {
            analyzer.pushFinding(
                'ios.solid.isp.unused_dependency',
                'high',
                filePath,
                line,
                `Unused property '${prop}' in '${name}' - ISP violation`
            );
        }
    }

    await checkDependencyInjectionAST(analyzer, properties, filePath, name, line);

    const hasDeinit = methods.some((m) => m['key.name'] === 'deinit');
    const hasObservers = analyzer.closures.some((c) => c._parent === node) || properties.some((p) => analyzer.hasAttribute(p, 'Published'));

    if (!hasDeinit && hasObservers && !name.includes('ViewModel')) {
        analyzer.pushFinding(
            'ios.memory.missing_deinit',
            'high',
            filePath,
            line,
            `Class '${name}' has observers but no deinit - potential memory leak`
        );
    }

    const isFinal = attributes.includes('final');
    if (!isFinal && inheritedTypes.length === 0 && name !== 'AppDelegate') {
        analyzer.pushFinding('ios.performance.non_final_class', 'low', filePath, line, `Class '${name}' is not final - consider final for performance`);
    }

    const hasSingleton = properties.some((p) => {
        const propName = p['key.name'] || '';
        const isStatic = (p['key.kind'] || '').includes('static');
        return isStatic && propName === 'shared';
    });

    if (hasSingleton) {
        analyzer.pushFinding('ios.antipattern.singleton', 'high', filePath, line, `Singleton pattern in '${name}' - use dependency injection`);
    }

    if (filePath.includes('Test') && name.includes('Test')) {
        const hasMakeSUT = methods.some((m) => (m['key.name'] || '').includes('makeSUT'));
        if (!hasMakeSUT && methods.length > 2) {
            analyzer.pushFinding('ios.testing.missing_makesut', 'medium', filePath, line, `Test class '${name}' missing makeSUT() factory`);
        }
    }

    if (name.includes('Repository') && !name.includes('Protocol')) {
        const hasProtocol = inheritedTypes.some((t) => t.includes('Protocol'));
        if (!hasProtocol && !filePath.includes('/Domain/')) {
            analyzer.pushFinding('ios.architecture.repository_no_protocol', 'high', filePath, line, `Repository '${name}' should implement a protocol`);
        }
    }

    if (name.includes('UseCase')) {
        const hasExecute = methods.some((m) => (m['key.name'] || '').includes('execute'));
        if (!hasExecute) {
            analyzer.pushFinding('ios.architecture.usecase_no_execute', 'medium', filePath, line, `UseCase '${name}' missing execute() method`);
        }
    }
}

function analyzeStructAST(analyzer, node, filePath) {
    const name = node['key.name'] || '';
    const line = node['key.line'] || 1;
    const substructure = node['key.substructure'] || [];
    const inheritedTypes = (node['key.inheritedtypes'] || []).map((t) => t['key.name']);

    const methods = substructure.filter((n) => (n['key.kind'] || '').includes('function'));
    const properties = substructure.filter((n) => (n['key.kind'] || '').includes('var'));

    if (inheritedTypes.includes('View')) {
        analyzeSwiftUIViewAST(analyzer, node, filePath, name, line, methods, properties);
    }

    if (inheritedTypes.includes('Codable') || inheritedTypes.includes('Decodable')) {
        const hasOptionalProps = properties.some((p) => (p['key.typename'] || '').includes('?'));
        const hasCodingKeys = substructure.some((n) => n['key.name'] === 'CodingKeys');

        if (hasOptionalProps && !hasCodingKeys) {
            analyzer.pushFinding('ios.codable.missing_coding_keys', 'low', filePath, line, `Struct '${name}' has optional properties - consider CodingKeys`);
        }
    }

    if ((inheritedTypes.includes('Equatable') || inheritedTypes.includes('Hashable')) && properties.length > 5) {
        analyzer.pushFinding('ios.performance.large_equatable', 'low', filePath, line, `Struct '${name}' has ${properties.length} properties with Equatable`);
    }
}

function analyzeSwiftUIViewAST(analyzer, _node, filePath, name, line, methods, properties) {
    const bodyMethod = methods.find((m) => m['key.name'] === 'body');
    if (bodyMethod) {
        const bodyLength = countLinesInBody(analyzer, bodyMethod) || 0;
        if (bodyLength > 100) {
            analyzer.pushFinding('ios.swiftui.complex_body', 'high', filePath, line, `View '${name}' has complex body (${bodyLength} lines) - extract subviews`);
        }
    }

    const stateProps = properties.filter((p) => analyzer.hasAttribute(p, 'State') || analyzer.hasAttribute(p, 'Binding'));

    if (stateProps.length > 5) {
        analyzer.pushFinding('ios.swiftui.too_many_state', 'medium', filePath, line, `View '${name}' has ${stateProps.length} @State/@Binding - consider ViewModel`);
    }

    const hasObservedObject = properties.some((p) => analyzer.hasAttribute(p, 'ObservedObject'));
    const hasStateObject = properties.some((p) => analyzer.hasAttribute(p, 'StateObject'));

    if (hasObservedObject && !hasStateObject) {
        analyzer.pushFinding('ios.swiftui.observed_without_state', 'medium', filePath, line, `View '${name}' uses @ObservedObject - consider @StateObject for ownership`);
    }
}

function analyzeProtocolAST(analyzer, node, filePath) {
    const name = node['key.name'] || '';
    const line = node['key.line'] || 1;
    const substructure = node['key.substructure'] || [];

    const requirements = substructure.filter((n) => (n['key.kind'] || '').includes('function') || (n['key.kind'] || '').includes('var'));

    if (requirements.length > 5) {
        analyzer.pushFinding('ios.solid.isp.fat_protocol', 'medium', filePath, line, `Protocol '${name}' has ${requirements.length} requirements - consider splitting (ISP)`);
    }
}

function countLinesInBody(analyzer, node) {
    const offset = Number(node['key.bodyoffset']);
    const length = Number(node['key.bodylength']);
    if (!Number.isFinite(offset) || !Number.isFinite(length) || offset < 0 || length <= 0) {
        return 0;
    }

    try {
        const buf = Buffer.from(analyzer.fileContent || '', 'utf8');
        const slice = buf.subarray(offset, Math.min(buf.length, offset + length));
        const text = slice.toString('utf8');
        if (!text) return 0;
        return text.split('\n').length;
    } catch (error) {
        if (process.env.DEBUG) {
            console.debug(`[iOSASTIntelligentAnalyzer] Failed to count lines in body: ${error.message}`);
        }
        return 0;
    }
}

function analyzeFunctionAST(analyzer, node, filePath) {
    const name = node['key.name'] || '';
    const line = node['key.line'] || 1;
    const bodyLength = countLinesInBody(analyzer, node) || 0;
    const attributes = analyzer.getAttributes(node);
    const substructure = node['key.substructure'] || [];

    if (bodyLength > 50) {
        analyzer.pushFinding('ios.quality.long_function', 'high', filePath, line, `Function '${name}' is too long (${bodyLength} lines)`);
    }

    const complexity = calculateComplexityAST(substructure);
    if (complexity > 10) {
        analyzer.pushFinding('ios.quality.high_complexity', 'high', filePath, line, `Function '${name}' has high complexity (${complexity})`);
    }

    const params = substructure.filter((n) => (n['key.kind'] || '').includes('var.parameter'));
    if (params.length > 5) {
        analyzer.pushFinding('ios.quality.too_many_params', 'medium', filePath, line, `Function '${name}' has ${params.length} parameters - use struct`);
    }

    const closuresInFunc = countClosuresInNode(node);
    if (closuresInFunc > 3) {
        analyzer.pushFinding('ios.quality.nested_closures', 'medium', filePath, line, `Function '${name}' has ${closuresInFunc} nested closures - use async/await`);
    }

    const ifStatements = countStatementsOfType(substructure, 'stmt.if');
    const guardStatements = countStatementsOfType(substructure, 'stmt.guard');

    if (ifStatements > 3 && guardStatements === 0) {
        analyzer.pushFinding('ios.quality.pyramid_of_doom', 'medium', filePath, line, `Function '${name}' has ${ifStatements} nested ifs - use guard clauses`);
    }

    const isAsync = attributes.includes('async');
    const parentClass = node._parent;
    const parentIsView = parentClass && (parentClass['key.inheritedtypes'] || []).some((t) => t['key.name'] === 'View');

    if (isAsync && parentIsView && !attributes.includes('MainActor')) {
        analyzer.pushFinding('ios.concurrency.async_ui_update', 'high', filePath, line, `Async function '${name}' in View - consider @MainActor`);
    }
}

function analyzePropertyAST(analyzer, node, filePath) {
    const name = node['key.name'] || '';
    const line = node['key.line'] || 1;
    const typename = node['key.typename'] || '';
    const attributes = analyzer.getAttributes(node);
    const kind = node['key.kind'] || '';

    if (typename.includes('!') && !attributes.includes('IBOutlet')) {
        analyzer.pushFinding('ios.safety.force_unwrap_property', 'high', filePath, line, `Force unwrapped property '${name}: ${typename}'`);
    }

    const isPublic = (node['key.accessibility'] || '').includes('public');
    const isInstance = kind.includes('var.instance');

    const sub = Array.isArray(node['key.substructure']) ? node['key.substructure'] : [];
    const hasAccessorGet = sub.some(s => (s['key.kind'] || '').includes('accessor.get'));
    const hasAccessorSet = sub.some(s => (s['key.kind'] || '').includes('accessor.set'));
    const isComputed = hasAccessorGet || hasAccessorSet;
    const isMutable = isComputed ? hasAccessorSet : true;

    const hasSetterAccessRestriction = attributes.some(a => String(a).startsWith('setter_access'));
    if (isPublic && isInstance && isMutable && !hasSetterAccessRestriction) {
        analyzer.pushFinding('ios.encapsulation.public_mutable', 'medium', filePath, line, `Public mutable property '${name}' - consider private(set)`);
    }
}

function analyzeClosuresAST(analyzer, filePath) {
    for (const closure of analyzer.closures) {
        const closureText = analyzer.safeStringify(closure);
        const hasSelfReference = closureText.includes('"self"') || closureText.includes('key.name":"self');

        const parentFunc = closure._parent;
        const isEscaping = parentFunc && (parentFunc['key.typename'] || '').includes('@escaping');

        if (hasSelfReference && isEscaping) {
            const hasWeakCapture = closureText.includes('weak') || closureText.includes('unowned');

            if (!hasWeakCapture) {
                const line = closure['key.line'] || 1;
                analyzer.pushFinding('ios.memory.missing_weak_self', 'high', filePath, line, 'Escaping closure captures self without [weak self]');
            }
        }
    }
}

function analyzeCleanArchitectureAST(analyzer, filePath) {
    const fileName = path.basename(filePath);

    if (fileName.includes('UseCase')) {
        const hasVoidReturn = analyzer.functions.some((f) => {
            const typename = f['key.typename'] || '';
            return (f['key.name'] || '').includes('execute') && typename.includes('Void');
        });

        if (hasVoidReturn) {
            analyzer.pushFinding('ios.architecture.usecase_void', 'medium', filePath, 1, 'UseCase returns Void - consider returning Result');
        }

        if (!filePath.includes('/Domain/') && !filePath.includes('/Application/')) {
            analyzer.pushFinding('ios.architecture.usecase_wrong_layer', 'high', filePath, 1, 'UseCase should be in Domain or Application layer');
        }
    }

    if (filePath.includes('/Infrastructure/')) {
        const hasUIImport = analyzer.imports.some((i) => ['SwiftUI', 'UIKit'].includes(i.name));
        if (hasUIImport) {
            analyzer.pushFinding('ios.architecture.infrastructure_ui', 'critical', filePath, 1, 'Infrastructure layer imports UI framework - violates Clean Architecture');
        }
    }

    if (filePath.includes('/Presentation/') || filePath.includes('/Views/')) {
        const hasInfraImport = analyzer.imports.some((i) => i.name.includes('Alamofire') || i.name.includes('Realm') || i.name.includes('CoreData'));
        if (hasInfraImport) {
            analyzer.pushFinding('ios.architecture.presentation_infra', 'high', filePath, 1, 'Presentation imports Infrastructure directly - use Domain layer');
        }
    }
}

function analyzeAdditionalRules(analyzer, filePath) {
    const hasSwiftUIViewType = (analyzer.imports || []).some((i) => i && i.name === 'SwiftUI') &&
        (analyzer.structs || []).some((s) => (s['key.inheritedtypes'] || []).some((t) => t && t['key.name'] === 'View'));

    if ((analyzer.fileContent || '').includes('pushViewController') || (analyzer.fileContent || '').includes('popViewController') || (analyzer.fileContent || '').includes('present(')) {
        const line = analyzer.findLineNumber('pushViewController') || analyzer.findLineNumber('popViewController') || analyzer.findLineNumber('present(');
        analyzer.pushFinding('ios.navigation.imperative_navigation', 'critical', filePath, line, 'Imperative navigation detected - use event-driven navigation/coordinator');
    }

    const swiftuiNavTokens = ['NavigationLink', 'NavigationStack', 'NavigationSplitView', '.navigationDestination'];
    const hasSwiftUINavigation = swiftuiNavTokens.some((token) => (analyzer.fileContent || '').includes(token));
    if (hasSwiftUINavigation && !hasSwiftUIViewType) {
        const line = analyzer.findLineNumber('NavigationLink') || analyzer.findLineNumber('NavigationStack') || analyzer.findLineNumber('.navigationDestination');
        analyzer.pushFinding('ios.navigation.swiftui_navigation_outside_view', 'critical', filePath, line, 'SwiftUI navigation API detected outside View types');
    }

    if (filePath.includes('ViewModel') && (analyzer.fileContent || '').includes('NavigationLink')) {
        const hasCoordinator = analyzer.imports.some((i) => i.name.includes('Coordinator'));
        if (!hasCoordinator) {
            analyzer.pushFinding('ios.architecture.missing_coordinator', 'medium', filePath, 1, 'Navigation in ViewModel - consider Coordinator pattern');
        }
    }

    if ((analyzer.fileContent || '').includes('DispatchQueue.main') || (analyzer.fileContent || '').includes('DispatchQueue.global')) {
        const line = analyzer.findLineNumber('DispatchQueue');
        analyzer.pushFinding('ios.concurrency.dispatch_queue', 'medium', filePath, line, 'DispatchQueue detected - use async/await in new code');
    }

    if (/Task\s*\{/.test(analyzer.fileContent || '') && !/Task\s*\{[^}]*do\s*\{/.test(analyzer.fileContent || '')) {
        const line = analyzer.findLineNumber('Task {');
        analyzer.pushFinding('ios.concurrency.task_no_error_handling', 'high', filePath, line, 'Task without do-catch - handle errors');
    }

    if ((analyzer.fileContent || '').includes('UserDefaults') && /password|token|secret|key/i.test(analyzer.fileContent || '')) {
        const line = analyzer.findLineNumber('UserDefaults');
        analyzer.pushFinding('ios.security.sensitive_userdefaults', 'critical', filePath, line, 'Sensitive data in UserDefaults - use Keychain');
    }

    const hardcodedStrings = (analyzer.fileContent || '').match(/Text\s*\(\s*"[^"]{10,}"\s*\)/g) || [];
    if (hardcodedStrings.length > 3) {
        analyzer.pushFinding('ios.i18n.hardcoded_strings', 'medium', filePath, 1, `${hardcodedStrings.length} hardcoded strings - use NSLocalizedString`);
    }

    if ((analyzer.fileContent || '').includes('Image(') && !(analyzer.fileContent || '').includes('.accessibilityLabel')) {
        const imageCount = ((analyzer.fileContent || '').match(/Image\s*\(/g) || []).length;
        const labelCount = ((analyzer.fileContent || '').match(/\.accessibilityLabel/g) || []).length;
        if (imageCount > labelCount + 2) {
            analyzer.pushFinding('ios.accessibility.missing_labels', 'medium', filePath, 1, 'Images without accessibilityLabel - add for VoiceOver');
        }
    }

    if ((analyzer.fileContent || '').includes('@IBOutlet') || (analyzer.fileContent || '').includes('@IBAction')) {
        const line = analyzer.findLineNumber('@IB');
        analyzer.pushFinding('ios.deprecated.storyboard', 'low', filePath, line, 'Storyboard/XIB detected - consider SwiftUI or programmatic UI');
    }

    const completionCount = ((analyzer.fileContent || '').match(/completion\s*:\s*@escaping/g) || []).length;
    if (completionCount > 2) {
        analyzer.pushFinding('ios.concurrency.completion_handlers', 'medium', filePath, 1, `${completionCount} completion handlers - use async/await`);
    }

    for (const cls of analyzer.classes) {
        const fileContent = analyzer.fileContent || '';
        const hasSharedState = /\bstatic\s+var\b/.test(fileContent);
        const hasActorIsolation = fileContent.includes('actor ') || fileContent.includes('@MainActor');
        if (hasSharedState && !hasActorIsolation) {
            const name = cls['key.name'] || '';
            const line = cls['key.line'] || 1;
            analyzer.pushFinding('ios.concurrency.missing_actor', 'high', filePath, line, `Class '${name}' has shared state - consider actor for thread safety`);
        }
    }

    for (const cls of analyzer.classes) {
        const name = cls['key.name'] || '';
        const inheritedTypes = (cls['key.inheritedtypes'] || []).map((t) => t['key.name']);
        const hasAsync = analyzer.functions.some((f) => analyzer.hasAttribute(f, 'async'));

        if (hasAsync && !inheritedTypes.includes('Sendable') && !name.includes('ViewModel')) {
            const line = cls['key.line'] || 1;
            analyzer.pushFinding('ios.concurrency.missing_sendable', 'medium', filePath, line, `Class '${name}' used in async context - consider Sendable conformance`);
        }
    }
}

function findUnusedPropertiesAST(analyzer, properties, methods) {
    const unused = [];

    for (const prop of properties) {
        const propName = prop['key.name'];
        if (!propName) continue;

        if (analyzer.hasAttribute(prop, 'Published') || analyzer.hasAttribute(prop, 'State') || analyzer.hasAttribute(prop, 'Binding')) {
            continue;
        }

        const typeName = String(prop['key.typename'] || '');
        const isReactiveType =
            typeName.includes('Publisher') ||
            typeName.includes('AnyPublisher') ||
            typeName.includes('Subject') ||
            typeName.includes('PassthroughSubject') ||
            typeName.includes('CurrentValueSubject') ||
            typeName.includes('Published<');

        if (isReactiveType) {
            continue;
        }

        const escapedPropName = String(propName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const usagePattern = new RegExp(`(^|[^A-Za-z0-9_])\\$?${escapedPropName}([^A-Za-z0-9_]|$)`);

        let isUsed = false;

        const fileContent = analyzer.fileContent || '';
        const fileMatches = fileContent.match(new RegExp(`\\b${escapedPropName}\\b`, 'g')) || [];
        if (fileMatches.length > 1) {
            isUsed = true;
        }
        for (const method of methods) {
            const methodText = analyzer.safeStringify(method);
            if (usagePattern.test(methodText)) {
                isUsed = true;
                break;
            }
        }

        if (!isUsed) {
            unused.push(propName);
        }
    }

    return unused;
}

function calculateComplexityAST(substructure) {
    let complexity = 1;

    const traverse = (nodes) => {
        if (!Array.isArray(nodes)) return;

        for (const node of nodes) {
            const kind = node['key.kind'] || '';

            if (kind.includes('stmt.if') || kind.includes('stmt.guard') || kind.includes('stmt.switch') || kind.includes('stmt.for') || kind.includes('stmt.while') || kind.includes('stmt.catch')) {
                complexity++;
            }

            traverse(node['key.substructure'] || []);
        }
    };

    traverse(substructure);
    return complexity;
}

function countClosuresInNode(node) {
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

function countStatementsOfType(substructure, stmtType) {
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

async function checkDependencyInjectionAST(analyzer, properties, filePath, className, line) {
    await diValidationService.validateDependencyInjection(analyzer, properties, filePath, className, line);
}

function finalizeGodClassDetection(analyzer) {
    if (!analyzer.godClassCandidates || analyzer.godClassCandidates.length < 10) return;

    const quantile = (values, p) => {
        if (!values || values.length === 0) return 0;
        const sorted = [...values].filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
        if (sorted.length === 0) return 0;
        const idx = Math.max(0, Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1));
        return sorted[idx];
    };

    const median = (values) => {
        if (!values || values.length === 0) return 0;
        const sorted = [...values].filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
        if (sorted.length === 0) return 0;
        const mid = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
        return sorted[mid];
    };

    const mad = (values) => {
        const med = median(values);
        const deviations = (values || []).map((v) => Math.abs(v - med));
        return median(deviations);
    };

    const robustZ = (x, med, madValue) => {
        if (!Number.isFinite(x) || !Number.isFinite(med) || !Number.isFinite(madValue) || madValue === 0) return 0;
        return 0.6745 * (x - med) / madValue;
    };

    const env = require(path.join(__dirname, '../../../../config/env'));
    const pOutlier = env.getNumber('AST_GODCLASS_P_OUTLIER', 90);
    const pExtreme = env.getNumber('AST_GODCLASS_P_EXTREME', 97);

    const methods = analyzer.godClassCandidates.map((c) => c.methodsCount);
    const props = analyzer.godClassCandidates.map((c) => c.propertiesCount);
    const bodies = analyzer.godClassCandidates.map((c) => c.bodyLength);
    const complexities = analyzer.godClassCandidates.map((c) => c.complexity);

    const med = {
        methodsCount: median(methods),
        propertiesCount: median(props),
        bodyLength: median(bodies),
        complexity: median(complexities),
    };
    const madValue = {
        methodsCount: mad(methods),
        propertiesCount: mad(props),
        bodyLength: mad(bodies),
        complexity: mad(complexities),
    };

    const z = {
        methodsCount: methods.map((v) => robustZ(v, med.methodsCount, madValue.methodsCount)),
        propertiesCount: props.map((v) => robustZ(v, med.propertiesCount, madValue.propertiesCount)),
        bodyLength: bodies.map((v) => robustZ(v, med.bodyLength, madValue.bodyLength)),
        complexity: complexities.map((v) => robustZ(v, med.complexity, madValue.complexity)),
    };

    const thresholds = {
        outlier: {
            methodsCountZ: quantile(z.methodsCount, pOutlier),
            propertiesCountZ: quantile(z.propertiesCount, pOutlier),
            bodyLengthZ: quantile(z.bodyLength, pOutlier),
            complexityZ: quantile(z.complexity, pOutlier),
        },
        extreme: {
            methodsCountZ: quantile(z.methodsCount, pExtreme),
            propertiesCountZ: quantile(z.propertiesCount, pExtreme),
            bodyLengthZ: quantile(z.bodyLength, pExtreme),
            complexityZ: quantile(z.complexity, pExtreme),
        },
    };

    for (const c of analyzer.godClassCandidates) {
        const significantMethods = Number.isFinite(Number(c.significantMethodsCount))
            ? Number(c.significantMethodsCount)
            : Math.max(0, Number(c.methodsCount) - 1);
        const hasNoProperties = Number(c.propertiesCount) === 0;
        if (hasNoProperties || significantMethods < 2) {
            continue;
        }

        const methodsZ = robustZ(c.methodsCount, med.methodsCount, madValue.methodsCount);
        const propsZ = robustZ(c.propertiesCount, med.propertiesCount, madValue.propertiesCount);
        const bodyZ = robustZ(c.bodyLength, med.bodyLength, madValue.bodyLength);
        const complexityZ = robustZ(c.complexity, med.complexity, madValue.complexity);

        const sizeOutlier =
            (methodsZ > 0 && methodsZ >= thresholds.outlier.methodsCountZ) ||
            (propsZ > 0 && propsZ >= thresholds.outlier.propertiesCountZ) ||
            (bodyZ > 0 && bodyZ >= thresholds.outlier.bodyLengthZ);
        const complexityOutlier = complexityZ > 0 && complexityZ >= thresholds.outlier.complexityZ;

        const extremeOutlier =
            (methodsZ > 0 && methodsZ >= thresholds.extreme.methodsCountZ) ||
            (propsZ > 0 && propsZ >= thresholds.extreme.propertiesCountZ) ||
            (bodyZ > 0 && bodyZ >= thresholds.extreme.bodyLengthZ) ||
            (complexityZ > 0 && complexityZ >= thresholds.extreme.complexityZ);

        const signalCount = [sizeOutlier, complexityOutlier].filter(Boolean).length;

        if (extremeOutlier || signalCount >= 2) {
            const severity = resolveSrpSeverity(c.filePath, {
                coreSeverity: 'critical',
                defaultSeverity: 'high',
                testSeverity: 'low',
            });
            analyzer.pushFinding(
                'ios.solid.srp.god_class',
                severity,
                c.filePath,
                c.line,
                `God class '${c.name}': ${c.methodsCount} methods (z=${methodsZ.toFixed(2)}), ${c.propertiesCount} properties (z=${propsZ.toFixed(2)}), body ${c.bodyLength} (z=${bodyZ.toFixed(2)}), complexity ${c.complexity} (z=${complexityZ.toFixed(2)}) - VIOLATES SRP`
            );
        }
    }
}

module.exports = {
    resetCollections,
    collectAllNodes,
    analyzeCollectedNodes,
    analyzeImportsAST,
    analyzePropertyAST,
    finalizeGodClassDetection,
};
