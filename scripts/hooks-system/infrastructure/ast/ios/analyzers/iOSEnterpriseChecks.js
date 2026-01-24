function analyzeSwiftModerno({ content, functions = [], filePath, addFinding }) {
    if (content.includes('completion:') && !content.includes('async ')) {
        addFinding('ios.async_await_missing', 'medium', filePath, 1,
            'Using completion handlers instead of async/await (Swift 5.9+ required)');
    }

    const taskCount = (content.match(/\bTask\s*\{/g) || []).length;
    if (taskCount > 3 && !content.includes('TaskGroup')) {
        addFinding('ios.structured_concurrency_missing', 'medium', filePath, 1,
            `Multiple Task blocks (${taskCount}) without TaskGroup - use structured concurrency`);
    }

    if (content.includes('actor ') && !content.includes(': Sendable')) {
        addFinding('ios.sendable_missing', 'low', filePath, 1,
            'Actor should conform to Sendable protocol for thread-safe types');
    }

    if (content.includes('func ') && content.includes('-> View') && !content.includes('some View')) {
        addFinding('ios.opaque_types_missing', 'low', filePath, 1,
            'Use "some View" instead of explicit View protocol return');
    }

    if (content.includes('UIViewController') && !content.includes('@State') && !content.includes('@Binding') && !content.includes('@ObservedObject')) {
        addFinding('ios.property_wrappers_missing', 'info', filePath, 1,
            'Consider using SwiftUI property wrappers (@State, @Binding, @ObservedObject) for state management');
    }

    const extractedFunctions = parser.extractFunctions ? parser.extractFunctions({ parsed: true }) || [] : [];
    extractedFunctions.forEach(fn => {
        if (fn.name.includes('Array') || fn.name.includes('Collection')) {
            if (!content.includes('<T>') && !content.includes('<Element>')) {
                addFinding('ios.generics_missing', 'low', filePath, fn.line,
                    `Function ${fn.name} should use generics for type safety`);
            }
        }
    });
}

async function analyzeSwiftUI({ usesSwiftUI, usesUIKit, content, classes, filePath, addFinding }) {
    if (usesUIKit && !usesSwiftUI) {
        addFinding('ios.swiftui_first', 'medium', filePath, 1,
            'Consider migrating to SwiftUI for new views (UIKit only when strictly necessary)');
    }

    if (usesSwiftUI) {
        if (!content.includes('@State')) {
            addFinding('ios.state_local_missing', 'info', filePath, 1,
                'SwiftUI view without @State - consider if local state is needed');
        }

        if (content.includes('ObservableObject') && !content.includes('@StateObject')) {
            addFinding('ios.stateobject_missing', 'high', filePath, 1,
                'ObservableObject should be owned with @StateObject, not @ObservedObject');
        }

        if (content.includes('class') && content.includes('ObservableObject') && !content.includes('@EnvironmentObject')) {
            addFinding('ios.environmentobject_missing', 'info', filePath, 1,
                'Consider using @EnvironmentObject for dependency injection in SwiftUI');
        }

        if (content.includes('.frame(') && content.includes('CGRect(')) {
            addFinding('ios.declarativo_missing', 'medium', filePath, 1,
                'Using imperative CGRect in SwiftUI - use declarative .frame() modifiers');
        }

        const geometryReaderCount = (content.match(/GeometryReader/g) || []).length;
        if (geometryReaderCount > 2) {
            addFinding('ios.geometryreader_moderation', 'medium', filePath, 1,
                `Excessive GeometryReader usage (${geometryReaderCount}x) - use only when necessary`);
        }
    }
}

async function analyzeUIKit({ classes, content, filePath, addFinding }) {
    classes.forEach(cls => {
        if (cls.name.includes('ViewController')) {
            const linesCount = cls.substructure.length * 10;
            if (linesCount > 300) {
                addFinding('ios.massive_viewcontrollers', 'high', filePath, cls.line,
                    `Massive ViewController ${cls.name} (~${linesCount} lines) - break down into smaller components`);
            }

            if (!content.includes('ViewModel')) {
                addFinding('ios.uikit.viewmodel_delegation', 'medium', filePath, cls.line,
                    `ViewController ${cls.name} should delegate logic to ViewModel (MVVM pattern)`);
            }
        }
    });

    if (filePath.endsWith('.swift') && !filePath.includes('analyzer') && !filePath.includes('detector')) {
        if (content.includes('storyboard') || content.includes('.xib') || content.includes('.nib')) {
            addFinding('ios.storyboards', 'high', filePath, 1,
                'Storyboard/XIB detected - use programmatic UI for better version control');
        }
    }
}

async function analyzeProtocolOriented({ protocols, content, filePath, addFinding }) {
    if (protocols.length > 0 && !content.includes('extension ')) {
        addFinding('ios.pop.missing_extensions', 'low', filePath, 1,
            'Protocols detected but no extensions - consider protocol extensions for default implementations');
    }

    if (content.includes('class ') && content.includes(': ')) {
        const inheritanceCount = (content.match(/class\s+\w+\s*:\s*\w+/g) || []).length;
        if (inheritanceCount > 2) {
            addFinding('ios.pop.missing_composition_over_inheritance', 'medium', filePath, 1,
                `Excessive class inheritance (${inheritanceCount}x) - prefer protocol composition`);
        }
    }
}

async function analyzeValueTypes({ classes, content, filePath, addFinding }) {
    classes.forEach(cls => {
        if (!cls.inheritedTypes.length && !content.includes('ObservableObject')) {
            addFinding('ios.values.classes_instead_structs', 'medium', filePath, cls.line,
                `Class ${cls.name} without inheritance - consider struct for value semantics`);
        }
    });

    const varCount = (content.match(/\bvar\s+/g) || []).length;
    const letCount = (content.match(/\blet\s+/g) || []).length;
    if (varCount > letCount) {
        addFinding('ios.values.mutability', 'low', filePath, 1,
            `More var (${varCount}) than let (${letCount}) - prefer immutability`);
    }
}

function analyzeMemoryManagement({ content, filePath, addFinding }) {
    const closureMatches = content.match(/\{\s*\[/g);
    const weakSelfMatches = content.match(/\[weak self\]/g);
    if (closureMatches && closureMatches.length > (weakSelfMatches?.length || 0)) {
        addFinding('ios.memory.missing_weak_self', 'high', filePath, 1,
            'Closures without [weak self] - potential retain cycles');
    }

    if (content.includes('self.') && content.includes('{') && !content.includes('[weak self]')) {
        addFinding('ios.memory.retain_cycles', 'high', filePath, 1,
            'Potential retain cycle - closure captures self without [weak self]');
    }

    if (content.includes('class ') && !content.includes('deinit')) {
        addFinding('ios.memory.missing_deinit', 'low', filePath, 1,
            'Class without deinit - consider adding for cleanup verification');
    }
}

function analyzeOptionals({ content, filePath, addFinding }) {
    const forceUnwraps = content.match(/(\w+)\s*!/g);
    if (forceUnwraps && forceUnwraps.length > 0) {
        const nonIBOutlets = forceUnwraps.filter(match => !content.includes(`@IBOutlet`));
        if (nonIBOutlets.length > 0) {
            addFinding('ios.force_unwrapping', 'high', filePath, 1,
                `Force unwrapping (!) detected ${nonIBOutlets.length}x - use if let or guard let`);
        }
    }

    const ifLetCount = (content.match(/if\s+let\s+/g) || []).length;
    const guardLetCount = (content.match(/guard\s+let\s+/g) || []).length;
    if (ifLetCount === 0 && guardLetCount === 0 && content.includes('?')) {
        addFinding('ios.optionals.optional_binding', 'medium', filePath, 1,
            'Optionals present but no optional binding - use if let or guard let');
    }

    if (content.includes('?') && !content.includes('??')) {
        addFinding('ios.optionals.missing_nil_coalescing', 'info', filePath, 1,
            'Consider using nil coalescing operator (??) for default values');
    }
}

async function analyzeDependencyInjection({ classes, content, filePath, addFinding }) {
    if (content.includes('.shared') || content.includes('static let shared')) {
        addFinding('ios.di.singleton_usage', 'high', filePath, 1,
            'Singleton detected - use dependency injection instead');
    }

    classes.forEach(cls => {
        if (cls.name.includes('ViewModel') || cls.name.includes('Service')) {
            const hasInit = content.includes('init(');
            if (!hasInit) {
                addFinding('ios.di.missing_protocol_injection', 'medium', filePath, cls.line,
                    `${cls.name} should inject dependencies via initializer`);
            }
        }
    });

    if (content.includes('init(') && content.match(/init\([^)]{50,}\)/)) {
        addFinding('ios.di.missing_factory', 'low', filePath, 1,
            'Complex initialization - consider factory pattern');
    }
}

async function analyzeNetworking({ content, filePath, addFinding }) {
    if (String(filePath || '').endsWith('/Package.swift') || String(filePath || '').endsWith('Package.swift')) {
        return;
    }
    if (!content.includes('URLSession') && !content.includes('Alamofire')) {
        if (content.includes('http://') || content.includes('https://')) {
            addFinding('ios.networking.missing_urlsession', 'high', filePath, 1,
                'Network URLs detected but no URLSession/Alamofire usage');
        }
    }

    if (content.includes('URLSession') && content.includes('completionHandler:') && !content.includes('async')) {
        addFinding('ios.networking.completion_handlers_instead_async', 'medium', filePath, 1,
            'Using completion handlers with URLSession - migrate to async/await');
    }

    if (content.includes('JSONSerialization') && !content.includes('Codable')) {
        addFinding('ios.networking.missing_codable', 'medium', filePath, 1,
            'Manual JSON parsing - use Codable for type safety');
    }

    if (content.includes('URLSession') && !content.includes('NetworkError')) {
        addFinding('ios.networking.missing_error_handling', 'high', filePath, 1,
            'Network code without custom NetworkError enum');
    }

    const hasSSLPinningImplementation =
        content.includes('serverTrustPolicy') ||
        content.includes('pinning') ||
        (content.includes('URLSessionDelegate') && content.includes('URLAuthenticationChallenge'));

    if (content.includes('URLSession') && !hasSSLPinningImplementation) {
        addFinding('ios.networking.missing_ssl_pinning', 'medium', filePath, 1,
            'Consider SSL pinning for high-security apps');
    }

    if (content.includes('URLSession') && !content.includes('retry')) {
        addFinding('ios.networking.missing_retry', 'low', filePath, 1,
            'Network requests without retry logic');
    }
}

async function analyzePersistence({ content, filePath, addFinding }) {
    if (content.includes('UserDefaults') && (content.includes('password') || content.includes('token') || content.includes('auth'))) {
        addFinding('ios.persistence.userdefaults_sensitive', 'critical', filePath, 1,
            'Sensitive data in UserDefaults - use Keychain instead');
    }

    if ((content.includes('password') || content.includes('token')) && !content.includes('Keychain') && !content.includes('Security')) {
        addFinding('ios.persistence.missing_keychain', 'critical', filePath, 1,
            'Sensitive data detected but no Keychain usage');
    }

    if (content.includes('NSManagedObjectContext') && content.includes('.main')) {
        addFinding('ios.persistence.core_data_on_main', 'high', filePath, 1,
            'Core Data operations on main thread - use background context');
    }

    if (content.includes('NSPersistentContainer') && !content.includes('NSMigrationManager')) {
        addFinding('ios.persistence.missing_migration', 'medium', filePath, 1,
            'Core Data without migration strategy');
    }
}

function analyzeCombine({ content, filePath, addFinding }) {
    if (content.includes('.sink(') && !content.includes('AnyCancellable')) {
        addFinding('ios.combine.missing_cancellables', 'high', filePath, 1,
            'Combine sink without storing AnyCancellable - memory leak');
    }

    if (content.includes('@Published') && !content.includes('import Combine')) {
        addFinding('ios.combine.published_without_combine', 'high', filePath, 1,
            '@Published used but Combine not imported');
    }

    if (content.includes('.sink(') && !content.includes('receiveCompletion')) {
        addFinding('ios.combine.error_handling', 'medium', filePath, 1,
            'Combine subscriber without error handling (receiveCompletion)');
    }

    if (content.includes('Future<') && !content.includes('async')) {
        addFinding('ios.combine.prefer_async_await', 'low', filePath, 1,
            'Combine Future for single value - consider async/await instead');
    }
}

function analyzeConcurrency({ content, filePath, addFinding }) {
    if (content.includes('DispatchQueue') && !content.includes('async func')) {
        addFinding('ios.concurrency.dispatchqueue_old', 'medium', filePath, 1,
            'Using DispatchQueue - prefer async/await for new code');
    }

    if (content.includes('DispatchQueue.main') && content.includes('UI')) {
        addFinding('ios.concurrency.missing_mainactor', 'medium', filePath, 1,
            'Manual main thread dispatch - use @MainActor annotation');
    }

    if (content.includes('Task {')) {
        const hasCancelCheck = content.includes('Task.isCancelled') ||
            content.includes('Task.checkCancellation') ||
            content.includes('withTaskCancellationHandler') ||
            content.includes('.cancel()');

        if (!hasCancelCheck) {
            addFinding('ios.concurrency.task_cancellation', 'low', filePath, 1,
                'Task without cancellation handling - consider guard !Task.isCancelled or try Task.checkCancellation()');
        }
    }

    if (content.includes('var ') && content.includes('queue') && !content.includes('actor')) {
        addFinding('ios.concurrency.actor_missing', 'medium', filePath, 1,
            'Manual synchronization with queue - consider actor for thread safety');
    }
}

function analyzeTesting({ content, filePath, addFinding }) {
    if (filePath.includes('Test') && !content.includes('XCTest') && !content.includes('Quick')) {
        addFinding('ios.testing.missing_xctest', 'high', filePath, 1,
            'Test file without XCTest or Quick import');
    }

    if (filePath.includes('Test') && content.includes('func test')) {
        const hasMakeSUT = /func\s+(private\s+)?make[Ss][Uu][Tt]\b/.test(content) ||
            /func\s+(private\s+)?make_sut\b/.test(content) ||
            /func\s+(private\s+)?sut\b/.test(content);
        const testCount = (content.match(/func\s+test/g) || []).length;

        if (!hasMakeSUT && testCount >= 3) {
            addFinding('ios.testing.missing_makesut', 'medium', filePath, 1,
                'Test without makeSUT pattern - centralize system under test creation');
        }
    }

    if (filePath.includes('Test') && !content.includes('trackForMemoryLeaks') && content.includes('class')) {
        addFinding('ios.testing.missing_memory_leak_tracking', 'medium', filePath, 1,
            'Test without trackForMemoryLeaks helper');
    }

    if (filePath.includes('Test') && content.includes('init(') && !content.includes('Protocol')) {
        addFinding('ios.testing.concrete_dependencies', 'medium', filePath, 1,
            'Test using concrete dependencies - inject protocols for testability');
    }
}

function analyzeUITesting({ content, filePath, addFinding }) {
    if (filePath.includes('UITest') && !content.includes('XCTest')) {
        addFinding('ios.uitesting.missing_xctest', 'medium', filePath, 1,
            'UI Test without XCTest import');
    }

    if (filePath.includes('UITest') && !content.includes('XCUIApplication')) {
        addFinding('ios.uitesting.missing_application_launch', 'medium', filePath, 1,
            'UI Test missing XCUIApplication launch');
    }
}

module.exports = {
    analyzeSwiftModerno,
    analyzeSwiftUI,
    analyzeUIKit,
    analyzeProtocolOriented,
    analyzeValueTypes,
    analyzeMemoryManagement,
    analyzeOptionals,
    analyzeDependencyInjection,
    analyzeNetworking,
    analyzePersistence,
    analyzeCombine,
    analyzeConcurrency,
    analyzeTesting,
    analyzeUITesting,
};
