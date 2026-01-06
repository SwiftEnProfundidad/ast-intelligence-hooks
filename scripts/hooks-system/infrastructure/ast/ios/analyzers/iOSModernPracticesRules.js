/**
 * iOS Modern Practices Rules (Swift 6.2 / iOS 17+ / 2026)
 *
 * Enforces modern Swift/iOS practices:
 * - Forbidden third-party libraries (Alamofire, Swinject, Quick/Nimble, etc.)
 * - Forbidden dependency managers (CocoaPods, Carthage)
 * - Forbidden legacy patterns (GCD, ObservableObject, NavigationView, etc.)
 * - Modern alternatives enforcement (@Observable, NavigationStack, Swift Testing, etc.)
 */

const { pushFinding } = require('../../ast-core');
const fs = require('fs');
const path = require('path');

const FORBIDDEN_IMPORTS = {
    'Alamofire': {
        severity: 'critical',
        message: 'Alamofire is forbidden - use URLSession with async/await',
        suggestion: 'Replace with native URLSession. See rulesios.mdc for APIClient example.'
    },
    'Swinject': {
        severity: 'critical',
        message: 'Swinject is forbidden - use manual DI or @Environment',
        suggestion: 'Use initializer injection or SwiftUI @Environment for dependency injection.'
    },
    'Quick': {
        severity: 'critical',
        message: 'Quick is forbidden - use Swift Testing framework',
        suggestion: 'Migrate to Swift Testing with @Test, @Suite, #expect, #require.'
    },
    'Nimble': {
        severity: 'critical',
        message: 'Nimble is forbidden - use Swift Testing framework',
        suggestion: 'Use #expect and #require from Swift Testing instead of Nimble matchers.'
    },
    'RxSwift': {
        severity: 'high',
        message: 'RxSwift is discouraged - use Combine or async/await',
        suggestion: 'Migrate to Combine for reactive streams or async/await for single values.'
    },
    'RxCocoa': {
        severity: 'high',
        message: 'RxCocoa is discouraged - use Combine or async/await',
        suggestion: 'Migrate to Combine for UI bindings.'
    },
    'Realm': {
        severity: 'high',
        message: 'Realm is discouraged - use SwiftData (iOS 17+) or Core Data',
        suggestion: 'Migrate to SwiftData for modern persistence.'
    },
    'GRDB': {
        severity: 'medium',
        message: 'GRDB is discouraged - prefer SwiftData for new projects',
        suggestion: 'Consider SwiftData for new development.'
    },
    'KeychainAccess': {
        severity: 'medium',
        message: 'KeychainAccess wrapper is discouraged - use native KeychainServices',
        suggestion: 'Use Security framework KeychainServices directly.'
    },
    'SwiftyJSON': {
        severity: 'critical',
        message: 'SwiftyJSON is forbidden - use Codable',
        suggestion: 'Use native Codable protocol for JSON parsing.'
    },
    'ObjectMapper': {
        severity: 'critical',
        message: 'ObjectMapper is forbidden - use Codable',
        suggestion: 'Use native Codable protocol for JSON mapping.'
    },
    'Kingfisher': {
        severity: 'medium',
        message: 'Kingfisher is discouraged - use AsyncImage (iOS 15+)',
        suggestion: 'Use SwiftUI AsyncImage for image loading.'
    },
    'SDWebImage': {
        severity: 'medium',
        message: 'SDWebImage is discouraged - use AsyncImage (iOS 15+)',
        suggestion: 'Use SwiftUI AsyncImage for image loading.'
    }
};

const FORBIDDEN_PATTERNS = [
    {
        pattern: /DispatchQueue\.main\.async\s*\{/,
        ruleId: 'ios.concurrency.forbidden_gcd_main',
        severity: 'high',
        message: 'DispatchQueue.main.async is forbidden - use @MainActor or MainActor.run',
        suggestion: 'Use: await MainActor.run { } or mark function with @MainActor'
    },
    {
        pattern: /DispatchQueue\.global\(\)\.async\s*\{/,
        ruleId: 'ios.concurrency.forbidden_gcd_global',
        severity: 'high',
        message: 'DispatchQueue.global().async is forbidden - use Task { }',
        suggestion: 'Use: Task { await ... } for background work'
    },
    {
        pattern: /DispatchGroup\s*\(/,
        ruleId: 'ios.concurrency.forbidden_dispatch_group',
        severity: 'high',
        message: 'DispatchGroup is forbidden - use TaskGroup',
        suggestion: 'Use: await withTaskGroup(of:) { group in ... }'
    },
    {
        pattern: /DispatchSemaphore\s*\(/,
        ruleId: 'ios.concurrency.forbidden_dispatch_semaphore',
        severity: 'high',
        message: 'DispatchSemaphore is forbidden - use actor or async/await',
        suggestion: 'Use actor for thread-safe state or AsyncStream for synchronization'
    },
    {
        pattern: /OperationQueue\s*\(/,
        ruleId: 'ios.concurrency.forbidden_operation_queue',
        severity: 'medium',
        message: 'OperationQueue is discouraged - use TaskGroup for most cases',
        suggestion: 'Use TaskGroup unless you need complex cancellation dependencies'
    },
    {
        pattern: /:\s*ObservableObject\b/,
        ruleId: 'ios.swiftui.deprecated_observable_object',
        severity: 'high',
        message: 'ObservableObject is deprecated for iOS 17+ - use @Observable macro',
        suggestion: 'Replace class: ObservableObject with @Observable final class'
    },
    {
        pattern: /@Published\s+var\b/,
        ruleId: 'ios.swiftui.deprecated_published',
        severity: 'medium',
        message: '@Published is deprecated for iOS 17+ - use @Observable macro',
        suggestion: 'With @Observable, properties are automatically observed without @Published'
    },
    {
        pattern: /@StateObject\s+var\b/,
        ruleId: 'ios.swiftui.deprecated_state_object',
        severity: 'medium',
        message: '@StateObject is deprecated for iOS 17+ - use @State with @Observable',
        suggestion: 'Use @State var viewModel = ViewModel() with @Observable ViewModel'
    },
    {
        pattern: /@ObservedObject\s+var\b/,
        ruleId: 'ios.swiftui.deprecated_observed_object',
        severity: 'medium',
        message: '@ObservedObject is deprecated for iOS 17+ - use @Bindable',
        suggestion: 'Use @Bindable var viewModel for @Observable objects passed as parameters'
    },
    {
        pattern: /@EnvironmentObject\s+var\b/,
        ruleId: 'ios.swiftui.deprecated_environment_object',
        severity: 'medium',
        message: '@EnvironmentObject is deprecated for iOS 17+ - use @Environment',
        suggestion: 'Use @Environment with custom EnvironmentKey for DI'
    },
    {
        pattern: /\bNavigationView\s*\{/,
        ruleId: 'ios.swiftui.deprecated_navigation_view',
        severity: 'high',
        message: 'NavigationView is deprecated - use NavigationStack (iOS 16+)',
        suggestion: 'Replace NavigationView with NavigationStack for modern navigation'
    },
    {
        pattern: /\bAnyView\s*\(/,
        ruleId: 'ios.swiftui.forbidden_any_view',
        severity: 'high',
        message: 'AnyView is forbidden - it breaks SwiftUI diffing and hurts performance',
        suggestion: 'Use @ViewBuilder, generics, or conditional views instead'
    },
    {
        pattern: /NSLocalizedString\s*\(/,
        ruleId: 'ios.i18n.deprecated_nslocalized_string',
        severity: 'medium',
        message: 'NSLocalizedString is deprecated - use String(localized:)',
        suggestion: 'Use String(localized: "key") for iOS 16+ or String Catalogs'
    },
    {
        pattern: /JSONSerialization\./,
        ruleId: 'ios.codable.forbidden_json_serialization',
        severity: 'critical',
        message: 'JSONSerialization is forbidden - use Codable',
        suggestion: 'Use JSONDecoder/JSONEncoder with Codable structs'
    },
    {
        pattern: /NSAttributedString\s*\(/,
        ruleId: 'ios.modern.deprecated_nsattributed_string',
        severity: 'low',
        message: 'NSAttributedString is legacy - consider AttributedString (iOS 15+)',
        suggestion: 'Use AttributedString for new code'
    },
    {
        pattern: /\.onAppear\s*\{\s*Task\s*\{/,
        ruleId: 'ios.swiftui.onappear_task_antipattern',
        severity: 'medium',
        message: '.onAppear { Task { } } is an anti-pattern - use .task modifier',
        suggestion: 'Use .task { await loadData() } which auto-cancels when View disappears'
    },
    {
        pattern: /completion\s*:\s*@escaping\s*\([^)]*\)\s*->\s*Void/,
        ruleId: 'ios.concurrency.completion_handler',
        severity: 'medium',
        message: 'Completion handlers are discouraged - use async/await',
        suggestion: 'Convert to async function: func fetch() async throws -> Data'
    }
];

const FORBIDDEN_FILES = [
    {
        filename: 'Podfile',
        ruleId: 'ios.deps.forbidden_cocoapods',
        severity: 'critical',
        message: 'CocoaPods is forbidden - use Swift Package Manager',
        suggestion: 'Migrate dependencies to Package.swift'
    },
    {
        filename: 'Podfile.lock',
        ruleId: 'ios.deps.forbidden_cocoapods',
        severity: 'critical',
        message: 'CocoaPods is forbidden - use Swift Package Manager',
        suggestion: 'Remove Podfile.lock and migrate to SPM'
    },
    {
        filename: 'Cartfile',
        ruleId: 'ios.deps.forbidden_carthage',
        severity: 'critical',
        message: 'Carthage is forbidden - use Swift Package Manager',
        suggestion: 'Migrate dependencies to Package.swift'
    },
    {
        filename: 'Cartfile.resolved',
        ruleId: 'ios.deps.forbidden_carthage',
        severity: 'critical',
        message: 'Carthage is forbidden - use Swift Package Manager',
        suggestion: 'Remove Cartfile.resolved and migrate to SPM'
    },
    {
        filename: 'Localizable.strings',
        ruleId: 'ios.i18n.deprecated_localizable_strings',
        severity: 'medium',
        message: 'Localizable.strings is deprecated - use String Catalogs (.xcstrings)',
        suggestion: 'Migrate to String Catalogs in Xcode 15+'
    }
];

class iOSModernPracticesRules {
    constructor(findings, projectRoot) {
        this.findings = findings;
        this.projectRoot = projectRoot;
    }

    analyze() {
        this.checkForbiddenFiles();
    }

    analyzeFile(filePath, content) {
        if (!content) {
            try {
                content = fs.readFileSync(filePath, 'utf-8');
            } catch (error) {
                if (process.env.DEBUG) {
                    console.debug(`[iOSModernPracticesRules] Failed to read file ${filePath}: ${error.message}`);
                }
                return;
            }
        }

        this.checkForbiddenImports(filePath, content);
        this.checkForbiddenPatterns(filePath, content);
        this.checkModernAlternatives(filePath, content);
    }

    checkForbiddenFiles() {
        for (const forbidden of FORBIDDEN_FILES) {
            const possiblePaths = [
                path.join(this.projectRoot, forbidden.filename),
                path.join(this.projectRoot, 'ios', forbidden.filename),
                path.join(this.projectRoot, 'iOS', forbidden.filename)
            ];

            for (const filePath of possiblePaths) {
                if (fs.existsSync(filePath)) {
                    pushFinding(this.findings, {
                        ruleId: forbidden.ruleId,
                        severity: forbidden.severity,
                        message: forbidden.message,
                        filePath: filePath,
                        line: 1,
                        suggestion: forbidden.suggestion
                    });
                }
            }
        }
    }

    checkForbiddenImports(filePath, content) {
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line.startsWith('import ')) {
                const importName = line.replace('import ', '').trim();

                if (FORBIDDEN_IMPORTS[importName]) {
                    const rule = FORBIDDEN_IMPORTS[importName];
                    pushFinding(this.findings, {
                        ruleId: `ios.imports.forbidden_${importName.toLowerCase()}`,
                        severity: rule.severity,
                        message: rule.message,
                        filePath,
                        line: i + 1,
                        suggestion: rule.suggestion
                    });
                }
            }
        }
    }

    checkForbiddenPatterns(filePath, content) {
        const isTestFile = /\.(spec|test)\.swift$/i.test(filePath) || filePath.includes('Tests/');

        for (const pattern of FORBIDDEN_PATTERNS) {
            if (pattern.ruleId.includes('deprecated_') && isTestFile) {
                continue;
            }

            const match = content.match(pattern.pattern);
            if (match) {
                const line = this.findLineNumber(content, match[0]);
                pushFinding(this.findings, {
                    ruleId: pattern.ruleId,
                    severity: pattern.severity,
                    message: pattern.message,
                    filePath,
                    line,
                    suggestion: pattern.suggestion
                });
            }
        }
    }

    checkModernAlternatives(filePath, content) {
        const hasSwiftUI = content.includes('import SwiftUI');

        if (hasSwiftUI) {
            const hasNavigationStack = content.includes('NavigationStack');
            const hasNavigationLink = content.includes('NavigationLink');
            const hasNavigationDestination = content.includes('.navigationDestination');

            if (hasNavigationLink && !hasNavigationStack && !hasNavigationDestination) {
                pushFinding(this.findings, {
                    ruleId: 'ios.swiftui.legacy_navigation',
                    severity: 'medium',
                    message: 'Using NavigationLink without NavigationStack - consider modern navigation',
                    filePath,
                    line: this.findLineNumber(content, 'NavigationLink'),
                    suggestion: 'Use NavigationStack with .navigationDestination(for:) for type-safe navigation'
                });
            }

            const hasViewThatFits = content.includes('ViewThatFits');
            const hasGeometryReader = (content.match(/GeometryReader/g) || []).length;

            if (hasGeometryReader > 2 && !hasViewThatFits) {
                pushFinding(this.findings, {
                    ruleId: 'ios.swiftui.excessive_geometry_reader',
                    severity: 'low',
                    message: `Multiple GeometryReader usage (${hasGeometryReader}) - consider ViewThatFits or Layout protocol`,
                    filePath,
                    line: this.findLineNumber(content, 'GeometryReader'),
                    suggestion: 'Use ViewThatFits for adaptive layouts or custom Layout protocol (iOS 16+)'
                });
            }
        }

        const hasXCTest = content.includes('import XCTest');
        const hasSwiftTesting = content.includes('import Testing');
        const isTestFile = filePath.includes('Tests') || filePath.includes('Spec');

        if (isTestFile && hasXCTest && !hasSwiftTesting) {
            const hasTestMacro = content.includes('@Test');

            if (!hasTestMacro) {
                pushFinding(this.findings, {
                    ruleId: 'ios.testing.legacy_xctest',
                    severity: 'low',
                    message: 'Using XCTest - consider Swift Testing for new tests',
                    filePath,
                    line: this.findLineNumber(content, 'import XCTest'),
                    suggestion: 'Use import Testing with @Test, @Suite, #expect, #require for modern testing'
                });
            }
        }

        if (content.includes('any ') && !content.includes('// any intentional')) {
            const anyCount = (content.match(/\bany\s+\w+Protocol\b/g) || []).length;
            if (anyCount > 3) {
                pushFinding(this.findings, {
                    ruleId: 'ios.generics.excessive_type_erasure',
                    severity: 'medium',
                    message: `Excessive type erasure with 'any' (${anyCount} occurrences) - use generics`,
                    filePath,
                    line: 1,
                    suggestion: 'Use generic constraints instead of any for better performance'
                });
            }
        }
    }

    findLineNumber(content, text) {
        const idx = content.indexOf(text);
        if (idx === -1) return 1;
        return content.substring(0, idx).split('\n').length;
    }
}

module.exports = { iOSModernPracticesRules };
